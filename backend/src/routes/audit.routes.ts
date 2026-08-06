import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import { getAuditLogs } from "../lib/audit";

const router = Router();

router.get("/", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), async (req: any, res) => {
  try {
    const { page, limit, userId, action, entity, startDate, endDate } = req.query;
    const result = await getAuditLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      userId, action, entity, startDate, endDate,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
