import { Hono } from "hono";
import { cors } from "hono/cors";
import authRouter from "./modules/auth/auth.route";
import employeeRouter from "./modules/employee/employee.route";
import accessoryRouter from "./modules/accessory/accessory.route";
import categoryRouter from "./modules/category/category.route";
import productRouter from "./modules/product/product.route";
import uploadRouter from "./modules/upload/upload.route";
import cartRouter from "./modules/cart/cart.route";
import orderRouter from "./modules/order/order.route";
import paymentRouter from "./modules/payment/payment.route";
import userRouter from "./modules/user/user.route";
import wishlistRouter from "./modules/wishlist/wishlist.route";
import addressRouter from "./modules/address/address.route";
import shopRouter from "./modules/shop/shop.route";
import sellerRouter from "./modules/seller/product.route";
import adminRouter from "./modules/admin/admin.route";
import settingsRouter from "./modules/settings/settings.route";

const port = process.env.PORT || 8000;
const envMode = process.env.NODE_ENV || "development";

const app = new Hono();

// Enable CORS so the Next.js frontend can make requests
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:3000,http://localhost:3001,http://localhost:3005,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3005"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  "/*",
  cors({
    origin: (origin) =>
      !origin || allowedOrigins.includes(origin)
        ? origin
        : allowedOrigins[0],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    credentials: true,
    maxAge: 600,
  }),
);

app.get("/", (c) => c.text("Bare & Bold Hono API Server is running!"));

app.route("/api/auth", authRouter);
app.route("/api/employees", employeeRouter);
app.route("/api/accessories", accessoryRouter);
app.route("/api/categories", categoryRouter);
app.route("/api/products", productRouter);
app.route("/api/upload", uploadRouter);
app.route("/api/cart", cartRouter);
app.route("/api/orders", orderRouter);
app.route("/api/payments", paymentRouter);
app.route("/api/users", userRouter);
app.route("/api/wishlist", wishlistRouter);
app.route("/api/addresses", addressRouter);
app.route("/api/shops", shopRouter);
app.route("/api/seller", sellerRouter);
app.route("/api/admin", adminRouter);
app.route("/api/settings", settingsRouter);

console.log(`
══════════════════════════════════════════════
  Bare & Bold Backend API Server
  Environment: ${envMode}
  Port: ${port}
══════════════════════════════════════════════
`);

export default {
  port: port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};