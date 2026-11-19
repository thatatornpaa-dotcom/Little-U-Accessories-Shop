import { Hono } from "hono";
import { uploadMultipleFiles, deleteUploadedFile } from "./upload.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const uploadRouter = new Hono();

// ต้อง login ก่อนอัปโหลด — controller จะบังคับ folder ตาม role/ร้านของผู้ใช้
uploadRouter.post("/", requireAuth, uploadMultipleFiles);
uploadRouter.delete("/", requireAuth, deleteUploadedFile);

export default uploadRouter;
