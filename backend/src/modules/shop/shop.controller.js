import { prisma } from "../../lib/db";
import { writeAuditLog } from "../admin/audit.service";

/**
 * Shop Controller
 * ครอบคลุม:
 * - ผู้ซื้อสมัครเปิดร้าน (1 user = 1 shop)
 * - ผู้ขายดู/แก้ไขข้อมูลร้านตัวเอง
 * - หน้าร้าน public (เฉพาะร้าน APPROVED)
 * - Admin อนุมัติ/ปฏิเสธร้าน
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHOP_STATUS = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

const asString = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeSlug = (value) =>
  asString(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const isValidSlug = (slug) => /^[a-z0-9-]{3,50}$/.test(slug);
const isValidTaxId = (taxId) => /^\d{13}$/.test(taxId);
const isValidBankAccount = (account) => /^\d{10,15}$/.test(account);

const shopPublicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  bannerUrl: true,
  status: true,
  createdAt: true,
};

const serializeShop = (shop) => ({
  ...shop,
  balance: shop.balance !== undefined ? Number(shop.balance) : undefined,
});

/**
 * ตรวจข้อมูลร้านสำหรับ "สมัครเปิดร้าน"
 * คืนค่าเฉพาะ field ที่อนุญาตให้ client กำหนด
 */
const validateApplyInput = (body) => {
  const name = asString(body.name);
  const slug = normalizeSlug(body.slug || body.name);
  const description = asString(body.description) || null;
  const logoUrl = asString(body.logoUrl) || null;
  const bannerUrl = asString(body.bannerUrl) || null;
  const taxId = asString(body.taxId);
  const idCardUrl = asString(body.idCardUrl) || null;
  const bankName = asString(body.bankName);
  const bankAccountNumber = asString(body.bankAccountNumber);
  const bankAccountName = asString(body.bankAccountName);

  if (name.length < 3 || name.length > 80) {
    throw new Error("ชื่อร้านต้องมีความยาว 3-80 ตัวอักษร");
  }
  if (!isValidSlug(slug)) {
    throw new Error("URL Slug ต้องเป็น a-z, 0-9 หรือ - และยาว 3-50 ตัวอักษร");
  }
  if (!isValidTaxId(taxId)) {
    throw new Error("เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก");
  }
  if (!bankName) {
    throw new Error("กรุณาระบุธนาคาร");
  }
  if (!isValidBankAccount(bankAccountNumber)) {
    throw new Error("เลขที่บัญชีธนาคารต้องเป็นตัวเลข 10-15 หลัก");
  }
  if (!bankAccountName) {
    throw new Error("กรุณาระบุชื่อบัญชีธนาคาร");
  }
  if (!idCardUrl) {
    throw new Error("กรุณาอัปโหลดรูปบัตรประชาชนเพื่อยืนยันตัวตน");
  }

  return {
    name,
    slug,
    description,
    logoUrl,
    bannerUrl,
    taxId,
    idCardUrl,
    bankName,
    bankAccountNumber,
    bankAccountName,
  };
};

// ---------------------------------------------------------------------------
// Buyer / Seller endpoints
// ---------------------------------------------------------------------------

// POST /api/shops/apply
export const applyShop = async (c) => {
  try {
    const user = c.get("currentUser");

    const existing = await prisma.shop.findUnique({
      where: { ownerId: user.id },
    });
    if (existing) {
      return c.json({ error: "คุณมีร้านค้าอยู่แล้ว" }, 409);
    }

    let data;
    try {
      data = validateApplyInput(await c.req.json());
    } catch (err) {
      return c.json({ error: err.message }, 400);
    }

    const slugOwner = await prisma.shop.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (slugOwner) {
      return c.json({ error: "URL Slug นี้ถูกใช้งานแล้ว" }, 409);
    }

    const shop = await prisma.shop.create({
      data: {
        ...data,
        ownerId: user.id,
        status: "PENDING",
      },
    });

    return c.json(
      {
        success: true,
        message: "ส่งคำขอเปิดร้านสำเร็จ รอการอนุมัติจากแอดมิน",
        shop: serializeShop(shop),
      },
      201,
    );
  } catch (error) {
    console.error("Apply shop error:", error);
    return c.json({ error: "ไม่สามารถส่งคำขอเปิดร้านได้" }, 500);
  }
};

// GET /api/shops/my-shop
export const getMyShop = async (c) => {
  try {
    const user = c.get("currentUser");

    const shop = await prisma.shop.findUnique({
      where: { ownerId: user.id },
      include: {
        _count: {
          select: {
            products: { where: { isDeleted: false } },
          },
        },
      },
    });

    return c.json({
      success: true,
      shop: shop ? serializeShop(shop) : null,
    });
  } catch (error) {
    console.error("Get my shop error:", error);
    return c.json({ error: "ไม่สามารถดึงข้อมูลร้านค้าได้" }, 500);
  }
};

// PUT /api/shops/my-shop
export const updateMyShop = async (c) => {
  try {
    const user = c.get("currentUser");
    const shop = c.get("currentShop");

    if (!shop || shop.ownerId !== user.id) {
      return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);
    }

    const body = await c.req.json();
    const updates = {};

    if (body.name !== undefined) {
      const name = asString(body.name);
      if (name.length < 3 || name.length > 80) {
        return c.json({ error: "ชื่อร้านต้องมีความยาว 3-80 ตัวอักษร" }, 400);
      }
      updates.name = name;
    }

    if (body.slug !== undefined) {
      const slug = normalizeSlug(body.slug);
      if (!isValidSlug(slug)) {
        return c.json(
          { error: "URL Slug ต้องเป็น a-z, 0-9 หรือ - และยาว 3-50 ตัวอักษร" },
          400,
        );
      }
      const slugOwner = await prisma.shop.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (slugOwner && slugOwner.id !== shop.id) {
        return c.json({ error: "URL Slug นี้ถูกใช้งานแล้ว" }, 409);
      }
      updates.slug = slug;
    }

    if (body.description !== undefined)
      updates.description = asString(body.description) || null;
    if (body.logoUrl !== undefined)
      updates.logoUrl = asString(body.logoUrl) || null;
    if (body.bannerUrl !== undefined)
      updates.bannerUrl = asString(body.bannerUrl) || null;
    if (body.taxId !== undefined) {
      const taxId = asString(body.taxId);
      if (!isValidTaxId(taxId)) {
        return c.json(
          { error: "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก" },
          400,
        );
      }
      updates.taxId = taxId;
    }
    if (body.idCardUrl !== undefined)
      updates.idCardUrl = asString(body.idCardUrl) || null;
    if (body.bankName !== undefined)
      updates.bankName = asString(body.bankName) || null;
    if (body.bankAccountNumber !== undefined) {
      const account = asString(body.bankAccountNumber);
      if (!isValidBankAccount(account)) {
        return c.json(
          { error: "เลขที่บัญชีธนาคารต้องเป็นตัวเลข 10-15 หลัก" },
          400,
        );
      }
      updates.bankAccountNumber = account;
    }
    if (body.bankAccountName !== undefined)
      updates.bankAccountName = asString(body.bankAccountName) || null;

    // ถูกรีไซเคิลจาก REJECTED และกดส่งใหม่ -> กลับไปรออนุมัติ
    if (shop.status === "REJECTED" && body.resubmit !== false) {
      updates.status = "PENDING";
      updates.rejectionReason = null;
    }

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: updates,
    });

    return c.json({
      success: true,
      message:
        updates.status === "PENDING"
          ? "ส่งข้อมูลร้านใหม่แล้ว รอการอนุมัติจากแอดมิน"
          : "อัปเดตข้อมูลร้านสำเร็จ",
      shop: serializeShop(updated),
    });
  } catch (error) {
    console.error("Update my shop error:", error);
    return c.json({ error: "ไม่สามารถอัปเดตข้อมูลร้านได้" }, 500);
  }
};

// GET /api/shops/:slug (public)
export const getShopBySlug = async (c) => {
  try {
    const slug = normalizeSlug(c.req.param("slug"));

    const shop = await prisma.shop.findFirst({
      where: { slug, status: "APPROVED" },
      select: {
        ...shopPublicSelect,
        products: {
          where: {
            isDeleted: false,
            isActive: true,
            moderationStatus: "VISIBLE",
          },
          orderBy: { createdAt: "desc" },
          include: {
            images: { orderBy: { position: "asc" } },
            customOptions: { include: { values: true } },
          },
        },
      },
    });

    if (!shop) {
      return c.json({ error: "ไม่พบร้านค้า" }, 404);
    }

    return c.json({ success: true, shop });
  } catch (error) {
    console.error("Get shop by slug error:", error);
    return c.json({ error: "ไม่สามารถดึงข้อมูลร้านค้าได้" }, 500);
  }
};

// GET /api/shops (public) — เฉพาะร้านที่อนุมัติแล้ว
export const getPublicShops = async (c) => {
  try {
    const shops = await prisma.shop.findMany({
      where: { status: "APPROVED" },
      select: {
        ...shopPublicSelect,
        _count: {
          select: {
            products: {
              where: {
                isDeleted: false,
                isActive: true,
                moderationStatus: "VISIBLE",
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ success: true, shops });
  } catch (error) {
    console.error("Get public shops error:", error);
    return c.json({ error: "ไม่สามารถดึงรายการร้านค้าได้" }, 500);
  }
};

// ---------------------------------------------------------------------------
// Admin endpoints (monitored separately by requireEmployee / requireAdmin)
// ---------------------------------------------------------------------------

// GET /api/admin/shops?status=PENDING
export const adminListShops = async (c) => {
  try {
    const status = asString(c.req.query("status")).toUpperCase();
    const where = SHOP_STATUS.includes(status) ? { status } : {};

    const shops = await prisma.shop.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Staff ดูรายการได้ แต่ไม่ควรเห็นข้อมูล KYC/บัญชีเต็ม
    const isAdmin = c.get("effectiveRole") === "ADMIN";
    const safeShops = isAdmin
      ? shops
      : shops.map((shop) => {
          const {
            taxId,
            idCardUrl,
            bankAccountNumber,
            ...rest
          } = shop;

          return {
            ...rest,
            taxId: taxId ? "•••••••••••••" : null,
            idCardUrl: null,
            bankAccountNumber: bankAccountNumber
              ? `••••${bankAccountNumber.slice(-4)}`
              : null,
          };
        });

    return c.json({ success: true, shops: safeShops });
  } catch (error) {
    console.error("Admin list shops error:", error);
    return c.json({ error: "ไม่สามารถดึงรายการร้านค้าได้" }, 500);
  }
};

// PUT /api/admin/shops/:id/approve
export const adminApproveShop = async (c) => {
  try {
    const id = c.req.param("id");

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return c.json({ error: "ไม่พบร้านค้า" }, 404);
    }
    if (shop.status === "SUSPENDED") {
      return c.json(
        { error: "ร้านนี้ถูกระงับอยู่ กรุณาใช้ปุ่มเปิดการมองเห็นแทน" },
        409,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // อนุมัติร้าน + เปลี่ยน role ของเจ้าของเป็น SELLER พร้อมกัน
      const nextShop = await tx.shop.update({
        where: { id },
        data: {
          status: "APPROVED",
          rejectionReason: null,
          suspendedReason: null,
          suspendedAt: null,
        },
      });

      await tx.user.update({
        where: { id: shop.ownerId },
        data: { role: "SELLER" },
      });

      await writeAuditLog(tx, c, {
        action: "SHOP_APPROVE",
        targetType: "SHOP",
        targetId: id,
        before: { status: shop.status },
        after: { status: "APPROVED" },
      });

      return nextShop;
    });

    return c.json({
      success: true,
      message: "อนุมัติร้านค้าสำเร็จ",
      shop: serializeShop(updated),
    });
  } catch (error) {
    console.error("Admin approve shop error:", error);
    return c.json({ error: "ไม่สามารถอนุมัติร้านค้าได้" }, 500);
  }
};

// PUT /api/admin/shops/:id/reject  { reason }
export const adminRejectShop = async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const reason = asString(body.reason);

    if (!reason) {
      return c.json({ error: "กรุณาระบุเหตุผลที่ปฏิเสธ" }, 400);
    }

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return c.json({ error: "ไม่พบร้านค้า" }, 404);
    }
    if (shop.status === "SUSPENDED") {
      return c.json(
        { error: "ร้านที่ถูกระงับต้องเปิดการมองเห็นก่อนจึงจะเปลี่ยนสถานะได้" },
        409,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextShop = await tx.shop.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          suspendedReason: null,
          suspendedAt: null,
        },
      });

      await tx.user.update({
        where: { id: shop.ownerId },
        data: { role: "BUYER" },
      });

      await writeAuditLog(tx, c, {
        action: "SHOP_REJECT",
        targetType: "SHOP",
        targetId: id,
        reason,
        before: { status: shop.status },
        after: { status: "REJECTED" },
      });

      return nextShop;
    });

    return c.json({
      success: true,
      message: "ปฏิเสธคำขอเปิดร้านแล้ว",
      shop: serializeShop(updated),
    });
  } catch (error) {
    console.error("Admin reject shop error:", error);
    return c.json({ error: "ไม่สามารถปฏิเสธร้านค้าได้" }, 500);
  }
};

// PUT /api/admin/shops/:id/suspend  { reason }
export const adminSuspendShop = async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const reason = asString(body.reason);

    if (!reason) {
      return c.json({ error: "กรุณาระบุเหตุผลที่ระงับร้าน" }, 400);
    }

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return c.json({ error: "ไม่พบร้านค้า" }, 404);
    }
    if (shop.status !== "APPROVED") {
      return c.json(
        { error: "ระงับได้เฉพาะร้านที่อนุมัติแล้วเท่านั้น" },
        409,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextShop = await tx.shop.update({
        where: { id },
        data: {
          status: "SUSPENDED",
          suspendedReason: reason,
          suspendedAt: new Date(),
        },
      });

      await writeAuditLog(tx, c, {
        action: "SHOP_SUSPEND",
        targetType: "SHOP",
        targetId: id,
        reason,
        before: { status: shop.status },
        after: { status: "SUSPENDED" },
      });

      return nextShop;
    });

    return c.json({
      success: true,
      message: "ระงับร้านและปิดการมองเห็นแล้ว",
      shop: serializeShop(updated),
    });
  } catch (error) {
    console.error("Admin suspend shop error:", error);
    return c.json({ error: "ไม่สามารถระงับร้านค้าได้" }, 500);
  }
};

// PUT /api/admin/shops/:id/reactivate
export const adminReactivateShop = async (c) => {
  try {
    const id = c.req.param("id");
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      return c.json({ error: "ไม่พบร้านค้า" }, 404);
    }
    if (shop.status !== "SUSPENDED") {
      return c.json({ error: "ร้านนี้ไม่ได้อยู่ในสถานะถูกระงับ" }, 409);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextShop = await tx.shop.update({
        where: { id },
        data: {
          status: "APPROVED",
          suspendedReason: null,
          suspendedAt: null,
        },
      });

      await writeAuditLog(tx, c, {
        action: "SHOP_REACTIVATE",
        targetType: "SHOP",
        targetId: id,
        before: { status: shop.status },
        after: { status: "APPROVED" },
      });

      return nextShop;
    });

    return c.json({
      success: true,
      message: "เปิดการมองเห็นร้านค้าอีกครั้งแล้ว",
      shop: serializeShop(updated),
    });
  } catch (error) {
    console.error("Admin reactivate shop error:", error);
    return c.json({ error: "ไม่สามารถเปิดร้านค้าคืนได้" }, 500);
  }
};
