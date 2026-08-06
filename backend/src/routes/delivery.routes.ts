import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  createDelivery,
  updateDeliveryStatus,
  assignDriver,
  getDeliveryTracking,
  getMyDeliveries,
  getDeliveryStats,
  updateDriverLocation,
  verifyDeliveryOtp,
  confirmDelivery,
  getDeliveryHistory,
} from "../controllers/delivery.controller";

const router = Router();

router.get("/track/:trackingNumber", getDeliveryTracking);
router.post("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.BRANCH_MANAGER]), createDelivery);
router.put("/:id/status", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.DELIVERY_DRIVER, RoleName.BRANCH_MANAGER]), updateDeliveryStatus);
router.post("/:id/assign", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.BRANCH_MANAGER]), assignDriver);
router.get("/my-deliveries", authenticateToken, requireRole([RoleName.DELIVERY_DRIVER]), getMyDeliveries);
router.get("/stats", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getDeliveryStats);
router.put("/driver/location", authenticateToken, requireRole([RoleName.DELIVERY_DRIVER]), updateDriverLocation);
router.post("/:id/verify-otp", authenticateToken, requireRole([RoleName.DELIVERY_DRIVER]), verifyDeliveryOtp);
router.post("/:id/confirm", authenticateToken, requireRole([RoleName.DELIVERY_DRIVER]), confirmDelivery);
router.get("/history", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getDeliveryHistory);

export default router;
