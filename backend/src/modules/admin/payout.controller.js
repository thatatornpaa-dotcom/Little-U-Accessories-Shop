import { prisma } from "../../lib/db";
import { writeAuditLog } from "./audit.service";

const PAYOUT_STATUSES = ["PENDING", "APPROVED", "TRANSFERRED", "REJECTED"];

const payoutInclude = {
  shop: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      balance: true,
      owner: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
    },
  },
};

const serializePayout = (payout) => ({
  ...payout,
  amount: Number(payout.amount),
  fee: Number(payout.fee),
  netAmount: Number(payout.netAmount),
  shop: payout.shop
    ? { ...payout.shop, balance: Number(payout.shop.balance) }
    : undefined,
});

// GET /api/admin/payouts
export const listPayouts = async (c) => {
  try {
    const status = String(c.req.query("status") || "").toUpperCase();
    const search = String(c.req.query("search") || "").trim();
    const where = {
      ...(PAYOUT_STATUSES.includes(status) ? { status } : {}),
      ...(search
        ? {
            OR: [
              { shop: { is: { name: { contains: search, mode: "insensitive" } } } },
              {
                shop: {
                  is: {
                    owner: {
                      is: {
                        email: { contains: search, mode: "insensitive" },
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [payouts, statusCounts] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        include: payoutInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payoutRequest.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    return c.json({
      success: true,
      payouts: payouts.map(serializePayout),
      counts: Object.fromEntries(
        statusCounts.map((entry) => [entry.status, entry._count._all]),
      ),
    });
  } catch (error) {
    console.error("List payouts error:", error);
    return c.json({ error: "ไม่สามารถดึงรายการถอนเงินได้" }, 500);
  }
};

// PUT /api/admin/payouts/:id/approve
export const approvePayout = async (c) => {
  try {
    const id = c.req.param("id");
    const payout = await prisma.payoutRequest.findUnique({ where: { id } });
    if (!payout) return c.json({ error: "ไม่พบคำขอถอนเงิน" }, 404);
    if (payout.status !== "PENDING") {
      return c.json({ error: "คำขอนี้ถูกดำเนินการแล้ว" }, 409);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.payoutRequest.updateMany({
        where: { id, status: "PENDING" },
        data: {
          status: "APPROVED",
          processedAt: new Date(),
          processedById: c.get("currentUser")?.id || null,
          rejectionReason: null,
        },
      });
      if (result.count !== 1) {
        const conflict = new Error("PAYOUT_STATE_CONFLICT");
        conflict.code = "PAYOUT_STATE_CONFLICT";
        throw conflict;
      }

      await writeAuditLog(tx, c, {
        action: "PAYOUT_APPROVE",
        targetType: "PAYOUT",
        targetId: id,
        before: { status: payout.status },
        after: { status: "APPROVED" },
      });

      return tx.payoutRequest.findUnique({
        where: { id },
        include: payoutInclude,
      });
    });

    return c.json({
      success: true,
      message: "อนุมัติคำขอถอนเงินแล้ว กรุณาโอนเงินและบันทึกหลักฐาน",
      payout: serializePayout(updated),
    });
  } catch (error) {
    if (error?.code === "PAYOUT_STATE_CONFLICT") {
      return c.json({ error: "คำขอนี้ถูกดำเนินการโดยผู้ใช้อื่นแล้ว" }, 409);
    }
    console.error("Approve payout error:", error);
    return c.json({ error: "ไม่สามารถอนุมัติคำขอถอนเงินได้" }, 500);
  }
};

// PUT /api/admin/payouts/:id/reject  { reason }
export const rejectPayout = async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const reason = String(body.reason || "").trim();
    if (!reason) {
      return c.json({ error: "กรุณาระบุเหตุผลที่ปฏิเสธ" }, 400);
    }

    const payout = await prisma.payoutRequest.findUnique({ where: { id } });
    if (!payout) return c.json({ error: "ไม่พบคำขอถอนเงิน" }, 404);
    if (!["PENDING", "APPROVED"].includes(payout.status)) {
      return c.json({ error: "ไม่สามารถปฏิเสธคำขอในสถานะนี้ได้" }, 409);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.payoutRequest.updateMany({
        where: { id, status: { in: ["PENDING", "APPROVED"] } },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          processedAt: new Date(),
          processedById: c.get("currentUser")?.id || null,
        },
      });
      if (result.count !== 1) {
        const conflict = new Error("PAYOUT_STATE_CONFLICT");
        conflict.code = "PAYOUT_STATE_CONFLICT";
        throw conflict;
      }

      await writeAuditLog(tx, c, {
        action: "PAYOUT_REJECT",
        targetType: "PAYOUT",
        targetId: id,
        reason,
        before: { status: payout.status },
        after: { status: "REJECTED" },
      });

      return tx.payoutRequest.findUnique({
        where: { id },
        include: payoutInclude,
      });
    });

    return c.json({
      success: true,
      message: "ปฏิเสธคำขอถอนเงินแล้ว ยอดกันเงินจะถูกปลด",
      payout: serializePayout(updated),
    });
  } catch (error) {
    if (error?.code === "PAYOUT_STATE_CONFLICT") {
      return c.json({ error: "คำขอนี้ถูกดำเนินการโดยผู้ใช้อื่นแล้ว" }, 409);
    }
    console.error("Reject payout error:", error);
    return c.json({ error: "ไม่สามารถปฏิเสธคำขอถอนเงินได้" }, 500);
  }
};

// PUT /api/admin/payouts/:id/transfer
export const transferPayout = async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const proofUrl = String(body.proofUrl || "").trim() || null;
    const transferReference =
      String(body.transferReference || "").trim() || null;

    if (!proofUrl && !transferReference) {
      return c.json(
        { error: "กรุณาแนบหลักฐานการโอนหรือระบุเลขอ้างอิงการโอน" },
        400,
      );
    }

    const payout = await prisma.payoutRequest.findUnique({
      where: { id },
      include: { shop: true },
    });
    if (!payout) return c.json({ error: "ไม่พบคำขอถอนเงิน" }, 404);
    if (payout.status !== "APPROVED") {
      return c.json({ error: "ต้องอนุมัติคำขอก่อนบันทึกการโอน" }, 409);
    }
    if (Number(payout.shop.balance) < Number(payout.amount)) {
      return c.json(
        { error: "ยอดเงินร้านไม่เพียงพอต่อการโอน กรุณาตรวจสอบ Ledger" },
        409,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.payoutRequest.updateMany({
        where: { id, status: "APPROVED" },
        data: {
          status: "TRANSFERRED",
          proofUrl,
          transferReference,
          processedAt: new Date(),
          processedById: c.get("currentUser")?.id || null,
        },
      });
      if (result.count !== 1) {
        const conflict = new Error("PAYOUT_STATE_CONFLICT");
        conflict.code = "PAYOUT_STATE_CONFLICT";
        throw conflict;
      }

      // Atomic guard: ป้องกัน Payout หลายรายการหักยอดพร้อมกันจนติดลบ
      const debit = await tx.shop.updateMany({
        where: {
          id: payout.shopId,
          balance: { gte: payout.amount },
        },
        data: { balance: { decrement: payout.amount } },
      });
      if (debit.count !== 1) {
        const conflict = new Error("INSUFFICIENT_BALANCE");
        conflict.code = "INSUFFICIENT_BALANCE";
        throw conflict;
      }

      await tx.shopTransaction.create({
        data: {
          shopId: payout.shopId,
          payoutRequestId: payout.id,
          type: "PAYOUT",
          amount: -Number(payout.amount),
          description: `โอนเงินให้ร้าน${transferReference ? ` (${transferReference})` : ""}`,
        },
      });

      await writeAuditLog(tx, c, {
        action: "PAYOUT_TRANSFER",
        targetType: "PAYOUT",
        targetId: id,
        before: { status: payout.status },
        after: {
          status: "TRANSFERRED",
          transferReference,
          hasProof: Boolean(proofUrl),
        },
      });

      return tx.payoutRequest.findUnique({
        where: { id },
        include: payoutInclude,
      });
    });

    return c.json({
      success: true,
      message: "บันทึกการโอนเงินสำเร็จ",
      payout: serializePayout(updated),
    });
  } catch (error) {
    if (error?.code === "PAYOUT_STATE_CONFLICT") {
      return c.json({ error: "คำขอนี้ถูกดำเนินการโดยผู้ใช้อื่นแล้ว" }, 409);
    }
    if (error?.code === "INSUFFICIENT_BALANCE") {
      return c.json({ error: "ยอดเงินร้านไม่เพียงพอต่อการโอน" }, 409);
    }
    console.error("Transfer payout error:", error);
    return c.json({ error: "ไม่สามารถบันทึกการโอนเงินได้" }, 500);
  }
};
