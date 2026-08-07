import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { savePushSubscription } from "../lib/push";

const router = Router();

router.post("/subscribe", authenticateToken, async (req: any, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: "Invalid subscription" });
    }
    await savePushSubscription(req.user.id, subscription);
    res.json({ message: "Push subscription saved" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
