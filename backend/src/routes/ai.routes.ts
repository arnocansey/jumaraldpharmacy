import { Router } from "express";
import {
  handleAIConsult,
  handleCheckInteractions,
  handleExplainPrescription,
  handleGetRecommendations,
} from "../controllers/ai.controller";

const router = Router();

router.post("/consult", handleAIConsult);
router.post("/check-interactions", handleCheckInteractions);
router.post("/explain-prescription", handleExplainPrescription);
router.get("/recommendations", handleGetRecommendations);

export default router;
