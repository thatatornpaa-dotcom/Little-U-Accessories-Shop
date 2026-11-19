import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/db";

const getShopId = (c) => c.get("currentShop")?.id;

const serializePayout = (payout) => ({
  ...payout,
  amount: Number(payout.amount),
  fee: Number(payout.fee),
  netAmount: Number(payout.netAmount),
});

// GET /api/seller/wallet
export const getMyWallet = async (c) => {
  try {
    const shopId = getShopId(c);
    if (!shopId) return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);

    const [shop, holds, transactions] = await Promise.all([
      prisma.shop.findUnique({
        where: { id: shopId },
        select: { balance: true },
      }),
      prisma.payoutRequest.aggregate({
        where: { shopId, status: { in: ["PENDING", "APPROVED"] } },
        _sum: { amount: true },
      }),
      prisma.shopTransaction.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const balance = Number(shop?.balance || 0);
    const heldAmount = Number(holds._sum.amount || 0);
    return c.json({
      success: true,
      wallet: {
        balance,
        heldAmount,
        availableBalance: Math.max(
          0,
          Math.round((balance - heldAmount) * 100) / 100,
        ),
        transactions: transactions.map((transaction) => ({
          ...transaction,
          amount: Number(transaction.amount),
        })),
      },
    });
  } catch (error) {
    console.error("Get seller wallet error:", error);
    return c.json({ error: "ไม่สามารถดึงข้อมูลกระเป๋าเงินได้" }, 500);
  }
};

// GET /api/seller/payouts
export const listMyPayouts = async (c) => {
  try {
    const shopId = getShopId(c);
    if (!shopId) return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);

    const payouts = await prisma.payoutRequest.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
    });
    return c.json({
      success: true,
      payouts: payouts.map(serializePayout),
    });
  } catch (error) {
    console.error("List seller payouts error:", error);
    return c.json({ error: "ไม่สามารถดึงรายการถอนเงินได้" }, 500);
  }
};

// POST /api/seller/payouts  { amount, clientRequestId? }
export const createMyPayout = async (c) => {
  try {
    const shopId = getShopId(c);
    if (!shopId) return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);

    const body = await c.req.json().catch(() => ({}));
    const amount = Math.round(Number(body.amount) * 100) / 100;
    const clientRequestId =
      String(body.clientRequestId || "").trim() || randomUUID();

    if (!Number.isFinite(amount) || amount <= 0) {
      return c.json({ error: "จำนวนเงินต้องมากกว่า 0" }, 400);
    }
    if (clientRequestId.length > 100) {
      return c.json({ error: "clientRequestId ยาวเกินกำหนด" }, 400);
    }

    const existing = await prisma.payoutRequest.findFirst({
      where: { shopId, clientRequestId },
    });
    if (existing) {
      return c.json({
        success: true,
        idempotent: true,
        payout: serializePayout(existing),
      });
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.status !== "APPROVED") {
      return c.json({ error: "ร้านค้าต้องได้รับอนุมัติก่อนถอนเงิน" }, 403);
    }
    if (
      !shop.bankName ||
      !shop.bankAccountNumber ||
      !shop.bankAccountName
    ) {
      return c.json(
        { error: "กรุณากรอกข้อมูลบัญชีธนาคารให้ครบก่อนขอถอนเงิน" },
        400,
      );
    }

    const payout = await prisma.$transaction(
      async (tx) => {
        const currentShop = await tx.shop.findUnique({
          where: { id: shopId },
          select: { balance: true },
        });
        const holds = await tx.payoutRequest.aggregate({
          where: { shopId, status: { in: ["PENDING", "APPROVED"] } },
          _sum: { amount: true },
        });
        const balance = Number(currentShop?.balance || 0);
        const heldAmount = Number(holds._sum.amount || 0);
        const available = Math.round((balance - heldAmount) * 100) / 100;

        if (amount > available) {
          const error = new Error("INSUFFICIENT_BALANCE");
          error.code = "INSUFFICIENT_BALANCE";
          throw error;
        }

        return tx.payoutRequest.create({
          data: {
            shopId,
            amount,
            fee: 0,
            netAmount: amount,
            bankName: shop.bankName,
            bankAccountNumber: shop.bankAccountNumber,
            bankAccountName: shop.bankAccountName,
            status: "PENDING",
            clientRequestId,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );

    return c.json(
      {
        success: true,
        message: "ส่งคำขอถอนเงินแล้ว",
        payout: serializePayout(payout),
      },
      201,
    );
  } catch (error) {
    if (error?.code === "INSUFFICIENT_BALANCE") {
      return c.json({ error: "ยอดเงินที่ถอนได้ไม่เพียงพอ" }, 409);
    }
    if (error?.code === "P2002") {
      return c.json({ error: "คำขอนี้ถูกสร้างแล้ว" }, 409);
    }
    if (error?.code === "P2034") {
      return c.json(
        { error: "มีคำขอถอนเงินอื่นกำลังดำเนินการ กรุณาลองใหม่อีกครั้ง" },
        409,
      );
    }
    console.error("Create seller payout error:", error);
    return c.json({ error: "ไม่สามารถสร้างคำขอถอนเงินได้" }, 500);
  }
};
