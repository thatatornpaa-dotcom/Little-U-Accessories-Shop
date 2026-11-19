import { prisma } from "../../lib/db";

// Check if current user is an admin (เหมือนกับ employee.controller.js)
const checkAdmin = (c) => {
  const user = c.get("currentUser");
  if (!user || user.role !== "admin") {
    return false;
  }
  return true;
};

// GET /api/users — ดึงรายชื่อลูกค้าทั้งหมด (Admin only)
export const listUsers = async (c) => {
  try {
    if (!checkAdmin(c)) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: [
            { isDefault: "desc" },
            { createdAt: "desc" }
          ]
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ success: true, users });
  } catch (error) {
    console.error("List users error:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
};

// GET /api/users/:id — ดึงลูกค้ารายคน พร้อมประวัติออเดอร์ (Admin only)
export const getUserById = async (c) => {
  try {
    if (!checkAdmin(c)) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const id = c.req.param("id");

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: [
            { isDefault: "desc" },
            { createdAt: "desc" }
          ]
        },
        orders: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ success: true, user });
  } catch (error) {
    console.error("Get user by id error:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
};