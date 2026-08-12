import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  submitPrescription, getMyPrescriptions, getPrescriptionQueue, updatePrescriptionStatus,
  deletePrescription, adminDeletePrescription,
  migratePrescriptionsToCloudinary, cleanupOrphanPrescriptions,
} from "../controllers/prescription.controller";

const router = Router();

// Customer routes
router.post("/", authenticateToken, submitPrescription);
router.get("/my", authenticateToken, getMyPrescriptions);
router.delete("/:id", authenticateToken, deletePrescription);

// Admin/Pharmacist routes
router.get("/queue", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), getPrescriptionQueue);
router.put("/:id/status", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), updatePrescriptionStatus);
router.patch("/:id/verify", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), updatePrescriptionStatus);
router.delete("/:id/admin", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), adminDeletePrescription);

// Maintenance routes (Super Admin only)
router.post("/migrate-to-cloudinary", authenticateToken, requireRole([RoleName.SUPER_ADMIN]), migratePrescriptionsToCloudinary);
router.post("/cleanup-orphans", authenticateToken, requireRole([RoleName.SUPER_ADMIN]), cleanupOrphanPrescriptions);

export default router;
