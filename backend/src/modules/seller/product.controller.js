import { prisma } from "../../lib/db";
import {
  parseProductInput,
  createProductWithRelations,
  updateProductWithRelations,
} from "../product/product.service";

/**
 * Seller Product Controller
 * ทุก endpoint ต้องผ่าน requireSeller / requireApprovedSeller
 * และต้องกรองด้วย shopId ของร้านตัวเองเสมอ เพื่อป้องกันการแก้ไขข้ามร้าน
 */

const sellerProductInclude = {
  images: { orderBy: { position: "asc" } },
  customOptions: { include: { values: true } },
  accessories: { include: { accessory: { include: { category: true } } } },
};

// GET /api/seller/products
export const listMyProducts = async (c) => {
  try {
    const shop = c.get("currentShop");
    if (!shop) return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);

    const search = (c.req.query("search") || "").trim();
    const category = (c.req.query("category") || "").trim().toUpperCase();
    const type = (c.req.query("type") || "").trim().toUpperCase();
    const status = (c.req.query("status") || "").trim().toUpperCase();

    const where = {
      shopId: shop.id,
      isDeleted: false,
      ...(category ? { category } : {}),
      ...(type ? { type } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" } }
        : {}),
    };

    if (status === "ACTIVE") where.isActive = true;
    if (status === "INACTIVE") where.isActive = false;

    const products = await prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { position: "asc" } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ success: true, products });
  } catch (error) {
    console.error("List seller products error:", error);
    return c.json({ error: "ไม่สามารถดึงรายการสินค้าได้" }, 500);
  }
};

// GET /api/seller/products/:id
export const getMyProductById = async (c) => {
  try {
    const shop = c.get("currentShop");
    if (!shop) return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);

    const product = await prisma.product.findFirst({
      where: {
        id: c.req.param("id"),
        shopId: shop.id,
        isDeleted: false,
      },
      include: sellerProductInclude,
    });

    if (!product) {
      return c.json({ error: "ไม่พบสินค้า" }, 404);
    }

    return c.json({ success: true, product });
  } catch (error) {
    console.error("Get seller product error:", error);
    return c.json({ error: "ไม่สามารถดึงข้อมูลสินค้าได้" }, 500);
  }
};

// POST /api/seller/products
export const createMyProduct = async (c) => {
  try {
    const shop = c.get("currentShop");
    if (!shop) return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);

    const body = await c.req.json();
    const { images, customOptions, accessories } = body;

    let cleanedData;
    try {
      cleanedData = parseProductInput(body);
    } catch (err) {
      return c.json({ error: err.message }, 400);
    }

    if (cleanedData.type === "MADE_TO_ORDER" && cleanedData.leadTimeDays <= 0) {
      return c.json(
        { error: "สินค้าสั่งทำต้องระบุระยะเวลาผลิตอย่างน้อย 1 วัน" },
        400,
      );
    }

    const product = await createProductWithRelations({
      data: cleanedData,
      images,
      customOptions,
      accessories,
      shopId: shop.id,
    });

    return c.json(
      {
        success: true,
        message: "สร้างสินค้าสำเร็จ",
        product,
      },
      201,
    );
  } catch (error) {
    console.error("Create seller product error:", error);
    return c.json({ error: "ไม่สามารถสร้างสินค้าได้" }, 500);
  }
};

// PUT /api/seller/products/:id
export const updateMyProduct = async (c) => {
  try {
    const shop = c.get("currentShop");
    if (!shop) return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);

    const id = c.req.param("id");
    const existing = await prisma.product.findFirst({
      where: { id, shopId: shop.id, isDeleted: false },
    });

    // ตรวจเจ้าของสินค้า: ถ้าไม่ใช่ของร้านนี้ให้ตอบ 404 (ไม่เปิดเผยว่ามีสินค้าอยู่)
    if (!existing) {
      return c.json({ error: "ไม่พบสินค้าหรือคุณไม่มีสิทธิ์แก้ไข" }, 404);
    }

    const body = await c.req.json();
    const { images, customOptions, accessories } = body;

    let cleanedData;
    try {
      cleanedData = parseProductInput({ ...existing, ...body });
    } catch (err) {
      return c.json({ error: err.message }, 400);
    }

    if (cleanedData.type === "MADE_TO_ORDER" && cleanedData.leadTimeDays <= 0) {
      return c.json(
        { error: "สินค้าสั่งทำต้องระบุระยะเวลาผลิตอย่างน้อย 1 วัน" },
        400,
      );
    }

    const product = await updateProductWithRelations({
      id,
      data: cleanedData,
      images,
      customOptions,
      accessories,
    });

    return c.json({
      success: true,
      message: "อัปเดตสินค้าสำเร็จ",
      product,
    });
  } catch (error) {
    console.error("Update seller product error:", error);
    return c.json({ error: "ไม่สามารถอัปเดตสินค้าได้" }, 500);
  }
};

// DELETE /api/seller/products/:id (soft delete)
export const deleteMyProduct = async (c) => {
  try {
    const shop = c.get("currentShop");
    if (!shop) return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);

    const existing = await prisma.product.findFirst({
      where: { id: c.req.param("id"), shopId: shop.id, isDeleted: false },
      select: { id: true },
    });

    if (!existing) {
      return c.json({ error: "ไม่พบสินค้าหรือคุณไม่มีสิทธิ์ลบ" }, 404);
    }

    await prisma.product.update({
      where: { id: existing.id },
      data: { isDeleted: true, isActive: false },
    });

    return c.json({ success: true, message: "ลบสินค้าสำเร็จ" });
  } catch (error) {
    console.error("Delete seller product error:", error);
    return c.json({ error: "ไม่สามารถลบสินค้าได้" }, 500);
  }
};

// PATCH /api/seller/products/:id/status  { isActive }
export const toggleMyProduct = async (c) => {
  try {
    const shop = c.get("currentShop");
    if (!shop) return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);

    const existing = await prisma.product.findFirst({
      where: { id: c.req.param("id"), shopId: shop.id, isDeleted: false },
      select: { id: true, isActive: true },
    });

    if (!existing) {
      return c.json({ error: "ไม่พบสินค้าหรือคุณไม่มีสิทธิ์แก้ไข" }, 404);
    }

    const body = await c.req.json().catch(() => ({}));
    const nextValue =
      body.isActive === undefined ? !existing.isActive : !!body.isActive;

    const product = await prisma.product.update({
      where: { id: existing.id },
      data: { isActive: nextValue },
      select: { id: true, isActive: true },
    });

    return c.json({
      success: true,
      message: nextValue ? "เปิดขายสินค้าแล้ว" : "ปิดการขายสินค้าแล้ว",
      product,
    });
  } catch (error) {
    console.error("Toggle seller product error:", error);
    return c.json({ error: "ไม่สามารถเปลี่ยนสถานะสินค้าได้" }, 500);
  }
};

// GET /api/seller/dashboard
export const getSellerDashboard = async (c) => {
  try {
    const shop = c.get("currentShop");
    if (!shop) return c.json({ error: "ไม่พบร้านค้าของคุณ" }, 404);

    const [productCount, activeProductCount, lowStockCount] = await Promise.all([
      prisma.product.count({ where: { shopId: shop.id, isDeleted: false } }),
      prisma.product.count({
        where: { shopId: shop.id, isDeleted: false, isActive: true },
      }),
      prisma.product.count({
        where: {
          shopId: shop.id,
          isDeleted: false,
          type: "READY_TO_SHIP",
          stock: { lte: 3 },
        },
      }),
    ]);

    return c.json({
      success: true,
      dashboard: {
        shopStatus: shop.status,
        productCount,
        activeProductCount,
        lowStockCount,
        balance: Number(shop.balance || 0),
      },
    });
  } catch (error) {
    console.error("Get seller dashboard error:", error);
    return c.json({ error: "ไม่สามารถดึงข้อมูลแดชบอร์ดได้" }, 500);
  }
};
