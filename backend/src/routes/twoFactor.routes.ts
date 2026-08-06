import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { enableTwoFactor, verifyAndEnableTwoFactor, disableTwoFactor, getTwoFactorStatus } from "../lib/twoFactor";
import { createAuditLog } from "../lib/audit";

const router = Router();

router.get("/status", authenticateToken, async (req: any, res) => {
  try {
    const status = await getTwoFactorStatus(req.user.id);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/enable", authenticateToken, async (req: any, res) => {
  try {
    const result = await enableTwoFactor(req.user.id);
    res.json({ secret: result.secret, otpauthUrl: result.otpauthUrl });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/verify", authenticateToken, async (req: any, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code is required" });
    const verified = await verifyAndEnableTwoFactor(req.user.id, code);
    if (!verified) return res.status(400).json({ message: "Invalid code" });
    await createAuditLog(req.user.id, "2FA_ENABLED", "user", req.user.id);
    res.json({ message: "2FA enabled successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/disable", authenticateToken, async (req: any, res) => {
  try {
    await disableTwoFactor(req.user.id);
    await createAuditLog(req.user.id, "2FA_DISABLED", "user", req.user.id);
    res.json({ message: "2FA disabled" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
