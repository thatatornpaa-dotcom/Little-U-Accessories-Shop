import { Hono } from "hono";
import { requireCustomer } from "../../middleware/auth.middleware";
import { processCheckout, handleOmiseWebhook } from "./payment.controller";

const paymentRouter = new Hono();

paymentRouter.post("/checkout", requireCustomer, processCheckout);
paymentRouter.post("/webhook", handleOmiseWebhook);

export default paymentRouter;
