import { Router } from "express";
import {
  handleAIConsult,
  handleCheckInteractions,
  handleExplainPrescription,
  handleGetRecommendations,
  handleOrchestratedChat,
  handleIngestKnowledge,
  handleSearchKnowledge,
  handleGetEscalations,
  handleResolveEscalation,
  handleGetAIAnalytics,
} from "../controllers/ai.controller";

const router = Router();

// Storefront & Client Chat Endpoints
router.post("/chat", handleOrchestratedChat);
router.post("/consult", handleAIConsult);
router.post("/check-interactions", handleCheckInteractions);
router.post("/explain-prescription", handleExplainPrescription);
router.get("/recommendations", handleGetRecommendations);

// Clinical Knowledge RAG Endpoints
router.post("/knowledge/ingest", handleIngestKnowledge);
router.get("/knowledge/search", handleSearchKnowledge);

// Pharmacist Copilot & Escalation Queue Endpoints
router.get("/escalations", handleGetEscalations);
router.put("/escalations/:id/resolve", handleResolveEscalation);
router.get("/analytics", handleGetAIAnalytics);

export default router;
