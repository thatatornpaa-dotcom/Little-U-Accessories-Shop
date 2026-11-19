import { prisma } from "../../lib/db";
import {
  parseProductInput,
  createProductWithRelations,
  updateProductWithRelations,
  visibleProductWhere,
  publicProductInclude,
} from "./product.service";

// GET /api/products
export const getProducts = async (c) => {
  try {
    const search = (c.req.query("search") || "").trim();
    const category = (c.req.query("category") || "").trim().toUpperCase();
    const type = (c.req.query("type") || "").trim().toUpperCase();
    const shopSlug = (c.req.query("shop") || "").trim().toLowerCase();

    const filters = {};
    if (category) filters.category = category;
    if (type) filters.type = type;
    if (shopSlug) filters.shop = { is: { slug: shopSlug, status: "APPROVED" } };
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where: {
        ...filters,
        AND: [visibleProductWhere],
      },
      include: publicProductInclude,
      orderBy: { createdAt: "desc" },
    });

    return c.json({ success: true, products });
  } catch (error) {
    console.error("Get products error:", error);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
};

// GET /api/products/:id
export const getProductById = async (c) => {
  try {
    const id = c.req.param("id");
    const product = await prisma.product.findFirst({
      where: {
        id,
        AND: [visibleProductWhere],
      },
      include: {
        ...publicProductInclude,
        accessories: {
          include: {
            accessory: {
              include: { category: true }
            }
          },
        },
      },
    });

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json({ success: true, product });
  } catch (error) {
    console.error("Get product by id error:", error);
    return c.json({ error: "Failed to fetch product" }, 500);
  }
};

// POST /api/products (Employee/Admin only)
export const createProduct = async (c) => {
  try {
    const body = await c.req.json();
    const { images, customOptions, accessories } = body;
    let cleanedData;
    try {
      cleanedData = parseProductInput(body);
    } catch (err) {
      return c.json({ error: err.message }, 400);
    }

    const newProduct = await createProductWithRelations({
      data: cleanedData,
      images,
      customOptions,
      accessories,
    });

    return c.json({
      success: true,
      message: "Product created successfully",
      product: newProduct,
    }, 201);
  } catch (error) {
    console.error("Create product error:", error);
    return c.json({ error: "Failed to create product" }, 500);
  }
};

// PUT /api/products/:id (Employee/Admin only)
export const updateProduct = async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { images, accessories, customOptions } = body;

    const existing = await prisma.product.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      return c.json({ error: "Product not found" }, 404);
    }

    let cleanedData;
    try {
      cleanedData = parseProductInput({ ...existing, ...body });
    } catch (err) {
      return c.json({ error: err.message }, 400);
    }

    // Run in a transaction to clean and recreate images, accessories, custom options
    const updated = await updateProductWithRelations({
      id,
      data: cleanedData,
      images,
      accessories,
      customOptions,
    });

    return c.json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return c.json({ error: "Failed to update product" }, 500);
  }
};

// DELETE /api/products/:id (Employee/Admin only)
export const deleteProduct = async (c) => {
  try {
    const id = c.req.param("id");

    const existing = await prisma.product.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      return c.json({ error: "Product not found" }, 404);
    }

    await prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    return c.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
};

// GET /api/products/:id/recommendations
export const getProductRecommendations = async (c) => {
  try {
    const id = c.req.param("id");

    const product = await prisma.product.findFirst({
      where: { id, AND: [visibleProductWhere] },
    });

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    const otherProducts = await prisma.product.findMany({
      where: {
        AND: [visibleProductWhere],
        NOT: { id: product.id },
      },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
        shop: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
      },
    });

    // Sort by same category, same type, and closest price difference
    const targetPrice = Number(product.price);
    const targetCategory = product.category;
    const targetType = product.type;

    const recommended = otherProducts
      .sort((a, b) => {
        // 1. Same category first
        const aSameCat = a.category === targetCategory ? 0 : 1;
        const bSameCat = b.category === targetCategory ? 0 : 1;
        if (aSameCat !== bSameCat) return aSameCat - bSameCat;

        // 2. Same type second
        const aSameType = a.type === targetType ? 0 : 1;
        const bSameType = b.type === targetType ? 0 : 1;
        if (aSameType !== bSameType) return aSameType - bSameType;

        // 3. Proximity to price
        const aPriceDiff = Math.abs(Number(a.price) - targetPrice);
        const bPriceDiff = Math.abs(Number(b.price) - targetPrice);
        return aPriceDiff - bPriceDiff;
      })
      .slice(0, 10);

    return c.json({
      success: true,
      products: recommended,
    });
  } catch (error) {
    console.error("Get product recommendations error:", error);
    return c.json({ error: "Failed to fetch product recommendations" }, 500);
  }
};

