import { Hono } from "hono";
import {
  listMyProducts,
  getMyProductById,
  createMyProduct,
  updateMyProduct,
  deleteMyProduct,
  toggleMyProduct,
  getSellerDashboard,
} from "./product.controller";
import {
  requireSeller,
  requireApprovedSeller,
} from "../../middleware/auth.middleware";
import {
  getMyWallet,
  listMyPayouts,
  createMyPayout,
} from "./payout.controller";

const sellerRouter = new Hono();

// อ่านข้อมูลได้แม้ร้านยังไม่ APPROVED (เพื่อให้เห็นสถานะ/สินค้าว่าง)
sellerRouter.get("/dashboard", requireSeller, getSellerDashboard);
sellerRouter.get("/products", requireSeller, listMyProducts);
sellerRouter.get("/products/:id", requireSeller, getMyProductById);

// เขียนข้อมูลได้เฉพาะร้านที่อนุมัติแล้ว
sellerRouter.post("/products", requireApprovedSeller, createMyProduct);
sellerRouter.put("/products/:id", requireApprovedSeller, updateMyProduct);
sellerRouter.delete("/products/:id", requireApprovedSeller, deleteMyProduct);
sellerRouter.patch("/products/:id/status", requireApprovedSeller, toggleMyProduct);

// Wallet & Payout
sellerRouter.get("/wallet", requireSeller, getMyWallet);
sellerRouter.get("/payouts", requireSeller, listMyPayouts);
sellerRouter.post("/payouts", requireApprovedSeller, createMyPayout);

export default sellerRouter;
