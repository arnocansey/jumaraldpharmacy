import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import { RoleName } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../lib/audit";

const router = Router();

const getProductReviews = async (req: any, res: any) => {
  try {
    const { productId } = req.params;
    const { page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.review.count({ where: { productId } }),
      prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const distribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { productId },
      _count: { rating: true },
      orderBy: { rating: "desc" },
    });

    res.json({
      reviews,
      hasMore: pageNum * limitNum < total,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      stats: { averageRating: stats._avg.rating || 0, totalReviews: stats._count.rating },
      distribution: distribution.map((d) => ({ rating: d.rating, count: d._count.rating })),
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

router.get("/product/:productId", getProductReviews);
router.get("/:productId", getProductReviews);

router.post("/", authenticateToken, async (req: any, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    if (!productId || !rating) {
      return res.status(400).json({ message: "Product ID and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const existing = await prisma.review.findFirst({
      where: { productId, userId: req.user.id },
    });
    if (existing) {
      return res.status(400).json({ message: "You already reviewed this product" });
    }

    const review = await prisma.review.create({
      data: { productId, userId: req.user.id, rating, title, comment, isVerified: true },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    const agg = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: { rating: agg._avg.rating || 0, reviewCount: agg._count.rating },
    });

    createAuditLog(req.user.id, "REVIEW_CREATED", "review", review.id, { productId, rating });

    return res.status(201).json(review);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.userId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    const { rating, title, comment } = req.body;
    const updated = await prisma.review.update({
      where: { id },
      data: { ...(rating && { rating }), ...(title !== undefined && { title }), ...(comment !== undefined && { comment }) },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.userId !== req.user.id && !["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await prisma.review.delete({ where: { id } });
    res.json({ message: "Review deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/helpful", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.update({
      where: { id },
      data: { helpful: { increment: 1 } },
    });
    res.json({ helpful: review.helpful });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/verify", authenticateToken, requireRole([RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PHARMACIST]), async (req: any, res) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.update({
      where: { id },
      data: { isVerified: true },
    });
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
