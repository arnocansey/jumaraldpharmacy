import { prisma } from "../lib/prisma";
import { Response } from "express";
import { PrescriptionStatus, OrderStatus } from "@prisma/client";
import { cacheGet, cacheSet } from "../lib/cache";

export async function getOverview(req: any, res: Response) {
  try {
    const cacheKey = "analytics:overview";
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }
    const [
      totalOrders,
      totalRevenue,
      pendingPrescriptions,
      lowStockProducts,
      totalUsers,
      totalProducts,
      totalBranches,
      activeBranches,
      pendingOrders,
      deliveredOrders,
      processingOrders,
      cancelledOrders,
      outOfStockProducts,
      expiringProducts,
      totalReviews,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.prescription.count({ where: { status: PrescriptionStatus.SUBMITTED } }),
      prisma.product.count({ where: { stockQuantity: { lte: 10, gt: 0 } } }),
      prisma.user.count(),
      prisma.product.count(),
      prisma.branch.count(),
      prisma.branch.count({ where: { isActive: true } }),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      prisma.product.count({ where: { stockQuantity: 0 } }),
      prisma.batchExpiry.count({
        where: {
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          quantity: { gt: 0 },
        },
      }),
      prisma.review.count(),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrders = await prisma.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: sixMonthsAgo } },
      _sum: { totalAmount: true },
      _count: true,
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const monthStr = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const matching = monthlyOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthStr;
      });

      return {
        month,
        revenue: matching.reduce((sum, m) => sum + (m._sum.totalAmount || 0), 0),
        orders: matching.reduce((sum, m) => sum + m._count, 0),
      };
    });

    const avgOrderValue = totalOrders > 0 ? (totalRevenue._sum.totalAmount || 0) / totalOrders : 0;

    const result = {
      summary: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        pendingPrescriptions,
        lowStockProducts,
        totalUsers,
        totalProducts,
        totalBranches,
        activeBranches,
        pendingDeliveries: pendingOrders,
        deliveredOrders,
        processingOrders,
        cancelledOrders,
        outOfStockProducts,
        expiringProducts,
        totalReviews,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      chartData,
    };

    await cacheSet(cacheKey, result, 45); // 45s cache
    res.setHeader("X-Cache", "MISS");
    return res.json(result);
  } catch {
    return res.status(500).json({ message: "Failed to fetch analytics summary" });
  }
}

export async function getTopProducts(req: any, res: Response) {
  try {
    const topProducts = await prisma.product.findMany({
      take: 5,
      orderBy: { orderItems: { _count: "desc" } },
      include: {
        _count: { select: { orderItems: true, reviews: true } },
        category: { select: { name: true } },
      },
    });

    const result = topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.name || "Uncategorized",
      totalSold: p._count.orderItems,
      totalReviews: p._count.reviews,
      price: p.price,
    }));

    return res.json(result);
  } catch {
    return res.status(500).json({ message: "Failed to fetch top products" });
  }
}

export async function getRecentOrders(req: any, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { orderItems: true } },
      },
    });

    const result = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber || `ORD-${o.id.slice(0, 8).toUpperCase()}`,
      customer: o.user?.name || "Guest",
      total: o.totalAmount,
      status: o.status,
      items: o._count.orderItems,
      createdAt: o.createdAt,
    }));

    return res.json(result);
  } catch {
    return res.status(500).json({ message: "Failed to fetch recent orders" });
  }
}

export async function getPrescriptionStats(req: any, res: Response) {
  try {
    const [submitted, reviewing, approved, rejected] = await Promise.all([
      prisma.prescription.count({ where: { status: PrescriptionStatus.SUBMITTED } }),
      prisma.prescription.count({ where: { status: PrescriptionStatus.UNDER_REVIEW } }),
      prisma.prescription.count({ where: { status: PrescriptionStatus.APPROVED } }),
      prisma.prescription.count({ where: { status: PrescriptionStatus.REJECTED } }),
    ]);

    const fulfilled = await prisma.order.count({ where: { prescriptionId: { not: null }, status: OrderStatus.DELIVERED } });

    return res.json({ submitted, reviewing, approved, fulfilled, rejected });
  } catch {
    return res.status(500).json({ message: "Failed to fetch prescription stats" });
  }
}

export async function getLowStockAlerts(req: any, res: Response) {
  try {
    const products = await prisma.product.findMany({
      where: { stockQuantity: { lte: 10 } },
      orderBy: { stockQuantity: "asc" },
      take: 10,
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        sku: true,
        category: { select: { name: true } },
      },
    });

    return res.json(products.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stockQuantity,
      sku: p.sku,
      category: p.category?.name || "Uncategorized",
      status: p.stockQuantity === 0 ? "OUT_OF_STOCK" : "LOW",
    })));
  } catch {
    return res.status(500).json({ message: "Failed to fetch low stock alerts" });
  }
}

export async function getDeliveryStats(req: any, res: Response) {
  try {
    const [pending, assigned, inTransit, delivered, failed] = await Promise.all([
      prisma.deliveryTracking.count({ where: { status: { in: ["PREPARING", "PACKED"] } } }),
      prisma.deliveryTracking.count({ where: { status: "ASSIGNED" } }),
      prisma.deliveryTracking.count({ where: { status: { in: ["PICKED_UP", "IN_TRANSIT", "NEARBY"] } } }),
      prisma.deliveryTracking.count({ where: { status: "DELIVERED" } }),
      prisma.deliveryTracking.count({ where: { status: { in: ["FAILED", "CANCELLED"] } } }),
    ]);

    const total = pending + assigned + inTransit + delivered + failed;

    return res.json({ pending, assigned, inTransit, delivered, failed, total });
  } catch {
    return res.status(500).json({ message: "Failed to fetch delivery stats" });
  }
}

export async function getBranchPerformance(req: any, res: Response) {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { staff: true, inventory: true, orders: true } },
        orders: {
          select: { totalAmount: true },
        },
      },
    });

    const result = branches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      staff: b._count.staff,
      products: b._count.inventory,
      orders: b._count.orders,
      revenue: b.orders.reduce((sum, o) => sum + o.totalAmount, 0),
    }));

    return res.json(result);
  } catch {
    return res.status(500).json({ message: "Failed to fetch branch performance" });
  }
}

export async function getExpiringBatches(req: any, res: Response) {
  try {
    const batches = await prisma.batchExpiry.findMany({
      where: {
        expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        quantity: { gt: 0 },
      },
      include: {
        product: { select: { name: true } },
      },
      orderBy: { expiryDate: "asc" },
      take: 10,
    });

    return res.json(batches.map((b) => ({
      id: b.id,
      productName: b.product.name,
      batchNumber: b.batchNumber,
      quantity: b.quantity,
      expiryDate: b.expiryDate,
      daysLeft: Math.max(0, Math.ceil((b.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    })));
  } catch {
    return res.status(500).json({ message: "Failed to fetch expiring batches" });
  }
}

export async function getUserGrowth(req: any, res: Response) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const users = await prisma.user.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: sixMonthsAgo } },
      _count: true,
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const monthStr = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const matching = users.filter((u) => {
        const d = new Date(u.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthStr;
      });

      return {
        month,
        users: matching.reduce((sum, m) => sum + m._count, 0),
      };
    });

    return res.json(chartData);
  } catch {
    return res.status(500).json({ message: "Failed to fetch user growth" });
  }
}
