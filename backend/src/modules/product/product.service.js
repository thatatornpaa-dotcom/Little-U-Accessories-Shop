import { prisma } from "../../lib/db";

/**
 * Product Service (ใช้ร่วมกันทั้ง Admin และ Seller)
 * - validate / normalize ข้อมูลสินค้า
 * - สร้างและอัปเดตสินค้าพร้อม relation: รูปภาพ, custom options, accessories
 * - กำหนดเงื่อนไขการมองเห็นสินค้าฝั่ง public (เฉพาะร้าน APPROVED + สินค้าที่เปิดขาย)
 */

const VALID_TYPES = ["READY_TO_SHIP", "MADE_TO_ORDER"];
const VALID_CATEGORIES = ["BRACELET", "ANKLET", "RING", "NECKLACE"];

const toNullableFloat = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Validate + normalize product input ใช้ร่วมกันทั้ง Admin และ Seller
 */
export const parseProductInput = (data) => {
  const { name, description, price, originalPrice, type, stock, category } =
    data;

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new Error("Product name is required and must be a non-empty string");
  }

  if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
    throw new Error("Price is required and must be a non-negative number");
  }

  if (
    originalPrice !== undefined &&
    originalPrice !== null &&
    originalPrice !== ""
  ) {
    const parsedOriginal = parseFloat(originalPrice);
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedOriginal) || parsedOriginal < 0) {
      throw new Error("Original price must be a non-negative number");
    }
    if (parsedOriginal <= parsedPrice) {
      throw new Error("ราคาเต็มก่อนลดต้องมากกว่าราคาขายจริงเท่านั้น");
    }
  }

  if (
    stock === undefined ||
    isNaN(parseInt(stock)) ||
    parseInt(stock) < 0
  ) {
    throw new Error("Stock is required and must be a non-negative integer");
  }

  const productType = type ? String(type).trim().toUpperCase() : "READY_TO_SHIP";
  if (!VALID_TYPES.includes(productType)) {
    throw new Error(`Product type must be one of: ${VALID_TYPES.join(", ")}`);
  }

  const productCategory = category
    ? String(category).trim().toUpperCase()
    : "BRACELET";
  if (!VALID_CATEGORIES.includes(productCategory)) {
    throw new Error(
      `Product category must be one of: ${VALID_CATEGORIES.join(", ")}`,
    );
  }

  const leadTimeDays = Math.max(
    0,
    parseInt(data.leadTimeDays ?? 0) || 0,
  );

  const wristSizeMin = toNullableFloat(data.wristSizeMin);
  const wristSizeMax = toNullableFloat(data.wristSizeMax);
  if (
    wristSizeMin !== null &&
    wristSizeMax !== null &&
    wristSizeMin > wristSizeMax
  ) {
    throw new Error("ขนาดรอบข้อมือขั้นต่ำต้องไม่มากกว่าขนาดสูงสุด");
  }

  return {
    name: name.trim(),
    description: description ? String(description).trim() : null,
    price: parseFloat(price),
    originalPrice:
      originalPrice !== undefined && originalPrice !== null && originalPrice !== ""
        ? parseFloat(originalPrice)
        : null,
    type: productType,
    category: productCategory,
    leadTimeDays,
    stock: parseInt(stock),
    wristSizeMin,
    wristSizeMax,
    isActive: data.isActive === undefined ? true : !!data.isActive,
  };
};

/**
 * สร้าง relation ของสินค้า: รูป, วัสดุตกแต่ง, ตัวเลือกปรับแต่ง
 * แยกออกมาเพื่อให้ create/update ใช้ logic เดียวกัน
 */
const createRelations = async (tx, productId, { images, customOptions, accessories }) => {
  if (Array.isArray(images) && images.length > 0) {
    await tx.productImage.createMany({
      data: images.map((url, position) => ({ productId, url, position })),
    });
  }

  if (Array.isArray(accessories) && accessories.length > 0) {
    const uniqueIds = [...new Set(accessories.filter(Boolean))];
    await tx.productAccessory.createMany({
      data: uniqueIds.map((accessoryId) => ({ productId, accessoryId })),
    });
  }

  if (Array.isArray(customOptions)) {
    for (const opt of customOptions) {
      if (!opt?.name || String(opt.name).trim() === "") continue;
      await tx.customOption.create({
        data: {
          productId,
          name: String(opt.name).trim(),
          isRequired: opt.required !== undefined ? !!opt.required : true,
          values:
            Array.isArray(opt.values) && opt.values.length > 0
              ? {
                  create: opt.values
                    .filter(Boolean)
                    .map((val) => ({
                      value:
                        typeof val === "string"
                          ? val
                          : String(val.name ?? val.value ?? "").trim(),
                      priceAdjustment:
                        typeof val === "object" && val.priceAdjustment
                          ? parseFloat(val.priceAdjustment) || 0
                          : 0,
                    }))
                    .filter((val) => val.value !== ""),
                }
              : undefined,
        },
      });
    }
  }
};

const productInclude = {
  images: { orderBy: { position: "asc" } },
  customOptions: { include: { values: true } },
  accessories: { include: { accessory: { include: { category: true } } } },
};

/**
 * สร้างสินค้าใหม่ + relation ทั้งหมดใน transaction เดียว
 * shopId จะถูกส่งมาจาก Seller controller เท่านั้น (ห้ามรับจาก client โดยตรง)
 */
export const createProductWithRelations = async ({
  data,
  images,
  customOptions,
  accessories,
  shopId,
}) => {
  return prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        ...data,
        ...(shopId ? { shopId } : {}),
      },
    });

    await createRelations(tx, created.id, {
      images,
      customOptions,
      accessories,
    });

    return tx.product.findUnique({
      where: { id: created.id },
      include: productInclude,
    });
  });
};

/**
 * อัปเดตสินค้า + relation
 * - ถ้าส่ง images/accessories/customOptions มา จะลบของเดิมแล้วสร้างใหม่
 * - ถ้าไม่ส่งมา จะคงของเดิมไว้
 */
export const updateProductWithRelations = async ({
  id,
  data,
  images,
  customOptions,
  accessories,
}) => {
  return prisma.$transaction(async (tx) => {
    if (Array.isArray(images)) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url, position) => ({ productId: id, url, position })),
        });
      }
    }

    if (Array.isArray(accessories)) {
      await tx.productAccessory.deleteMany({ where: { productId: id } });
      const uniqueIds = [...new Set(accessories.filter(Boolean))];
      if (uniqueIds.length > 0) {
        await tx.productAccessory.createMany({
          data: uniqueIds.map((accessoryId) => ({ productId: id, accessoryId })),
        });
      }
    }

    if (Array.isArray(customOptions)) {
      await tx.customOption.deleteMany({ where: { productId: id } });
      for (const opt of customOptions) {
        if (!opt?.name || String(opt.name).trim() === "") continue;
        await tx.customOption.create({
          data: {
            productId: id,
            name: String(opt.name).trim(),
            isRequired: opt.required !== undefined ? !!opt.required : true,
            values:
              Array.isArray(opt.values) && opt.values.length > 0
                ? {
                    create: opt.values
                      .filter(Boolean)
                      .map((val) => ({
                        value:
                          typeof val === "string"
                            ? val
                            : String(val.name ?? val.value ?? "").trim(),
                        priceAdjustment:
                          typeof val === "object" && val.priceAdjustment
                            ? parseFloat(val.priceAdjustment) || 0
                            : 0,
                      }))
                      .filter((val) => val.value !== ""),
                  }
                : undefined,
          },
        });
      }
    }

    return tx.product.update({
      where: { id },
      data,
      include: productInclude,
    });
  });
};

/**
 * เงื่อนไขกลางสำหรับสินค้าที่ลูกค้าทั่วไปมองเห็น:
 * - ยังไม่ถูกลบ (soft delete)
 * - เปิดขายอยู่
 * - เป็นสินค้าของร้านที่ APPROVED หรือเป็นสินค้า legacy ของ platform (shopId = null)
 */
export const visibleProductWhere = {
  isDeleted: false,
  isActive: true,
  moderationStatus: "VISIBLE",
  OR: [{ shopId: null }, { shop: { is: { status: "APPROVED" } } }],
};

/**
 * เงื่อนไขเดียวกันสำหรับข้อมูลที่ include shop แล้ว
 * ใช้ตอน checkout เพื่อไม่ให้สินค้าที่ถูกซ่อน/ร้านถูกระงับหลุดเข้ามาขายได้
 */
export const isProductPubliclyVisible = (product) =>
  Boolean(
    product &&
      !product.isDeleted &&
      product.isActive &&
      product.moderationStatus === "VISIBLE" &&
      (!product.shopId || product.shop?.status === "APPROVED"),
  );

export const publicProductInclude = {
  images: { orderBy: { position: "asc" } },
  customOptions: { include: { values: true } },
  shop: {
    select: { id: true, name: true, slug: true, logoUrl: true, status: true },
  },
};
