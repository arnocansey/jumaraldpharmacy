import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { getDoctors, bookConsultation, getMyConsultations } from "../controllers/consultation.controller";

const router = Router();

router.get("/doctors", getDoctors);
router.post("/book", authenticateToken, bookConsultation);
router.get("/my", authenticateToken, getMyConsultations);

export default router;
