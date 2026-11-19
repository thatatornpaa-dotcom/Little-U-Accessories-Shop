const toJsonSafe = (value) => {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

/**
 * บันทึก Audit Log ผ่าน Prisma client หรือ transaction client
 * ห้ามส่งข้อมูล KYC/เลขบัญชีแบบเต็มเข้ามาใน before/after
 */
export const writeAuditLog = async (
  tx,
  c,
  { action, targetType, targetId = null, reason = null, before, after },
) => {
  const actor = c.get("currentUser");
  return tx.adminAuditLog.create({
    data: {
      actorId: actor?.id || null,
      actorEmail: actor?.email || null,
      actorRole: c.get("effectiveRole") || null,
      action,
      targetType,
      targetId,
      reason: reason || null,
      beforeJson: toJsonSafe(before),
      afterJson: toJsonSafe(after),
    },
  });
};
