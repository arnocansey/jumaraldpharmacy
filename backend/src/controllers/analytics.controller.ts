import { prisma } from "../lib/prisma";
import { Response } from "express";
import { PrescriptionStatus } from "@prisma/client";

export async function getOverview(req: any, res: Response) {
  try {
    const [totalOrders, totalRevenue, pendingPrescriptions, lowStockProducts, totalUsers] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.prescription.count({ where: { status: PrescriptionStatus.SUBMITTED } }),
      prisma.product.count({ where: { stockQuantity: { lte: 10 } } }),
      prisma.user.count(),
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

    return res.json({
      summary: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        pendingPrescriptions,
        lowStockProducts,
        totalUsers,
      },
      chartData,
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch analytics summary" });
  }
}
