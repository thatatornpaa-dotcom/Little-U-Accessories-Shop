import { Hono } from "hono";
import {
  getAccessories,
  getAccessoryById,
  createAccessory,
  updateAccessory,
  deleteAccessory,
} from "./accessory.controller";
import { requireEmployee } from "../../middleware/auth.middleware";

const accessoryRouter = new Hono();

// Public / Customer reads
accessoryRouter.get("/", getAccessories);
accessoryRouter.get("/:id", getAccessoryById);

// Staff / Admin managed writes
accessoryRouter.post("/", requireEmployee, createAccessory);
accessoryRouter.put("/:id", requireEmployee, updateAccessory);
accessoryRouter.delete("/:id", requireEmployee, deleteAccessory);

export default accessoryRouter;
