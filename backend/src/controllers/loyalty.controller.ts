import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";
import crypto from "crypto";

const TIER_THRESHOLDS = {
  BRONZE: { minSpent: 0, pointsMultiplier: 1 },
  SILVER: { minSpent: 500, pointsMultiplier: 1.5 },
  GOLD: { minSpent: 2000, pointsMultiplier: 2 },
  PLATINUM: { minSpent: 5000, pointsMultiplier: 3 },
};

const POINTS_PER_CEDI = 10;

function calculateTier(totalSpent: number): "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" {
  if (totalSpent >= TIER_THRESHOLDS.PLATINUM.minSpent) return "PLATINUM";
  if (totalSpent >= TIER_THRESHOLDS.GOLD.minSpent) return "GOLD";
  if (totalSpent >= TIER_THRESHOLDS.SILVER.minSpent) return "SILVER";
  return "BRONZE";
}

export async function getLoyaltyAccount(req: AuthenticatedRequest, res: Response) {
  try {
    let account = await prisma.loyaltyAccount.findUnique({ where: { userId: req.user!.id } });

    if (!account) {
      const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      account = await prisma.loyaltyAccount.create({
        data: { userId: req.user!.id, referralCode },
      });
    }

    const nextTier = account.tier === "PLATINUM" ? null :
      account.tier === "GOLD" ? { name: "PLATINUM", threshold: TIER_THRESHOLDS.PLATINUM.minSpent } :
      account.tier === "SILVER" ? { name: "GOLD", threshold: TIER_THRESHOLDS.GOLD.minSpent } :
      { name: "SILVER", threshold: TIER_THRESHOLDS.SILVER.minSpent };

    const progressToNext = nextTier ? Math.min(100, (account.totalSpent / nextTier.threshold) * 100) : 100;

    return res.json({ ...account, nextTier, progressToNext });
  } catch {
    return res.status(500).json({ message: "Failed to fetch loyalty account" });
  }
}

export async function earnPoints(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount) return res.status(400).json({ message: "orderId and amount required" });

    let account = await prisma.loyaltyAccount.findUnique({ where: { userId: req.user!.id } });
    if (!account) {
      const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      account = await prisma.loyaltyAccount.create({
        data: { userId: req.user!.id, referralCode },
      });
    }

    const multiplier = TIER_THRESHOLDS[account.tier].pointsMultiplier;
    const points = Math.floor(amount * POINTS_PER_CEDI * multiplier);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.loyaltyPoint.create({
        data: { accountId: account!.id, points, type: "EARNED", description: `Order ${orderId}`, orderId, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      });

      const newTotalSpent = account!.totalSpent + amount;
      const newTier = calculateTier(newTotalSpent);

      return tx.loyaltyAccount.update({
        where: { id: account!.id },
        data: {
          totalPoints: { increment: points },
          availablePoints: { increment: points },
          totalSpent: newTotalSpent,
          tier: newTier,
        },
      });
    });

    return res.json({ pointsEarned: points, account: updated });
  } catch {
    return res.status(500).json({ message: "Failed to earn points" });
  }
}

export async function redeemPoints(req: AuthenticatedRequest, res: Response) {
  try {
    const { points, rewardType, rewardValue, orderId } = req.body;
    if (!points || !rewardType || !rewardValue) {
      return res.status(400).json({ message: "points, rewardType, and rewardValue required" });
    }

    const account = await prisma.loyaltyAccount.findUnique({ where: { userId: req.user!.id } });
    if (!account || account.availablePoints < points) {
      return res.status(400).json({ message: "Insufficient points" });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.loyaltyPoint.create({
        data: { accountId: account.id, points: -points, type: "REDEEMED", description: `Redeemed for ${rewardType}`, orderId },
      });

      await tx.loyaltyRedemption.create({
        data: { accountId: account.id, pointsUsed: points, rewardType, rewardValue, orderId },
      });

      return tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { availablePoints: { decrement: points } },
      });
    });

    return res.json({ account: result, discountApplied: rewardValue });
  } catch {
    return res.status(500).json({ message: "Failed to redeem points" });
  }
}

export async function getLoyaltyTiers(req: any, res: Response) {
  try {
    return res.json({
      tiers: [
        { name: "BRONZE", minSpent: 0, pointsMultiplier: 1, benefits: ["1x points on all purchases", "Birthday reward"] },
        { name: "SILVER", minSpent: 500, pointsMultiplier: 1.5, benefits: ["1.5x points on all purchases", "Birthday reward", "Free delivery on orders over GHS 100"] },
        { name: "GOLD", minSpent: 2000, pointsMultiplier: 2, benefits: ["2x points on all purchases", "Birthday reward", "Free delivery on all orders", "Priority support"] },
        { name: "PLATINUM", minSpent: 5000, pointsMultiplier: 3, benefits: ["3x points on all purchases", "Birthday reward", "Free delivery on all orders", "Priority support", "Exclusive offers", "Personal pharmacist"] },
      ],
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch tiers" });
  }
}

export async function getLoyaltyHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const account = await prisma.loyaltyAccount.findUnique({ where: { userId: req.user!.id } });
    if (!account) return res.json([]);

    const history = await prisma.loyaltyPoint.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return res.json(history);
  } catch {
    return res.status(500).json({ message: "Failed to fetch loyalty history" });
  }
}

export async function getReferralCode(req: AuthenticatedRequest, res: Response) {
  try {
    let account = await prisma.loyaltyAccount.findUnique({ where: { userId: req.user!.id } });
    if (!account) {
      const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      account = await prisma.loyaltyAccount.create({
        data: { userId: req.user!.id, referralCode },
      });
    }
    return res.json({ referralCode: account.referralCode });
  } catch {
    return res.status(500).json({ message: "Failed to get referral code" });
  }
}

export async function applyReferral(req: AuthenticatedRequest, res: Response) {
  try {
    const { referralCode } = req.body;
    if (!referralCode) return res.status(400).json({ message: "referralCode required" });

    const referrer = await prisma.loyaltyAccount.findUnique({ where: { referralCode } });
    if (!referrer) return res.status(404).json({ message: "Invalid referral code" });
    if (referrer.userId === req.user!.id) return res.status(400).json({ message: "Cannot refer yourself" });

    let account = await prisma.loyaltyAccount.findUnique({ where: { userId: req.user!.id } });
    if (!account) {
      const newCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      account = await prisma.loyaltyAccount.create({
        data: { userId: req.user!.id, referralCode: newCode, referredBy: referralCode },
      });
    }

    const referralBonus = 500;
    await prisma.$transaction(async (tx) => {
      await tx.loyaltyPoint.create({
        data: { accountId: account!.id, points: referralBonus, type: "REFERRAL", description: `Referred by ${referrer.userId}` },
      });
      await tx.loyaltyAccount.update({ where: { id: account!.id }, data: { availablePoints: { increment: referralBonus }, totalPoints: { increment: referralBonus } } });

      await tx.loyaltyPoint.create({
        data: { accountId: referrer.id, points: referralBonus, type: "REFERRAL", description: `Referral bonus for inviting ${req.user!.id}` },
      });
      await tx.loyaltyAccount.update({ where: { id: referrer.id }, data: { availablePoints: { increment: referralBonus }, totalPoints: { increment: referralBonus } } });
    });

    return res.json({ message: "Referral applied successfully", bonusPoints: referralBonus });
  } catch {
    return res.status(500).json({ message: "Failed to apply referral" });
  }
}

export async function getRewardsCatalog(req: any, res: Response) {
  try {
    const rewards = [
      { id: "discount-5", name: "5% Discount", type: "DISCOUNT", points: 200, value: 5, description: "5% off your next order" },
      { id: "discount-10", name: "10% Discount", type: "DISCOUNT", points: 400, value: 10, description: "10% off your next order" },
      { id: "discount-20", name: "20% Discount", type: "DISCOUNT", points: 800, value: 20, description: "20% off your next order" },
      { id: "free-delivery", name: "Free Delivery", type: "DELIVERY", points: 150, value: 0, description: "Free delivery on your next order" },
      { id: "free-consultation", name: "Free Consultation", type: "CONSULTATION", points: 1000, value: 0, description: "Free online doctor consultation" },
    ];
    return res.json(rewards);
  } catch {
    return res.status(500).json({ message: "Failed to fetch rewards catalog" });
  }
}

export async function claimReward(req: AuthenticatedRequest, res: Response) {
  try {
    const { rewardId } = req.body;
    if (!rewardId) return res.status(400).json({ message: "rewardId required" });

    const account = await prisma.loyaltyAccount.findUnique({ where: { userId: req.user!.id } });
    if (!account) return res.status(404).json({ message: "Loyalty account not found" });

    const rewards: Record<string, { name: string; type: string; points: number; value: number }> = {
      "discount-5": { name: "5% Discount", type: "DISCOUNT", points: 200, value: 5 },
      "discount-10": { name: "10% Discount", type: "DISCOUNT", points: 400, value: 10 },
      "discount-20": { name: "20% Discount", type: "DISCOUNT", points: 800, value: 20 },
      "free-delivery": { name: "Free Delivery", type: "DELIVERY", points: 150, value: 0 },
      "free-consultation": { name: "Free Consultation", type: "CONSULTATION", points: 1000, value: 0 },
    };

    const reward = rewards[rewardId];
    if (!reward) return res.status(404).json({ message: "Reward not found" });
    if (account.availablePoints < reward.points) return res.status(400).json({ message: "Insufficient points" });

    await prisma.$transaction(async (tx) => {
      await tx.loyaltyPoint.create({
        data: { accountId: account.id, points: -reward.points, type: "REDEEMED", description: `Claimed: ${reward.name}` },
      });
      await tx.loyaltyRewardClaim.create({
        data: { accountId: account.id, rewardName: reward.name, rewardType: reward.type, rewardValue: reward.value },
      });
      await tx.loyaltyAccount.update({ where: { id: account.id }, data: { availablePoints: { decrement: reward.points } } });
    });

    return res.json({ message: "Reward claimed successfully", reward });
  } catch {
    return res.status(500).json({ message: "Failed to claim reward" });
  }
}

export async function getLoyaltyStats(req: any, res: Response) {
  try {
    const [totalMembers, totalPointsEarned, totalPointsRedeemed, tierDistribution] = await Promise.all([
      prisma.loyaltyAccount.count(),
      prisma.loyaltyPoint.aggregate({ where: { type: "EARNED" }, _sum: { points: true } }),
      prisma.loyaltyPoint.aggregate({ where: { type: "REDEEMED" }, _sum: { points: true } }),
      prisma.loyaltyAccount.groupBy({ by: ["tier"], _count: true }),
    ]);

    const topMembers = await prisma.loyaltyAccount.findMany({
      take: 10,
      orderBy: { totalSpent: "desc" },
      include: { user: { select: { name: true, email: true } } },
    });

    return res.json({
      totalMembers,
      totalPointsEarned: totalPointsEarned._sum.points || 0,
      totalPointsRedeemed: Math.abs(totalPointsRedeemed._sum.points || 0),
      tierDistribution,
      topMembers,
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch loyalty stats" });
  }
}
