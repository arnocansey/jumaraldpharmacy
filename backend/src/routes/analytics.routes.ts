import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import { getOverview } from "../controllers/analytics.controller";

const router = Router();

router.get("/overview", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), getOverview);

export default router;
