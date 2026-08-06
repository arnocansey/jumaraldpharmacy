import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  getOverview,
  getTopProducts,
  getRecentOrders,
  getPrescriptionStats,
  getLowStockAlerts,
  getDeliveryStats,
  getBranchPerformance,
  getExpiringBatches,
  getUserGrowth,
} from "../controllers/analytics.controller";

const router = Router();

router.get("/overview", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getOverview);
router.get("/top-products", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getTopProducts);
router.get("/recent-orders", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getRecentOrders);
router.get("/prescriptions", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getPrescriptionStats);
router.get("/low-stock", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getLowStockAlerts);
router.get("/deliveries", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getDeliveryStats);
router.get("/branches", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getBranchPerformance);
router.get("/expiring-batches", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getExpiringBatches);
router.get("/user-growth", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getUserGrowth);

export default router;
