import { Hono } from "hono";
import { requireCustomer } from "../../middleware/auth.middleware";
import {
  getAddresses,
  createAddress,
  setDefaultAddress,
  deleteAddress,
  updateAddress
} from "./address.controller";

const addressRouter = new Hono();

// All address routes require Customer authentication
addressRouter.use("/*", requireCustomer);

addressRouter.get("/", getAddresses);
addressRouter.post("/", createAddress);
addressRouter.put("/:id/default", setDefaultAddress);
addressRouter.put("/:id", updateAddress);
addressRouter.delete("/:id", deleteAddress);

export default addressRouter;
