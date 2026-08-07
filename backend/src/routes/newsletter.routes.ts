import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import { sendNewsletter, subscribeToNewsletter } from "../lib/newsletter";

const router = Router();

router.post("/subscribe", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const result = await subscribeToNewsletter(email, name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/send", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN]), async (req: any, res) => {
  try {
    const { subject, htmlContent, segment } = req.body;
    if (!subject || !htmlContent) {
      return res.status(400).json({ message: "Subject and content are required" });
    }
    const result = await sendNewsletter({ subject, htmlContent, segment });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
