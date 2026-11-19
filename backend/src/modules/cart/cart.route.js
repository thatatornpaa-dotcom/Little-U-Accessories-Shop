import { Hono } from "hono";
import { requireCustomer } from "../../middleware/auth.middleware";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart
} from "./cart.controller";

const cartRouter = new Hono();

// All cart endpoints require user authentication (Customer)
cartRouter.use("/*", requireCustomer);

cartRouter.get("/", getCart);
cartRouter.post("/", addToCart);
cartRouter.put("/", updateCartItem);
cartRouter.delete("/", removeCartItem);
cartRouter.post("/clear", clearCart);
cartRouter.post("/merge", mergeCart);

export default cartRouter;
