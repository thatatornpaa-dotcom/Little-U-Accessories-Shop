import { prisma } from "../../lib/db";

// Helper to validate and parse Category input
const parseCategoryInput = (data) => {
  const { name, description } = data;

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new Error("Category name is required and must be a non-empty string");
  }

  return {
    name: name.trim().toUpperCase(), // Store in uppercase for consistency, e.g. "CHARM"
    description: description ? description.trim() : null,
  };
};

// GET /api/categories
export const getCategories = async (c) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isDeleted: false },
      orderBy: { name: "asc" },
    });
    return c.json({ success: true, categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
};

// GET /api/categories/:id
export const getCategoryById = async (c) => {
  try {
    const id = c.req.param("id");
    const category = await prisma.category.findFirst({
      where: { id, isDeleted: false },
      include: { accessories: { where: { isDeleted: false } } }, // Include non-deleted accessories
    });

    if (!category) {
      return c.json({ error: "Category not found" }, 404);
    }

    return c.json({ success: true, category });
  } catch (error) {
    console.error("Get category by id error:", error);
    return c.json({ error: "Failed to fetch category" }, 500);
  }
};

// POST /api/categories (Employee/Admin only)
export const createCategory = async (c) => {
  try {
    const body = await c.req.json();
    let cleanedData;
    try {
      cleanedData = parseCategoryInput(body);
    } catch (err) {
      return c.json({ error: err.message }, 400);
    }

    // Check for duplicate category name
    const existing = await prisma.category.findFirst({
      where: { name: cleanedData.name, isDeleted: false },
    });
    if (existing) {
      return c.json({ error: "Category with this name already exists" }, 400);
    }

    const newCategory = await prisma.category.create({
      data: cleanedData,
    });

    return c.json({
      success: true,
      message: "Category created successfully",
      category: newCategory,
    }, 201);
  } catch (error) {
    console.error("Create category error:", error);
    return c.json({ error: "Failed to create category" }, 500);
  }
};

// PUT /api/categories/:id (Employee/Admin only)
export const updateCategory = async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const existing = await prisma.category.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      return c.json({ error: "Category not found" }, 404);
    }

    let cleanedData;
    try {
      cleanedData = parseCategoryInput({ ...existing, ...body });
    } catch (err) {
      return c.json({ error: err.message }, 400);
    }

    // Check for duplicates if name is changing
    if (cleanedData.name !== existing.name) {
      const duplicate = await prisma.category.findFirst({
        where: { name: cleanedData.name, isDeleted: false },
      });
      if (duplicate) {
        return c.json({ error: "Category with this name already exists" }, 400);
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: cleanedData,
    });

    return c.json({
      success: true,
      message: "Category updated successfully",
      category: updated,
    });
  } catch (error) {
    console.error("Update category error:", error);
    return c.json({ error: "Failed to update category" }, 500);
  }
};

// DELETE /api/categories/:id (Employee/Admin only)
export const deleteCategory = async (c) => {
  try {
    const id = c.req.param("id");

    const existing = await prisma.category.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      return c.json({ error: "Category not found" }, 404);
    }

    await prisma.category.update({
      where: { id },
      data: { isDeleted: true },
    });

    return c.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return c.json({ error: "Failed to delete category" }, 500);
  }
};
