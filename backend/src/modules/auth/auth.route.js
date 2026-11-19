import { Hono } from "hono";
import { register, login, registerBackoffice, loginBackoffice, logout, getProfile, updateProfile } from "./auth.controller";
import { requireCustomer, requireEmployee, requireAdmin } from "../../middleware/auth.middleware";


const authRouter = new Hono();

// Customer Auth
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

// Backoffice Auth
// สมัครพนักงานใหม่ต้องเป็น Admin ที่ล็อกอินอยู่เท่านั้น
authRouter.post("/backoffice/register", requireAdmin, registerBackoffice);
authRouter.post("/backoffice/login", loginBackoffice);
authRouter.post("/backoffice/logout", logout);

// Protected Profile Routes
authRouter.get("/profile", requireCustomer, getProfile);
authRouter.put("/profile", requireCustomer, updateProfile);
authRouter.get("/backoffice/profile", requireEmployee, getProfile);

export default authRouter;
