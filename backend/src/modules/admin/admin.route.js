import { Hono } from "hono";
import {
  adminListShops,
  adminApproveShop,
  adminRejectShop,
  adminSuspendShop,
  adminReactivateShop,
} from "../shop/shop.controller";
import {
  adminListProducts,
  getAdminProductById,
  moderateProduct,
} from "./moderation.controller";
import {
  listPayouts,
  approvePayout,
  rejectPayout,
  transferPayout,
} from "./payout.controller";
import {
  getAdminSettings,
  updateAdminSettings,
} from "./settings.controller";
import { getAdminAnalytics } from "./analytics.controller";
import { listAuditLogs } from "./audit.controller";
import { requireEmployee, requireAdmin } from "../../middleware/auth.middleware";

const adminRouter = new Hono();

// Staff อ่านภาพรวมได้, Admin เท่านั้นที่มีสิทธิ์เปลี่ยนแปลงข้อมูลสำคัญ
adminRouter.get("/shops", requireEmployee, adminListShops);
adminRouter.put("/shops/:id/approve", requireAdmin, adminApproveShop);
adminRouter.put("/shops/:id/reject", requireAdmin, adminRejectShop);
adminRouter.put("/shops/:id/suspend", requireAdmin, adminSuspendShop);
adminRouter.put("/shops/:id/reactivate", requireAdmin, adminReactivateShop);

adminRouter.get("/products", requireEmployee, adminListProducts);
adminRouter.get("/products/:id", requireEmployee, getAdminProductById);
adminRouter.put("/products/:id/moderate", requireAdmin, moderateProduct);

adminRouter.get("/payouts", requireAdmin, listPayouts);
adminRouter.put("/payouts/:id/approve", requireAdmin, approvePayout);
adminRouter.put("/payouts/:id/reject", requireAdmin, rejectPayout);
adminRouter.put("/payouts/:id/transfer", requireAdmin, transferPayout);

adminRouter.get("/settings", requireAdmin, getAdminSettings);
adminRouter.put("/settings", requireAdmin, updateAdminSettings);

adminRouter.get("/analytics", requireEmployee, getAdminAnalytics);
adminRouter.get("/audit-logs", requireAdmin, listAuditLogs);

export default adminRouter;
