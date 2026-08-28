import { Router } from "express";
import { authenticateToken, optionalAuthenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import { createOrder, getMyOrders, getAllOrders, updateOrderStatus } from "../controllers/order.controller";

const router = Router();

router.post("/", optionalAuthenticateToken, createOrder);
router.get("/my", authenticateToken, getMyOrders);
router.get("/all", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), getAllOrders);
router.get("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), getAllOrders);
router.put("/:id/status", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), updateOrderStatus);
router.patch("/:id/status", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), updateOrderStatus);

export default router;
