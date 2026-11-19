import { Hono } from "hono";
import { requireCustomer } from "../../middleware/auth.middleware";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} from "./wishlist.controller";

const wishlistRouter = new Hono();

// Require Customer auth for all wishlist routes
wishlistRouter.use("/*", requireCustomer);

wishlistRouter.get("/", getWishlist);
wishlistRouter.post("/", addToWishlist);
wishlistRouter.delete("/:productId", removeFromWishlist);

export default wishlistRouter;
