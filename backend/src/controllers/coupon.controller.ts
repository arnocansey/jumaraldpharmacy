import { prisma } from "../lib/prisma";
import { Request, Response } from "express";

export async function getCoupons(req: any, res: Response) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ coupons });
  } catch {
    return res.status(500).json({ message: "Failed to fetch coupons" });
  }
}

export async function getCouponById(req: any, res: Response) {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    return res.json(coupon);
  } catch {
    return res.status(500).json({ message: "Failed to fetch coupon" });
  }
}

export async function createCoupon(req: any, res: Response) {
  try {
    const { code, description, discountPct, discountAmount, maxDiscount, minOrderAmount, usageLimit, validFrom, validUntil, isActive, appliesTo } = req.body;

    if (!code || !validFrom || !validUntil) {
      return res.status(400).json({ message: "Code, validFrom, and validUntil are required" });
    }

    if (!discountPct && !discountAmount) {
      return res.status(400).json({ message: "Either discountPct or discountAmount is required" });
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        discountPct: discountPct ? Number(discountPct) : null,
        discountAmount: discountAmount ? Number(discountAmount) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive: isActive !== false,
        appliesTo: appliesTo || null,
      },
    });

    return res.status(201).json(coupon);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to create coupon" });
  }
}

export async function updateCoupon(req: any, res: Response) {
  try {
    const { code, description, discountPct, discountAmount, maxDiscount, minOrderAmount, usageLimit, validFrom, validUntil, isActive, appliesTo } = req.body;

    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Coupon not found" });

    if (code && code.toUpperCase() !== existing.code) {
      const duplicate = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
      if (duplicate) return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        code: code ? code.toUpperCase() : undefined,
        description: description !== undefined ? description : undefined,
        discountPct: discountPct !== undefined ? (discountPct ? Number(discountPct) : null) : undefined,
        discountAmount: discountAmount !== undefined ? (discountAmount ? Number(discountAmount) : null) : undefined,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? Number(maxDiscount) : null) : undefined,
        minOrderAmount: minOrderAmount !== undefined ? (minOrderAmount ? Number(minOrderAmount) : null) : undefined,
        usageLimit: usageLimit !== undefined ? (usageLimit ? Number(usageLimit) : null) : undefined,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        appliesTo: appliesTo !== undefined ? appliesTo : undefined,
      },
    });

    return res.json(coupon);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Failed to update coupon" });
  }
}

export async function deleteCoupon(req: any, res: Response) {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Coupon not found" });

    await prisma.coupon.delete({ where: { id: req.params.id } });
    return res.json({ message: "Coupon deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete coupon" });
  }
}

export async function toggleCoupon(req: any, res: Response) {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Coupon not found" });

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
    });

    return res.json(coupon);
  } catch {
    return res.status(500).json({ message: "Failed to toggle coupon" });
  }
}

export async function validateCoupon(req: any, res: Response) {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code is required" });

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
    if (!coupon.isActive) return res.status(400).json({ message: "Coupon is inactive" });

    const now = new Date();
    if (now < coupon.validFrom) return res.status(400).json({ message: "Coupon is not yet valid" });
    if (now > coupon.validUntil) return res.status(400).json({ message: "Coupon has expired" });

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    if (coupon.minOrderAmount && orderAmount && Number(orderAmount) < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount is GHS ${coupon.minOrderAmount}` });
    }

    let discount = 0;
    if (coupon.discountPct) {
      discount = (Number(orderAmount || 0) * coupon.discountPct) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.discountAmount) {
      discount = coupon.discountAmount;
    }

    return res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountPct: coupon.discountPct,
        discountAmount: coupon.discountAmount,
        maxDiscount: coupon.maxDiscount,
      },
      discount: Math.round(discount * 100) / 100,
    });
  } catch {
    return res.status(500).json({ message: "Failed to validate coupon" });
  }
}
