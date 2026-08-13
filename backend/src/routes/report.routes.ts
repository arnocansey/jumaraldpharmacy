import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import { getSalesReport, getRevenueChart, getDashboardSummary, exportOrdersCSV, exportInventoryCSV, exportPrescriptionsCSV } from "../controllers/report.controller";

const router = Router();

router.get("/sales", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getSalesReport);
router.get("/revenue-chart", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getRevenueChart);
router.get("/dashboard-summary", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getDashboardSummary);
router.get("/export/orders", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), exportOrdersCSV);
router.get("/export/inventory", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), exportInventoryCSV);
router.get("/export/prescriptions", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), exportPrescriptionsCSV);

export default router;
