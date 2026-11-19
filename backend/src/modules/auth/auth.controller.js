import { sign } from "hono/jwt";
import { setCookie, deleteCookie } from "hono/cookie";
import { prisma } from "../../lib/db";

const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  // localhost (http) ไม่สามารถใช้ secure + SameSite=None ได้
  secure: isProduction,
  sameSite: isProduction ? "None" : "Lax",
  maxAge: 60 * 60 * 24, // 24 ชั่วโมง
  path: "/",
};

// Valid bcrypt dummy hash to prevent timing attacks
const DUMMY_HASH = "$2b$10$X5t0e48Yl13J7w/iLhWwveG7iT3u8tWqB37fLg89qH94m94v85K.2";

// Input validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && email.length <= 255 && emailRegex.test(email.trim());
};

const isValidPassword = (password) => {
  return typeof password === "string" && password.length >= 8 && password.length <= 72;
};

const isValidThaiName = (name) => {
  const thaiRegex = /^[ก-๙]+$/;
  return typeof name === "string" && thaiRegex.test(name.trim());
};

export const register = async (c) => {
  try {
    const { email, password, firstName, lastName } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, 400);
    }

    if (!firstName || !lastName) {
      return c.json({ error: "กรุณากรอกชื่อและนามสกุล" }, 400);
    }

    if (!isValidThaiName(firstName)) {
      return c.json({ error: "ชื่อต้องเป็นภาษาไทยเท่านั้น" }, 400);
    }

    if (!isValidThaiName(lastName)) {
      return c.json({ error: "นามสกุลต้องเป็นภาษาไทยเท่านั้น" }, 400);
    }

    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      return c.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, 400);
    }

    if (!isValidPassword(password)) {
      return c.json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" }, 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return c.json({ error: "อีเมลนี้ถูกลงทะเบียนใช้งานแล้ว" }, 409);
    }

    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const cleanFirstName = firstName ? firstName.trim().substring(0, 100) : "";
    const cleanLastName = lastName ? lastName.trim().substring(0, 100) : "";

    const newUser = await prisma.user.create({
      data: { 
        email: cleanEmail, 
        password: hashedPassword, 
        firstName: cleanFirstName, 
        lastName: cleanLastName 
      },
    });

    return c.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return c.json({ error: "การลงทะเบียนล้มเหลวเนื่องจากข้อผิดพลาดภายในระบบ" }, 500);
  }
};

export const login = async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, 400);
    }

    const cleanEmail = email.trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { shop: true },
    });
    
    // Mitigate timing attacks by always performing verification
    const passwordToCheck = user ? user.password : DUMMY_HASH;
    const isPasswordValid = await Bun.password.verify(password, passwordToCheck);

    if (!user || !isPasswordValid) {
      return c.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, 401);
    }

    // สิทธิ์จริงคำนวณจากสถานะร้านใน DB ไม่ใช่ค่าที่ client ส่งมา
    const effectiveRole = user.shop?.status === "APPROVED" ? "SELLER" : "BUYER";

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      accountType: "USER",
      role: effectiveRole,
      iat: now,
      exp: now + 60 * 60 * 24, // 24 ชั่วโมง
    };

    const token = await sign(payload, JWT_SECRET, "HS256");

    setCookie(c, "token", token, COOKIE_OPTIONS);

    return c.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: effectiveRole,
        shop: user.shop
          ? {
              id: user.shop.id,
              name: user.shop.name,
              slug: user.shop.slug,
              status: user.shop.status,
              logoUrl: user.shop.logoUrl,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "การเข้าสู่ระบบล้มเหลวเนื่องจากข้อผิดพลาดภายในระบบ" }, 500);
  }
};

export const registerBackoffice = async (c) => {
  try {
    const { email, password, firstName, lastName, role } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, 400);
    }

    if (!firstName || !lastName) {
      return c.json({ error: "กรุณากรอกชื่อและนามสกุล" }, 400);
    }

    if (!isValidThaiName(firstName)) {
      return c.json({ error: "ชื่อต้องเป็นภาษาไทยเท่านั้น" }, 400);
    }

    if (!isValidThaiName(lastName)) {
      return c.json({ error: "นามสกุลต้องเป็นภาษาไทยเท่านั้น" }, 400);
    }

    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      return c.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, 400);
    }

    if (!isValidPassword(password)) {
      return c.json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" }, 400);
    }

    const cleanRole = (role === "admin" || role === "staff") ? role : "staff";

    const existingEmployee = await prisma.employee.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmployee) {
      return c.json({ error: "อีเมลนี้ถูกลงทะเบียนใช้งานแล้ว" }, 409);
    }

    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const cleanFirstName = firstName ? firstName.trim().substring(0, 100) : "";
    const cleanLastName = lastName ? lastName.trim().substring(0, 100) : "";

    const newEmployee = await prisma.employee.create({
      data: { 
        email: cleanEmail, 
        password: hashedPassword, 
        firstName: cleanFirstName, 
        lastName: cleanLastName,
        role: cleanRole
      },
    });

    return c.json({
      success: true,
      message: "Employee registered successfully",
      user: {
        id: newEmployee.id,
        email: newEmployee.email,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        role: newEmployee.role,
      },
    });
  } catch (error) {
    console.error("Register backoffice error:", error);
    return c.json({ error: "การลงทะเบียนล้มเหลวเนื่องจากข้อผิดพลาดภายในระบบ" }, 500);
  }
};

export const loginBackoffice = async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, 400);
    }

    const cleanEmail = email.trim();
    const employee = await prisma.employee.findUnique({ where: { email: cleanEmail } });
    
    // Mitigate timing attacks by always performing verification
    const passwordToCheck = employee ? employee.password : DUMMY_HASH;
    const isPasswordValid = await Bun.password.verify(password, passwordToCheck);

    if (!employee || !isPasswordValid) {
      return c.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, 401);
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: employee.id,
      accountType: "EMPLOYEE",
      role: employee.role,
      iat: now,
      exp: now + 60 * 60 * 24, // 24 ชั่วโมง
    };

    const token = await sign(payload, JWT_SECRET, "HS256");

    setCookie(c, "token", token, COOKIE_OPTIONS);

    return c.json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Login backoffice error:", error);
    return c.json({ error: "การเข้าสู่ระบบล้มเหลวเนื่องจากข้อผิดพลาดภายในระบบ" }, 500);
  }
};

// POST /api/auth/logout
export const logout = async (c) => {
  deleteCookie(c, "token", { path: "/" });
  return c.json({ success: true, message: "Logged out successfully" });
};

// GET /api/auth/profile
export const getProfile = async (c) => {
  try {
    const user = c.get("currentUser");
    const accountType = c.get("accountType");
    const shop = c.get("currentShop");
    const effectiveRole = c.get("effectiveRole");

    if (!user) {
      return c.json({ error: "ไม่มีสิทธิ์เข้าถึงข้อมูล" }, 401);
    }

    // Employee ใช้ role ตัวพิมพ์เล็ก (admin/staff) เหมือนเดิมเพื่อความเข้ากันได้กับ Backoffice
    const userRole =
      accountType === "EMPLOYEE"
        ? String(user.role || "").toLowerCase()
        : effectiveRole;

    return c.json({
      success: true,
      accountType,
      role: effectiveRole,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        address: user.address || "",
        role: userRole,
      },
      shop: shop
        ? {
            id: shop.id,
            name: shop.name,
            slug: shop.slug,
            description: shop.description,
            logoUrl: shop.logoUrl,
            bannerUrl: shop.bannerUrl,
            status: shop.status,
            rejectionReason: shop.rejectionReason,
            taxId: shop.taxId,
            idCardUrl: shop.idCardUrl,
            bankName: shop.bankName,
            bankAccountNumber: shop.bankAccountNumber,
            bankAccountName: shop.bankAccountName,
            balance: shop.balance,
            createdAt: shop.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return c.json({ error: "ไม่สามารถดึงข้อมูลโปรไฟล์ได้" }, 500);
  }
};

// PUT /api/auth/profile
export const updateProfile = async (c) => {
  try {
    const user = c.get("currentUser");
    if (!user) {
      return c.json({ error: "ไม่มีสิทธิ์เข้าถึงข้อมูล" }, 401);
    }

    const { firstName, lastName, phone, email } = await c.req.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
      },
    });

    return c.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        phone: updatedUser.phone || "",
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return c.json({ error: "ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้" }, 500);
  }
};
