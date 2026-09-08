import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { initializePayment, verifyPayment } from "../controllers/payment.controller";

const router = Router();

router.post("/initialize", authenticateToken, initializePayment);
router.get("/verify/:reference", authenticateToken, verifyPayment);

export default router;
