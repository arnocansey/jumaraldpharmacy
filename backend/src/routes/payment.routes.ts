import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { initializePayment, verifyPayment, handlePaystackWebhook } from "../controllers/payment.controller";

const router = Router();

router.post("/initialize", authenticateToken, initializePayment);
router.get("/verify/:reference", authenticateToken, verifyPayment);
router.post("/webhook", handlePaystackWebhook);

export default router;
