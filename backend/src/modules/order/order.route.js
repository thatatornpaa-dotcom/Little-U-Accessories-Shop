import { Hono } from "hono";
import { requireCustomer, requireEmployee } from "../../middleware/auth.middleware";
import {
  createOrder,
  getOrderHistory,
  getOrderById,
  getAdminOrders,
  updateAdminOrder,
  getAdminOrderById,
  confirmOrderReceived,
  createRefundRequest,

} from "./order.controller";

const orderRouter = new Hono();

// Admin / Backoffice endpoints (Must be declared before parameter routes like /:id to prevent matching issues)
orderRouter.get("/admin", requireEmployee, getAdminOrders);
orderRouter.get("/admin/:id", requireEmployee, getAdminOrderById);
orderRouter.put("/admin/:id", requireEmployee, updateAdminOrder);

// Customer endpoints
orderRouter.post("/", requireCustomer, createOrder);
orderRouter.get("/", requireCustomer, getOrderHistory);
orderRouter.post("/:id/confirm-received", requireCustomer, confirmOrderReceived);
orderRouter.post("/:id/refund-requests", requireCustomer, createRefundRequest);
orderRouter.get("/:id", requireCustomer, getOrderById);

export default orderRouter;