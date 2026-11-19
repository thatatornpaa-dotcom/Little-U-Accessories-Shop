import { prisma } from "../../lib/db";

// Helper to validate and parse Accessory input
const parseAccessoryInput = async (data) => {
  const { name, description, price, stock, imageUrl, categoryId } = data;

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new Error("Name is required and must be a non-empty string");
  }

  if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
    throw new Error("Price is required and must be a non-negative number");
  }

  if (stock === undefined || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
    throw new Error("Stock is required and must be a non-negative integer");
  }

  if (!categoryId || typeof categoryId !== "string" || categoryId.trim() === "") {
    throw new Error("CategoryId is required");
  }

  // Verify that the Category exists and is not deleted
  const categoryExists = await prisma.category.findFirst({
    where: { id: categoryId, isDeleted: false },
  });
  if (!categoryExists) {
    throw new Error(`Category with ID ${categoryId} does not exist`);
  }

  return {
    name: name.trim(),
    description: description ? description.trim() : null,
    price: parseFloat(price),
    stock: parseInt(stock),
    imageUrl: imageUrl ? imageUrl.trim() : null,
    categoryId: categoryId.trim(),
  };
};

// GET /api/accessories
export const getAccessories = async (c) => {
  try {
    const categoryId = c.req.query("categoryId");
    const where = categoryId ? { categoryId, isDeleted: false } : { isDeleted: false };

    const accessories = await prisma.accessory.findMany({
      where,
      include: { category: true }, // Include category details
      orderBy: { createdAt: "desc" },
    });

    return c.json({ success: true, accessories });
  } catch (error) {
    console.error("Get accessories error:", error);
    return c.json({ error: "Failed to fetch accessories" }, 500);
  }
};

// GET /api/accessories/:id
export const getAccessoryById = async (c) => {
  try {
    const id = c.req.param("id");
    const accessory = await prisma.accessory.findFirst({
      where: { id, isDeleted: false },
      include: { category: true },
    });

    if (!accessory) {
      return c.json({ error: "Accessory not found" }, 404);
    }

    return c.json({ success: true, accessory });
  } catch (error) {
    console.error("Get accessory by id error:", error);
    return c.json({ error: "Failed to fetch accessory" }, 500);
  }
};

// POST /api/accessories (Employee/Admin only)
export const createAccessory = async (c) => {
  try {
    const body = await c.req.json();
    let cleanedData;
    try {
      cleanedData = await parseAccessoryInput(body);
    } catch (validationError) {
      return c.json({ error: validationError.message }, 400);
    }

    const newAccessory = await prisma.accessory.create({
      data: cleanedData,
      include: { category: true },
    });

    return c.json({
      success: true,
      message: "Accessory created successfully",
      accessory: newAccessory,
    }, 201);
  } catch (error) {
    console.error("Create accessory error:", error);
    return c.json({ error: "Failed to create accessory" }, 500);
  }
};

// PUT /api/accessories/:id (Employee/Admin only)
export const updateAccessory = async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const existing = await prisma.accessory.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      return c.json({ error: "Accessory not found" }, 404);
    }

    let cleanedData;
    try {
      cleanedData = await parseAccessoryInput({ ...existing, ...body });
    } catch (validationError) {
      return c.json({ error: validationError.message }, 400);
    }

    const updated = await prisma.accessory.update({
      where: { id },
      data: cleanedData,
      include: { category: true },
    });

    return c.json({
      success: true,
      message: "Accessory updated successfully",
      accessory: updated,
    });
  } catch (error) {
    console.error("Update accessory error:", error);
    return c.json({ error: "Failed to update accessory" }, 500);
  }
};

// DELETE /api/accessories/:id (Employee/Admin only)
export const deleteAccessory = async (c) => {
  try {
    const id = c.req.param("id");

    const existing = await prisma.accessory.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      return c.json({ error: "Accessory not found" }, 404);
    }

    await prisma.accessory.update({
      where: { id },
      data: { isDeleted: true },
    });

    return c.json({
      success: true,
      message: "Accessory deleted successfully",
    });
  } catch (error) {
    console.error("Delete accessory error:", error);
    return c.json({ error: "Failed to delete accessory" }, 500);
  }
};
