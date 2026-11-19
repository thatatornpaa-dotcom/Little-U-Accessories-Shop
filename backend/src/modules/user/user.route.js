import { Hono } from "hono";
import { listUsers, getUserById } from "./user.controller";
import { requireEmployee } from "../../middleware/auth.middleware";

const userRouter = new Hono();

// requireEmployee เช็คแล้วว่า role เป็น "admin" หรือ "staff" (กัน Customer มาสวมสิทธิ์)
// ส่วน checkAdmin() ใน controller เช็คซ้ำอีกชั้นว่าต้องเป็น "admin" เท่านั้นถึงจะดูข้อมูลลูกค้าได้
userRouter.use("*", requireEmployee);

userRouter.get("/", listUsers);
userRouter.get("/:id", getUserById);

export default userRouter;