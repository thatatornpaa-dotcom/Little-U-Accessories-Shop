import { Hono } from "hono";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductRecommendations,
} from "./product.controller";
import { requireEmployee } from "../../middleware/auth.middleware";

const productRouter = new Hono();

// Public / Customer reads
productRouter.get("/", getProducts);
productRouter.get("/:id", getProductById);
productRouter.get("/:id/recommendations", getProductRecommendations);

// Staff / Admin managed writes
productRouter.post("/", requireEmployee, createProduct);
productRouter.put("/:id", requireEmployee, updateProduct);
productRouter.delete("/:id", requireEmployee, deleteProduct);

export default productRouter;
