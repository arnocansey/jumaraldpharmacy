import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import { getSalesReport, getRevenueChart, getDashboardSummary } from "../controllers/report.controller";

const router = Router();

router.get("/sales", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getSalesReport);
router.get("/revenue-chart", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getRevenueChart);
router.get("/dashboard-summary", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getDashboardSummary);

export default router;
