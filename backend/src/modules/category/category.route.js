import { Hono } from "hono";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller";
import { requireEmployee } from "../../middleware/auth.middleware";

const categoryRouter = new Hono();

// Public / Customer reads
categoryRouter.get("/", getCategories);
categoryRouter.get("/:id", getCategoryById);

// Staff / Admin managed writes
categoryRouter.post("/", requireEmployee, createCategory);
categoryRouter.put("/:id", requireEmployee, updateCategory);
categoryRouter.delete("/:id", requireEmployee, deleteCategory);

export default categoryRouter;
