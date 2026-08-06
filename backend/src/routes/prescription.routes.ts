import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import {
  submitPrescription, getMyPrescriptions, getPrescriptionQueue, updatePrescriptionStatus,
} from "../controllers/prescription.controller";

const router = Router();

router.post("/", authenticateToken, submitPrescription);
router.get("/my", authenticateToken, getMyPrescriptions);
router.get("/queue", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), getPrescriptionQueue);
router.patch("/:id/verify", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), updatePrescriptionStatus);

export default router;
