import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
  validateCoupon,
} from "../controllers/coupon.controller";

const router = Router();

router.get("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getCoupons);
router.get("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getCouponById);
router.post("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), createCoupon);
router.put("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), updateCoupon);
router.delete("/:id", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), deleteCoupon);
router.patch("/:id/toggle", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), toggleCoupon);
router.post("/validate", validateCoupon);

export default router;
