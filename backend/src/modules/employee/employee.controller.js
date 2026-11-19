import { prisma } from "../../lib/db";

// Input validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && email.length <= 255 && emailRegex.test(email.trim());
};

const isValidPassword = (password) => {
  return typeof password === "string" && password.length >= 8 && password.length <= 72;
};

// Check if current user is an admin
const checkAdmin = (c) => {
  const user = c.get("currentUser");
  if (!user || user.role !== "admin") {
    return false;
  }
  return true;
};

// GET /api/employees
export const listEmployees = async (c) => {
  try {
    if (!checkAdmin(c)) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const employees = await prisma.employee.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ success: true, employees });
  } catch (error) {
    console.error("List employees error:", error);
    return c.json({ error: "Failed to fetch employees" }, 500);
  }
};

// POST /api/employees
export const createEmployee = async (c) => {
  try {
    if (!checkAdmin(c)) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const { email, password, firstName, lastName, role } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    if (!isValidPassword(password)) {
      return c.json({ error: "Password must be at least 8 characters long" }, 400);
    }

    // Check if email already exists
    const existingEmployee = await prisma.employee.findFirst({
      where: { email: cleanEmail, isDeleted: false },
    });
    if (existingEmployee) {
      return c.json({ error: "Email is already registered" }, 409);
    }

    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const newEmployee = await prisma.employee.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        firstName: firstName ? firstName.trim() : "",
        lastName: lastName ? lastName.trim() : "",
        role: role || "staff",
      },
    });

    return c.json({
      success: true,
      message: "Employee created successfully",
      employee: {
        id: newEmployee.id,
        email: newEmployee.email,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        role: newEmployee.role,
      },
    });
  } catch (error) {
    console.error("Create employee error:", error);
    return c.json({ error: "Failed to create employee" }, 500);
  }
};

// PUT /api/employees/:id
export const updateEmployee = async (c) => {
  try {
    if (!checkAdmin(c)) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const id = c.req.param("id");
    const { firstName, lastName, role, password } = await c.req.json();

    const employee = await prisma.employee.findFirst({
      where: { id, isDeleted: false },
    });
    if (!employee) {
      return c.json({ error: "Employee not found" }, 404);
    }

    const dataToUpdate = {
      firstName: firstName !== undefined ? firstName.trim() : employee.firstName,
      lastName: lastName !== undefined ? lastName.trim() : employee.lastName,
      role: role !== undefined ? role : employee.role,
    };

    if (password) {
      if (!isValidPassword(password)) {
        return c.json({ error: "Password must be at least 8 characters" }, 400);
      }
      dataToUpdate.password = await Bun.password.hash(password, {
        algorithm: "bcrypt",
        cost: 10,
      });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: dataToUpdate,
    });

    return c.json({
      success: true,
      message: "Employee updated successfully",
      employee: {
        id: updatedEmployee.id,
        email: updatedEmployee.email,
        firstName: updatedEmployee.firstName,
        lastName: updatedEmployee.lastName,
        role: updatedEmployee.role,
      },
    });
  } catch (error) {
    console.error("Update employee error:", error);
    return c.json({ error: "Failed to update employee" }, 500);
  }
};

// DELETE /api/employees/:id (Soft Delete)
export const deleteEmployee = async (c) => {
  try {
    if (!checkAdmin(c)) {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const id = c.req.param("id");

    const employee = await prisma.employee.findFirst({
      where: { id, isDeleted: false },
    });
    if (!employee) {
      return c.json({ error: "Employee not found or already deleted" }, 404);
    }

    // Don't allow admin to delete themselves to prevent lockouts
    const currentUser = c.get("currentUser");
    if (currentUser.id === id) {
      return c.json({ error: "You cannot delete your own admin account" }, 400);
    }

    // Soft delete
    await prisma.employee.update({
      where: { id },
      data: { isDeleted: true },
    });

    return c.json({
      success: true,
      message: "Employee soft deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    return c.json({ error: "Failed to delete employee" }, 500);
  }
};
