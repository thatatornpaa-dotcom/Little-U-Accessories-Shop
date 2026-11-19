/**
 * เครดิตยอดขายเข้ากระเป๋าร้านเมื่อคำสั่งซื้อของร้านถูกส่งถึงผู้ซื้อแล้ว
 * - ต้องเรียกภายใน Prisma transaction
 * - settledAt เป็น guard กันเครดิตซ้ำ
 * - ถ้ามี Ledger SALE อยู่แล้ว (ข้อมูล seed/import) จะไม่เครดิตซ้ำ
 */
export const settleSubOrder = async (tx, subOrder) => {
  if (!subOrder || ["CANCELLED", "REFUNDED"].includes(subOrder.status)) {
    return false;
  }

  const claimed = await tx.subOrder.updateMany({
    where: { id: subOrder.id, settledAt: null },
    data: { settledAt: new Date() },
  });
  if (claimed.count !== 1) return false;

  const existingSale = await tx.shopTransaction.findFirst({
    where: { subOrderId: subOrder.id, type: "SALE" },
    select: { id: true },
  });
  if (existingSale) return false;

  await tx.shopTransaction.createMany({
    data: [
      {
        shopId: subOrder.shopId,
        subOrderId: subOrder.id,
        type: "SALE",
        amount: subOrder.subtotal,
        description: `ยอดขายจากคำสั่งซื้อ ${subOrder.subOrderNumber}`,
      },
      {
        shopId: subOrder.shopId,
        subOrderId: subOrder.id,
        type: "COMMISSION",
        amount: -Number(subOrder.commissionAmount),
        description: `ค่าคอมมิชชันจากคำสั่งซื้อ ${subOrder.subOrderNumber}`,
      },
    ],
  });

  await tx.shop.update({
    where: { id: subOrder.shopId },
    data: { balance: { increment: subOrder.netAmount } },
  });

  return true;
};

export const parentStatusToSubOrderStatus = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "PROCESSING" || value === "PRODUCING") return "PRODUCING";
  if (value === "PARTIALLY_SHIPPED") return "SHIPPED";
  return value;
};
