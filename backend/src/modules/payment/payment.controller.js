import { prisma } from "../../lib/db";

// POST /api/payments/checkout
export const processCheckout = async (c) => {
  try {
    const user = c.get("currentUser");
    const { orderId, token, source, method } = await c.req.json();

    if (!orderId) {
      return c.json({ error: "orderId is required" }, 400);
    }

    // 1. Fetch Order and associated Payment
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (order.userId !== user.id) {
      return c.json({ error: "Unauthorized: This order does not belong to you" }, 403);
    }

    if (order.status !== "PENDING" && order.status !== "CANCELLED") {
      return c.json({ error: `Order is already ${order.status}` }, 400);
    }

    const omiseSecret = process.env.OMISE_SECRET_KEY;
    const amountInSatang = Math.round(Number(order.totalPrice) * 100);

    let chargeResult;

    if (omiseSecret) {
      console.log(`Connecting to Omise for order ${orderId} (Amount: ${amountInSatang} satang)...`);
      try {
        const authHeader = "Basic " + Buffer.from(omiseSecret + ":").toString("base64");
        
        const payload = {
          amount: amountInSatang,
          currency: "thb",
          capture: true
        };

        if (token) {
          payload.card = token;
        } else if (source) {
          payload.source = source;
        } else if (method === "PROMPTPAY") {
          // Create PromptPay source
          console.log("Creating Omise PromptPay Source...");
          const sourceResponse = await fetch("https://api.omise.co/sources", {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              amount: amountInSatang,
              currency: "thb",
              type: "promptpay"
            })
          });
          const sourceData = await sourceResponse.json();
          if (!sourceResponse.ok || sourceData.object === "error") {
            console.error("Omise Source Creation Error:", sourceData);
            return c.json({ error: sourceData.message || "Failed to create payment source" }, 400);
          }
          payload.source = sourceData.id;
        } else {
          return c.json({ error: "Either token, source, or method=PROMPTPAY is required" }, 400);
        }

        const response = await fetch("https://api.omise.co/charges", {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || data.object === "error") {
          console.error("Omise Charge Error response:", data);
          return c.json({ error: data.message || "Payment gateway processing failed" }, 400);
        }

        chargeResult = {
          id: data.id,
          status: data.status, // "successful", "pending", "failed"
          paid: data.paid,
          failureMessage: data.failure_message,
          authorizeUri: data.authorize_uri,
          qrImageUrl: data.source?.scannable_code?.image?.download_uri || null
        };
      } catch (err) {
        console.error("Omise API Connection Error:", err);
        return c.json({ error: "Failed to connect to Omise payment gateway" }, 500);
      }
    } else {
      // Mock flow when no Omise Secret is set
      console.log("⚠️ OMISE_SECRET_KEY is not defined. Using Mock Payment Gateway.");
      chargeResult = {
        id: "chg_mock_" + Math.random().toString(36).substr(2, 9),
        status: "pending",
        paid: false,
        failureMessage: null,
        authorizeUri: null,
        qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=bareandbold_mock_promptpay_order_${orderId}`
      };
    }

    // 2. Process result
    const isSuccess = chargeResult.status === "successful" || chargeResult.paid;
    const paymentStatus = isSuccess ? "SUCCESS" : (chargeResult.status === "pending" ? "PENDING" : "FAILED");
    const orderStatus = isSuccess ? "PAID" : "PENDING";

    // Update payment and order status
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId: orderId },
        data: {
          status: paymentStatus,
          paymentMethod: method || (token ? "CREDIT_CARD" : "PROMPTPAY"),
          omiseChargeId: chargeResult.id,
          paidAt: isSuccess ? new Date() : null,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: orderStatus },
      });
      if (isSuccess) {
        await tx.subOrder.updateMany({
          where: { orderId, status: "PENDING" },
          data: { status: "PAID" },
        });
      }
    });

    return c.json({
      success: isSuccess,
      status: paymentStatus,
      chargeId: chargeResult.id,
      authorizeUri: chargeResult.authorizeUri,
      qrImageUrl: chargeResult.qrImageUrl,
      message: isSuccess ? "Payment completed successfully" : "Payment processing or failed"
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return c.json({ error: "An error occurred during payment processing" }, 500);
  }
};

// POST /api/payments/webhook
export const handleOmiseWebhook = async (c) => {
  try {
    const payload = await c.req.json();
    console.log("Received Omise Webhook event:", payload.key);

    if (payload.key === "charge.complete") {
      const charge = payload.data;
      console.log(`Charge complete event for charge ID: ${charge.id}, Status: ${charge.status}`);

      const payment = await prisma.payment.findFirst({
        where: { omiseChargeId: charge.id }
      });

      if (!payment) {
        console.warn(`Payment record with omiseChargeId ${charge.id} not found.`);
        return c.json({ success: false, message: "Payment not found" }, 404);
      }

      const isSuccess = charge.status === "successful" || charge.paid;
      const paymentStatus = isSuccess ? "SUCCESS" : (charge.status === "pending" ? "PENDING" : "FAILED");
      const orderStatus = isSuccess ? "PAID" : "PENDING";

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: paymentStatus,
            paidAt: isSuccess ? new Date() : null,
          },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: orderStatus },
        });
        if (isSuccess) {
          await tx.subOrder.updateMany({
            where: { orderId: payment.orderId, status: "PENDING" },
            data: { status: "PAID" },
          });
        }
      });

      console.log(`Successfully updated order ${payment.orderId} status to ${orderStatus}`);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error("Omise webhook error:", err);
    return c.json({ error: "Webhook handling failed" }, 500);
  }
};
