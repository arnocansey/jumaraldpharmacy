import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  getDoctors,
  onboardDoctor,
  toggleDoctorAvailability,
  deleteDoctor,
  bookConsultation,
  getMyConsultations,
} from "../controllers/consultation.controller";

const router = Router();

router.get("/doctors", getDoctors);
router.post("/doctors", authenticateToken, requireRole(["SUPER_ADMIN", "ADMIN"]), onboardDoctor);
router.patch("/doctors/:id/toggle", authenticateToken, requireRole(["SUPER_ADMIN", "ADMIN"]), toggleDoctorAvailability);
router.delete("/doctors/:id", authenticateToken, requireRole(["SUPER_ADMIN", "ADMIN"]), deleteDoctor);

router.post("/book", authenticateToken, bookConsultation);
router.get("/my", authenticateToken, getMyConsultations);

export default router;
