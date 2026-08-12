import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  exportTableCSV,
} from "../controllers/backup.controller";

const router = Router();

// Protect all backup management endpoints to ADMIN and SUPER_ADMIN
router.use(authenticateToken, requireRole(["SUPER_ADMIN", "ADMIN"]));

router.post("/create", createBackup);
router.get("/list", listBackups);
router.get("/download/:filename", downloadBackup);
router.post("/restore/:filename", restoreBackup);
router.delete("/:filename", deleteBackup);
router.get("/export/:table", exportTableCSV);

export default router;
