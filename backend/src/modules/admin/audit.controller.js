import { prisma } from "../../lib/db";

// GET /api/admin/audit-logs
export const listAuditLogs = async (c) => {
  try {
    const page = Math.max(1, Number(c.req.query("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(c.req.query("pageSize")) || 30),
    );
    const action = String(c.req.query("action") || "").trim().toUpperCase();
    const targetType = String(c.req.query("targetType") || "")
      .trim()
      .toUpperCase();

    const where = {
      ...(action ? { action } : {}),
      ...(targetType ? { targetType } : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return c.json({
      success: true,
      logs,
      pagination: { page, pageSize, total },
    });
  } catch (error) {
    console.error("List audit logs error:", error);
    return c.json({ error: "ไม่สามารถดึง Audit Log ได้" }, 500);
  }
};
