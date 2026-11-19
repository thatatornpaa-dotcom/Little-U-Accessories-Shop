import { Hono } from "hono";
import {
  applyShop,
  getMyShop,
  updateMyShop,
  getShopBySlug,
  getPublicShops,
} from "./shop.controller";
import {
  requireCustomer,
  requireSeller,
} from "../../middleware/auth.middleware";

const shopRouter = new Hono();

// Public
shopRouter.get("/", getPublicShops);

// Buyer / Seller
shopRouter.post("/apply", requireCustomer, applyShop);
shopRouter.get("/my-shop", requireCustomer, getMyShop);
shopRouter.put("/my-shop", requireSeller, updateMyShop);

// Public (ต้องประกาศหลัง /my-shop เพื่อไม่ให้ชนกัน)
shopRouter.get("/:slug", getShopBySlug);

export default shopRouter;
