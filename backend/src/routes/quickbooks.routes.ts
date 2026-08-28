import { Router } from "express";
import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  handleQbwcSoap,
  downloadQwcFile,
  getSettings,
  updateSettings,
  getSyncStatus,
  triggerSyncNow,
  importItemsFile,
  exportIifFile,
} from "../controllers/quickbooks.controller";

const router = Router();

// 1. QuickBooks Web Connector SOAP endpoint (accepts raw XML SOAP envelopes from QBWC)
router.post(
  "/qbwc",
  express.text({ type: ["text/xml", "application/xml", "text/plain", "application/soap+xml"] }),
  handleQbwcSoap
);

// 2. Download .qwc file for QBWC setup
router.get("/qwc", downloadQwcFile);

// 3. Admin endpoints (Protected)
router.get(
  "/settings",
  authenticateToken,
  requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]),
  getSettings
);

router.put(
  "/settings",
  authenticateToken,
  requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]),
  updateSettings
);

router.get(
  "/sync-status",
  authenticateToken,
  requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]),
  getSyncStatus
);

router.post(
  "/sync-now",
  authenticateToken,
  requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]),
  triggerSyncNow
);

router.post(
  "/import-items",
  authenticateToken,
  requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST, RoleName.INVENTORY_CLERK]),
  importItemsFile
);

router.get(
  "/export-iif",
  authenticateToken,
  requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]),
  exportIifFile
);

export default router;
