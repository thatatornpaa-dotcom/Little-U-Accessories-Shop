import { prisma } from "../../lib/db";
import { writeAuditLog } from "./audit.service";

const STATUS_VALUES = ["VISIBLE", "HIDDEN", "SUSPENDED"];
const ACTION_STATUS = {
  HIDE: "HIDDEN",
  SUSPEND: "SUSPENDED",
  RESTORE: "VISIBLE",
};

// GET /api/admin/products
export const adminListProducts = async (c) => {
  try {
    const search = String(c.req.query("search") || "").trim();
    const moderationStatus = String(
      c.req.query("moderationStatus") || "",
    ).toUpperCase();
    const shopId = String(c.req.query("shopId") || "").trim();
    const type = String(c.req.query("type") || "").trim().toUpperCase();
    const category = String(c.req.query("category") || "").trim().toUpperCase();
    const page = Math.max(1, Number(c.req.query("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(c.req.query("pageSize")) || 20),
    );

    const where = {
      isDeleted: false,
      ...(STATUS_VALUES.includes(moderationStatus) ? { moderationStatus } : {}),
      ...(shopId ? { shopId } : {}),
      ...(type ? { type } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { shop: { is: { name: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              logoUrl: true,
            },
          },
          _count: { select: { orderItems: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return c.json({
      success: true,
      products,
      pagination: { page, pageSize, total },
    });
  } catch (error) {
    console.error("Admin list products error:", error);
    return c.json({ error: "ไม่สามารถดึงรายการสินค้าได้" }, 500);
  }
};

// GET /api/admin/products/:id
export const getAdminProductById = async (c) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: c.req.param("id"), isDeleted: false },
      include: {
        images: { orderBy: { position: "asc" } },
        customOptions: { include: { values: true } },
        accessories: {
          include: { accessory: { include: { category: true } } },
        },
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            logoUrl: true,
          },
        },
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      return c.json({ error: "ไม่พบสินค้า" }, 404);
    }

    return c.json({ success: true, product });
  } catch (error) {
    console.error("Admin get product error:", error);
    return c.json({ error: "ไม่สามารถดึงรายละเอียดสินค้าได้" }, 500);
  }
};

// PUT /api/admin/products/:id/moderate
export const moderateProduct = async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const action = String(body.action || "").toUpperCase();
    const reason = String(body.reason || "").trim();
    const nextStatus = ACTION_STATUS[action];

    if (!nextStatus) {
      return c.json(
        { error: "action ต้องเป็น HIDE, SUSPEND หรือ RESTORE" },
        400,
      );
    }
    if (action !== "RESTORE" && !reason) {
      return c.json({ error: "กรุณาระบุเหตุผลก่อนซ่อนหรือระงับสินค้า" }, 400);
    }

    const product = await prisma.product.findFirst({
      where: { id, isDeleted: false },
      include: { shop: { select: { id: true, name: true } } },
    });
    if (!product) {
      return c.json({ error: "ไม่พบสินค้า" }, 404);
    }
    if (product.moderationStatus === nextStatus) {
      return c.json({ error: "สินค้าอยู่ในสถานะนี้อยู่แล้ว" }, 409);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.product.updateMany({
        where: { id, moderationStatus: product.moderationStatus },
        data: {
          moderationStatus: nextStatus,
          moderationReason: action === "RESTORE" ? null : reason,
          moderatedById:
            action === "RESTORE"
              ? null
              : c.get("currentUser")?.id || null,
          moderatedAt: action === "RESTORE" ? null : new Date(),
        },
      });
      if (result.count !== 1) {
        const conflict = new Error("MODERATION_CONFLICT");
        conflict.code = "MODERATION_CONFLICT";
        throw conflict;
      }
      const next = await tx.product.findUnique({ where: { id } });

      await writeAuditLog(tx, c, {
        action: `PRODUCT_${action}`,
        targetType: "PRODUCT",
        targetId: id,
        reason: reason || null,
        before: {
          moderationStatus: product.moderationStatus,
          moderationReason: product.moderationReason,
        },
        after: { moderationStatus: nextStatus },
      });

      return next;
    });

    return c.json({
      success: true,
      message:
        action === "RESTORE"
          ? "เปิดการมองเห็นสินค้าแล้ว"
          : action === "HIDE"
            ? "ซ่อนสินค้าและปิดการขายแล้ว"
            : "ระงับสินค้าแล้ว",
      product: updated,
    });
  } catch (error) {
    if (error?.code === "MODERATION_CONFLICT") {
      return c.json(
        { error: "สถานะสินค้าถูกเปลี่ยนโดยผู้ใช้อื่น กรุณาโหลดข้อมูลใหม่" },
        409,
      );
    }
    console.error("Moderate product error:", error);
    return c.json({ error: "ไม่สามารถเปลี่ยนสถานะสินค้าได้" }, 500);
  }
};
