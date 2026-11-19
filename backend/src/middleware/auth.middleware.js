import { verify } from "hono/jwt";
import { getCookie } from "hono/cookie";
import { prisma } from "../lib/db";

const JWT_SECRET = process.env.JWT_SECRET;

// ตรวจสอบ JWT_SECRET ตั้งแต่รันเซิร์ฟเวอร์เพื่อความปลอดภัย
if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing!");
}

// Helper ฟังก์ชันในการดึงและตรวจสอบความถูกต้องของ JWT Token
const verifyToken = async (c) => {
  let token = getCookie(c, "token");

  if (!token) {
    const auth = c.req.header("Authorization");
    if (auth && auth.startsWith("Bearer ")) {
      token = auth.substring(7);
    }
  }

  if (!token) return null;

  try {
    return await verify(token, JWT_SECRET, "HS256");
  } catch {
    return null;
  }
};

const isEmployeePayload = (payload) => {
  const role = String(payload?.role || "").toLowerCase();
  return (
    payload?.accountType === "EMPLOYEE" ||
    role === "admin" ||
    role === "staff"
  );
};

/**
 * โหลด session จาก DB ทุกครั้ง
 * - Employee -> ADMIN / STAFF
 * - User + shop APPROVED -> SELLER
 * - User อื่น ๆ -> BUYER
 * ไม่เชื่อ role ที่อยู่ใน JWT เพราะสถานะร้านอาจเปลี่ยนหลังอนุมัติ
 */
const loadSession = async (c) => {
  const payload = await verifyToken(c);
  if (!payload?.sub) return null;

  if (isEmployeePayload(payload)) {
    const employee = await prisma.employee.findUnique({
      where: { id: payload.sub },
    });

    if (!employee || employee.isDeleted) return null;

    return {
      payload,
      accountType: "EMPLOYEE",
      currentUser: employee,
      currentShop: null,
      role: String(employee.role || "").toUpperCase(),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { shop: true },
  });

  if (!user) return null;

  const shop = user.shop || null;
  const role = shop?.status === "APPROVED" ? "SELLER" : "BUYER";

  return {
    payload,
    accountType: "USER",
    currentUser: user,
    currentShop: shop,
    role,
  };
};

const attachSession = (c, session) => {
  c.set("jwtPayload", session.payload);
  c.set("accountType", session.accountType);
  c.set("currentUser", session.currentUser);
  c.set("currentShop", session.currentShop);
  c.set("effectiveRole", session.role);
};

const unauthorized = (c, message = "Unauthorized: Invalid or expired token") =>
  c.json({ error: message }, 401);

const forbidden = (c, message = "Forbidden") => c.json({ error: message }, 403);

// ---------------------------------------------------------------------------
// Core guards
// ---------------------------------------------------------------------------

// login แล้วกี่ก็ได้ (ทั้ง User และ Employee)
export const requireAuth = async (c, next) => {
  try {
    const session = await loadSession(c);
    if (!session) return unauthorized(c);

    attachSession(c, session);
    await next();
  } catch (err) {
    console.error("Auth Middleware Error (requireAuth):", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

// ลูกค้า (User) เท่านั้น — Seller ก็ยังเป็น User จึงใช้งานได้
export const requireCustomer = async (c, next) => {
  try {
    const session = await loadSession(c);
    if (!session) return unauthorized(c);

    if (session.accountType !== "USER") {
      return forbidden(c, "Forbidden: Customer account required");
    }

    attachSession(c, session);
    await next();
  } catch (err) {
    console.error("Auth Middleware Error (Customer):", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

// พนักงานหลังบ้าน (Employee) เท่านั้น
export const requireEmployee = async (c, next) => {
  try {
    const session = await loadSession(c);
    if (!session) return unauthorized(c);

    if (session.accountType !== "EMPLOYEE") {
      return forbidden(c, "Forbidden: Employee access required");
    }

    attachSession(c, session);
    await next();
  } catch (err) {
    console.error("Auth Middleware Error (Employee):", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

// User ที่มีร้านแล้ว (ไม่ว่าสถานะใด)
export const requireSeller = async (c, next) => {
  try {
    const session = await loadSession(c);
    if (!session) return unauthorized(c);

    if (session.accountType !== "USER") {
      return forbidden(c, "Forbidden: Seller account required");
    }

    if (!session.currentShop) {
      return forbidden(c, "Forbidden: No shop found for this account");
    }

    attachSession(c, session);
    await next();
  } catch (err) {
    console.error("Auth Middleware Error (Seller):", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

// User ที่มีร้านสถานะ APPROVED เท่านั้น
export const requireApprovedSeller = async (c, next) => {
  try {
    const session = await loadSession(c);
    if (!session) return unauthorized(c);

    if (session.accountType !== "USER") {
      return forbidden(c, "Forbidden: Seller account required");
    }

    if (!session.currentShop) {
      return forbidden(c, "Forbidden: No shop found for this account");
    }

    if (session.currentShop.status !== "APPROVED") {
      return forbidden(c, "Forbidden: Shop is not approved yet");
    }

    attachSession(c, session);
    await next();
  } catch (err) {
    console.error("Auth Middleware Error (Approved Seller):", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

// Admin (Employee ที่มี role = admin) เท่านั้น
export const requireAdmin = async (c, next) => {
  try {
    const session = await loadSession(c);
    if (!session) return unauthorized(c);

    if (session.accountType !== "EMPLOYEE" || session.role !== "ADMIN") {
      return forbidden(c, "Forbidden: Admin access required");
    }

    attachSession(c, session);
    await next();
  } catch (err) {
    console.error("Auth Middleware Error (Admin):", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

// ใช้ซ้ำทั่วไป เช่น requireRole("SELLER", "ADMIN")
export const requireRole = (...roles) => {
  const allowed = roles.map((role) => String(role).toUpperCase());

  return async (c, next) => {
    try {
      const session = await loadSession(c);
      if (!session) return unauthorized(c);

      if (!allowed.includes(session.role)) {
        return forbidden(c, "Forbidden: Insufficient role");
      }

      attachSession(c, session);
      await next();
    } catch (err) {
      console.error("Auth Middleware Error (Role):", err);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  };
};
