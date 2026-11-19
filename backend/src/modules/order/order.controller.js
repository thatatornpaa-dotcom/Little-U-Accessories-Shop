import { prisma } from "../../lib/db";
import {
  getPlatformSettings,
  calculateShopPricing,
} from "../admin/platform-settings.service";
import { isProductPubliclyVisible } from "../product/product.service";
import {
  settleSubOrder,
  parentStatusToSubOrderStatus,
} from "./settlement.service";
import { writeAuditLog } from "../admin/audit.service";

const VALID_ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "PRODUCING",
  "PARTIALLY_SHIPPED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
];
const VALID_SHIPPING_STATUSES = [
  "PENDING",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
];

function generateCustomOrderId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "BAB";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/orders
const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

export const createOrder = async (c) => {
  try {
    const user = c.get("currentUser");
    const { shippingAddress, recipientName, recipientPhone } =
      await c.req.json();

    if (!shippingAddress || !recipientName || !recipientPhone) {
      return c.json(
        {
          error:
            "shippingAddress, recipientName, and recipientPhone are required",
        },
        400,
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: { select: { id: true, status: true } },
                customOptions: { include: { values: true } },
              },
            },
            accessories: { include: { accessory: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return c.json({ error: "Your cart is empty" }, 400);
    }

    const settings = await getPlatformSettings();
    const groups = new Map();
    const itemsToCreate = [];
    let goodsTotal = 0;

    for (const item of cart.items) {
      const product = item.product;

      if (!isProductPubliclyVisible(product)) {
        return c.json(
          {
            error: `สินค้า '${product.name}' ถูกปิดการมองเห็นหรือร้านถูกระงับ`,
          },
          409,
        );
      }

      if (product.type === "READY_TO_SHIP" && product.stock < item.quantity) {
        return c.json(
          {
            error: `Product '${product.name}' is out of stock or has insufficient quantity (Available: ${product.stock}, Requested: ${item.quantity})`,
          },
          400,
        );
      }

      let itemBasePrice = Number(product.price);
      if (item.customDetails && product.customOptions) {
        let selectedValues = [];
        if (typeof item.customDetails === "object") {
          selectedValues = Array.isArray(item.customDetails)
            ? item.customDetails.map((detail) => detail.value)
            : Object.values(item.customDetails);
        }
        for (const option of product.customOptions) {
          for (const value of option.values || []) {
            if (
              selectedValues.includes(value.value) &&
              value.priceAdjustment
            ) {
              itemBasePrice += Number(value.priceAdjustment);
            }
          }
        }
      }

      let itemTotalPrice = itemBasePrice * item.quantity;
      const orderItemAccessories = [];
      for (const cartAccessory of item.accessories) {
        const accessoryPrice = Number(cartAccessory.accessory.price);
        itemTotalPrice += accessoryPrice * cartAccessory.quantity;
        orderItemAccessories.push({
          accessoryId: cartAccessory.accessoryId,
          quantity: cartAccessory.quantity,
          price: accessoryPrice,
        });
      }

      itemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        price: itemBasePrice,
        customDetails: item.customDetails,
        accessories: orderItemAccessories,
        groupKey: product.shopId || "__platform__",
      });

      goodsTotal += itemTotalPrice;
      const group = groups.get(product.shopId || "__platform__") || {
        shopId: product.shopId || null,
        subtotal: 0,
      };
      group.subtotal += itemTotalPrice;
      groups.set(product.shopId || "__platform__", group);
    }

    let shippingTotal = 0;
    for (const group of groups.values()) {
      const pricing = calculateShopPricing(group.subtotal, settings);
      group.pricing = group.shopId
        ? pricing
        : { ...pricing, commissionRate: 0, commissionAmount: 0, netAmount: roundMoney(group.subtotal) };
      shippingTotal += group.pricing.shippingFee;
    }

    const finalTotalPrice = roundMoney(goodsTotal + shippingTotal);

    const newOrder = await prisma.$transaction(async (tx) => {
      const orderId = generateCustomOrderId();
      const order = await tx.order.create({
        data: {
          id: orderId,
          userId: user.id,
          status: "PENDING",
          totalPrice: finalTotalPrice,
          shippingFee: roundMoney(shippingTotal),
          shippingAddress,
          recipientName,
          recipientPhone,
          payment: {
            create: {
              amount: finalTotalPrice,
              paymentMethod: "PENDING",
              status: "PENDING",
            },
          },
          shipping: {
            create: { status: "PENDING", carrier: "MockShipping" },
          },
        },
      });

      const subOrderIdByGroup = new Map();
      let groupIndex = 0;
      for (const [groupKey, group] of groups.entries()) {
        if (!group.shopId) continue;
        groupIndex += 1;
        const subOrder = await tx.subOrder.create({
          data: {
            orderId: order.id,
            shopId: group.shopId,
            subOrderNumber: `SUB-${order.id}-${groupIndex}`,
            status: "PENDING",
            subtotal: roundMoney(group.pricing.subtotal),
            shippingFee: roundMoney(group.pricing.shippingFee),
            commissionRate: group.pricing.commissionRate,
            commissionAmount: roundMoney(group.pricing.commissionAmount),
            netAmount: roundMoney(group.pricing.netAmount),
          },
        });
        subOrderIdByGroup.set(groupKey, subOrder.id);
      }

      for (const item of itemsToCreate) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            subOrderId: subOrderIdByGroup.get(item.groupKey) || null,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            customDetails: item.customDetails,
          },
        });

        for (const accessory of item.accessories) {
          await tx.orderItemAccessory.create({
            data: {
              orderItemId: orderItem.id,
              accessoryId: accessory.accessoryId,
              quantity: accessory.quantity,
              price: accessory.price,
            },
          });
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { type: true },
        });
        if (product?.type === "READY_TO_SHIP") {
          const stockUpdate = await tx.product.updateMany({
            where: {
              id: item.productId,
              type: "READY_TO_SHIP",
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });
          if (stockUpdate.count !== 1) {
            const stockError = new Error("OUT_OF_STOCK");
            stockError.code = "OUT_OF_STOCK";
            throw stockError;
          }
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });

    return c.json(
      {
        success: true,
        message: "Order created successfully",
        orderId: newOrder.id,
        totalPrice: finalTotalPrice,
        shippingFee: roundMoney(shippingTotal),
        subOrderCount: [...groups.values()].filter((group) => group.shopId)
          .length,
      },
      201,
    );
  } catch (error) {
    if (error?.code === "OUT_OF_STOCK") {
      return c.json(
        { error: "สินค้าบางรายการมีสต็อกไม่เพียงพอ กรุณาตรวจสอบตะกร้าใหม่" },
        409,
      );
    }
    console.error("Create order error:", error);
    return c.json({ error: "Failed to create order" }, 500);
  }
};

// GET /api/orders
export const getOrderHistory = async (c) => {
  try {
    const user = c.get("currentUser");

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { position: "asc" } }
              }
            },
            accessories: {
              include: {
                accessory: true
              }
            }
          }
        },
        payment: true,
        shipping: true,
        subOrders: {
          include: { shop: { select: { id: true, name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" }
    });

    return c.json({ success: true, orders });
  } catch (error) {
    console.error("Get order history error:", error);
    return c.json({ error: "Failed to retrieve order history" }, 500);
  }
};

// GET /api/orders/admin (Backoffice)
export const getAdminOrders = async (c) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                customOptions: {
                  include: {
                    values: true
                  }
                }
              }
            },
            accessories: {
              include: {
                accessory: true
              }
            }
          }
        },
        payment: true,
        shipping: true,
        subOrders: {
          include: { shop: { select: { id: true, name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" }
    });

    return c.json({ success: true, orders });
  } catch (error) {
    console.error("Get admin orders error:", error);
    return c.json({ error: "Failed to retrieve orders" }, 500);
  }
};

// PUT /api/orders/admin/:id (Backoffice Update)
export const updateAdminOrder = async (c) => {
  try {
    const id = c.req.param("id");
    const { status, trackingNumber, carrier, shippingStatus } = await c.req.json();

    if (status !== undefined && !VALID_ORDER_STATUSES.includes(status)) {
      return c.json({ error: "สถานะคำสั่งซื้อไม่ถูกต้อง" }, 400);
    }
    if (
      shippingStatus !== undefined &&
      !VALID_SHIPPING_STATUSES.includes(shippingStatus)
    ) {
      return c.json({ error: "สถานะการจัดส่งไม่ถูกต้อง" }, 400);
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        shipping: true,
        subOrders: true,
        payment: { select: { status: true, paidAt: true } },
      },
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    const nextStatus = status !== undefined ? status : order.status;
    const subOrderStatus = parentStatusToSubOrderStatus(nextStatus);

    const statusesRequiringPayment = [
      "PAID",
      "PROCESSING",
      "PRODUCING",
      "PARTIALLY_SHIPPED",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
    ];
    if (
      statusesRequiringPayment.includes(nextStatus) &&
      (order.payment?.status !== "SUCCESS" ||
        order.status === "CANCELLED")
    ) {
      return c.json(
        {
          error:
            "ไม่สามารถเปลี่ยนสถานะนี้ได้ เพราะยังไม่ได้รับชำระหรือออเดอร์ถูกยกเลิก",
        },
        409,
      );
    }
    const effectiveShippingStatus = ["DELIVERED", "COMPLETED"].includes(
      nextStatus,
    )
      ? "DELIVERED"
      : shippingStatus;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: nextStatus },
      });

      if (status !== undefined && subOrderStatus) {
        await tx.subOrder.updateMany({
          where: {
            orderId: id,
            status: { notIn: ["CANCELLED", "REFUNDED"] },
          },
          data: {
            status: subOrderStatus,
            ...(subOrderStatus === "DELIVERED"
              ? { deliveredAt: new Date() }
              : {}),
            ...(subOrderStatus === "COMPLETED"
              ? { completedAt: new Date() }
              : {}),
            ...(subOrderStatus === "SHIPPED" ? { shippedAt: new Date() } : {}),
          },
        });
      }

      if (
        order.shipping &&
        (trackingNumber !== undefined ||
          carrier !== undefined ||
          effectiveShippingStatus !== undefined ||
          ["DELIVERED", "COMPLETED"].includes(nextStatus))
      ) {
        let shippedAt = order.shipping.shippedAt;
        let deliveredAt = order.shipping.deliveredAt;

        if (effectiveShippingStatus === "IN_TRANSIT" && !shippedAt) {
          shippedAt = new Date();
        }
        if (effectiveShippingStatus === "DELIVERED" && !deliveredAt) {
          deliveredAt = new Date();
        }

        await tx.shipping.update({
          where: { orderId: id },
          data: {
            trackingNumber: trackingNumber !== undefined ? trackingNumber : order.shipping.trackingNumber,
            carrier: carrier !== undefined ? carrier : order.shipping.carrier,
            status:
              effectiveShippingStatus !== undefined
                ? effectiveShippingStatus
                : order.shipping.status,
            shippedAt,
            deliveredAt
          }
        });
      }

      if (["DELIVERED", "COMPLETED"].includes(subOrderStatus)) {
        const settledSubOrders = await tx.subOrder.findMany({
          where: {
            orderId: id,
            status: { notIn: ["CANCELLED", "REFUNDED"] },
            settledAt: null,
          },
        });
        for (const subOrder of settledSubOrders) {
          await settleSubOrder(tx, subOrder);
        }
      }

      await writeAuditLog(tx, c, {
        action: "ORDER_UPDATE",
        targetType: "ORDER",
        targetId: id,
        before: {
          status: order.status,
          shippingStatus: order.shipping?.status || null,
        },
        after: {
          status: nextStatus,
          shippingStatus:
            effectiveShippingStatus !== undefined
              ? effectiveShippingStatus
              : order.shipping?.status || null,
        },
      });

      return updated;
    });

    return c.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Update admin order error:", error);
    return c.json({ error: "Failed to update order" }, 500);
  }
};

export const getOrderById = async (c) => {
  const user = c.get("currentUser");
  const { id } = c.req.param();

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
          accessories: {
            include: {
              accessory: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return c.json(
      {
        success: false,
        error: "Order not found",
      },
      404
    );
  }

  return c.json({
    success: true,
    order,
  });
};

const REFUND_REASONS = [
  "ได้รับสินค้าไม่ตรงกับที่สั่ง",
  "สินค้าเสียหายหรือมีตำหนิ",
  "ได้รับสินค้าไม่ครบ",
  "สินค้าไม่ตรงตามรายละเอียด",
  "เปลี่ยนใจ",
  "อื่น ๆ",
];

export const confirmOrderReceived = async (c) => {
  try {
    const user = c.get("currentUser");
    const id = c.req.param("id");

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { subOrders: true },
    });

    if (!order) return c.json({ error: "ไม่พบคำสั่งซื้อ" }, 404);

    if (order.status === "COMPLETED") {
      return c.json({ success: true, order });
    }

    if (order.status !== "DELIVERED") {
      return c.json({ error: "คำสั่งซื้อยังไม่อยู่ในสถานะส่งถึงแล้ว" }, 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({
        where: { id, userId: user.id, status: "DELIVERED" },
        data: { status: "COMPLETED" },
      });

      if (changed.count === 0) {
        const current = await tx.order.findFirst({
          where: { id, userId: user.id },
        });
        return current;
      }

      const completedStatus = parentStatusToSubOrderStatus("COMPLETED");

      if (completedStatus) {
        await tx.subOrder.updateMany({
          where: {
            orderId: id,
            status: { notIn: ["CANCELLED", "REFUNDED"] },
          },
          data: {
            status: completedStatus,
            completedAt: new Date(),
          },
        });

        const unsettled = await tx.subOrder.findMany({
          where: {
            orderId: id,
            status: completedStatus,
            settledAt: null,
          },
        });

        for (const subOrder of unsettled) {
          await settleSubOrder(tx, subOrder);
        }
      }

      return tx.order.findUnique({ where: { id } });
    });

    return c.json({ success: true, order: result });
  } catch (error) {
    console.error("Confirm received error:", error);
    return c.json({ error: "ไม่สามารถยืนยันรับสินค้าได้" }, 500);
  }
};

export const createRefundRequest = async (c) => {
  try {
    const user = c.get("currentUser");
    const orderId = c.req.param("id");
    const body = await c.req.json();

    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const condition =
      typeof body.condition === "string" ? body.condition.trim() : "";
    const details =
      typeof body.details === "string" ? body.details.trim() : "";
    const orderItemId =
      typeof body.orderItemId === "string" && body.orderItemId
        ? body.orderItemId
        : null;
    const images = Array.isArray(body.images) ? body.images : [];

    if (!REFUND_REASONS.includes(reason)) {
      return c.json({ error: "กรุณาเลือกเหตุผลในการคืนสินค้า" }, 400);
    }

    if (!condition) {
      return c.json({ error: "กรุณาระบุสภาพสินค้า" }, 400);
    }

    if (details.length > 2000) {
      return c.json({ error: "รายละเอียดต้องไม่เกิน 2,000 ตัวอักษร" }, 400);
    }

    if (
      images.length > 5 ||
      images.some((url) => typeof url !== "string" || url.length > 2048)
    ) {
      return c.json({ error: "แนบรูปได้ไม่เกิน 5 รูป" }, 400);
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    });

    if (!order) return c.json({ error: "ไม่พบคำสั่งซื้อ" }, 404);

    if (!["DELIVERED", "COMPLETED"].includes(order.status)) {
      return c.json(
        { error: "ส่งคำขอคืนสินค้าได้เมื่อคำสั่งซื้อส่งถึงแล้วเท่านั้น" },
        409,
      );
    }

    let amount = Number(order.totalPrice);

    if (orderItemId) {
      const item = await prisma.orderItem.findFirst({
        where: { id: orderItemId, orderId },
        include: { accessories: true },
      });

      if (!item) {
        return c.json({ error: "สินค้าไม่อยู่ในคำสั่งซื้อนี้" }, 400);
      }

      amount =
        Number(item.price) * item.quantity +
        item.accessories.reduce(
          (sum, accessory) =>
            sum + Number(accessory.price) * accessory.quantity,
          0,
        );
    }

    const pendingRequest = await prisma.refundRequest.findFirst({
      where: { orderId, userId: user.id, status: "PENDING" },
    });

    if (pendingRequest) {
      return c.json(
        { error: "มีคำขอคืนสินค้าที่กำลังตรวจสอบอยู่แล้ว" },
        409,
      );
    }

    const refundRequest = await prisma.refundRequest.create({
      data: {
        orderId,
        orderItemId,
        userId: user.id,
        reason,
        condition,
        details: details || null,
        images,
        amount,
        status: "PENDING",
      },
    });

    return c.json({ success: true, refundRequest }, 201);
  } catch (error) {
    console.error("Create refund request error:", error);
    return c.json({ error: "ไม่สามารถส่งคำขอคืนสินค้าได้" }, 500);
  }
};

export const getAdminOrderById = async (c) => {
  try {
    const { id } = c.req.param();
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                images: true,
                customOptions: {
                  include: {
                    values: true
                  }
                }
              }
            },
            accessories: {
              include: {
                accessory: true
              }
            }
          }
        },
        payment: true,
        shipping: true,
        subOrders: {
          include: { shop: { select: { id: true, name: true, slug: true } } },
        },
      }
    });

    if (!order) {
      return c.json({ success: false, error: "Order not found" }, 404);
    }

    return c.json({ success: true, order });
  } catch (error) {
    console.error("Get admin order by ID error:", error);
    return c.json({ success: false, error: "Failed to retrieve order" }, 500);
  }
};