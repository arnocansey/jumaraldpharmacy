import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  getLoyaltyAccount,
  earnPoints,
  redeemPoints,
  getLoyaltyTiers,
  getLoyaltyHistory,
  getReferralCode,
  applyReferral,
  getRewardsCatalog,
  claimReward,
  getLoyaltyStats,
} from "../controllers/loyalty.controller";

const router = Router();

router.get("/account", authenticateToken, getLoyaltyAccount);
router.post("/earn", authenticateToken, earnPoints);
router.post("/redeem", authenticateToken, redeemPoints);
router.get("/tiers", getLoyaltyTiers);
router.get("/history", authenticateToken, getLoyaltyHistory);
router.get("/referral", authenticateToken, getReferralCode);
router.post("/referral/apply", authenticateToken, applyReferral);
router.get("/rewards", getRewardsCatalog);
router.post("/rewards/claim", authenticateToken, claimReward);
router.get("/stats", getLoyaltyStats);

export default router;
