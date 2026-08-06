import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import { createOrder, getMyOrders, getAllOrders, updateOrderStatus } from "../controllers/order.controller";

const router = Router();

router.post("/", authenticateToken, createOrder);
router.get("/my", authenticateToken, getMyOrders);
router.get("/all", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), getAllOrders);
router.patch("/:id/status", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), updateOrderStatus);

export default router;
