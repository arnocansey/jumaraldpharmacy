import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  getInventoryReport,
  getExpiringProducts,
  getExpiredProducts,
  adjustInventory,
  getStockAlerts,
  bulkUpdateStock,
  getInventoryHistory,
  cycleCount,
  getInventoryForecast,
} from "../controllers/inventory.controller";

const router = Router();

router.get("/report", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), getInventoryReport);
router.get("/expiring", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), getExpiringProducts);
router.get("/expired", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), getExpiredProducts);
router.get("/alerts", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), getStockAlerts);
router.get("/history", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.INVENTORY_CLERK]), getInventoryHistory);
router.get("/forecast", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getInventoryForecast);
router.post("/adjust", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), adjustInventory);
router.post("/bulk-update", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.INVENTORY_CLERK]), bulkUpdateStock);
router.post("/cycle-count", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]), cycleCount);

export default router;
