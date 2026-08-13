import { Response } from "express";
import { prisma } from "../lib/prisma";
import { cacheGet, cacheSet } from "../lib/cache";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

export async function getSalesReport(req: any, res: Response) {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;
    const cacheKey = `report:sales:${startDate}:${endDate}:${groupBy}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const start = startDate ? new Date(startDate) : subDays(new Date(), 30);
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      include: { orderItems: { include: { product: { select: { name: true, category: { select: { name: true } } } } } } },
      orderBy: { createdAt: "asc" },
    });

    const revenueByPeriod: Record<string, { revenue: number; orders: number; items: number }> = {};
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalItems = 0;
    const categorySales: Record<string, number> = {};

    for (const order of orders) {
      const dateKey = groupBy === "month"
        ? format(order.createdAt, "yyyy-MM")
        : groupBy === "week"
          ? format(startOfWeek(order.createdAt), "yyyy-MM-dd")
          : format(order.createdAt, "yyyy-MM-dd");

      if (!revenueByPeriod[dateKey]) {
        revenueByPeriod[dateKey] = { revenue: 0, orders: 0, items: 0 };
      }
      revenueByPeriod[dateKey].revenue += order.totalAmount;
      revenueByPeriod[dateKey].orders += 1;

      for (const item of order.orderItems) {
        revenueByPeriod[dateKey].items += item.quantity;
        totalItems += item.quantity;
        const catName = item.product.category?.name || "Uncategorized";
        categorySales[catName] = (categorySales[catName] || 0) + item.total;
      }

      totalRevenue += order.totalAmount;
      totalOrders += 1;
    }

    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: start, lte: end }, status: { notIn: ["CANCELLED", "REFUNDED"] } } },
      _sum: { total: true, quantity: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    });

    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    const result = {
      summary: { totalRevenue, totalOrders, totalItems, avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0 },
      revenueByPeriod: Object.entries(revenueByPeriod).map(([date, data]) => ({ date, ...data })),
      categorySales: Object.entries(categorySales).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue),
      topProducts: topProducts.map((p) => ({
        ...productMap[p.productId],
        totalRevenue: p._sum.total,
        totalQuantity: p._sum.quantity,
        orderCount: p._count,
      })),
    };

    await cacheSet(cacheKey, result, 600);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getRevenueChart(req: any, res: Response) {
  try {
    const { days = 30 } = req.query;
    const start = subDays(new Date(), parseInt(days));

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      select: { createdAt: true, totalAmount: true },
    });

    const dailyRevenue: Record<string, number> = {};
    for (let i = 0; i < parseInt(days); i++) {
      const date = format(subDays(new Date(), parseInt(days) - 1 - i), "yyyy-MM-dd");
      dailyRevenue[date] = 0;
    }

    for (const order of orders) {
      const date = format(order.createdAt, "yyyy-MM-dd");
      if (dailyRevenue[date] !== undefined) {
        dailyRevenue[date] += order.totalAmount;
      }
    }

    const data = Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue }));
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getDashboardSummary(req: any, res: Response) {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const [totalProducts, activeProducts, lowStock, outOfStock, totalUsers, todayOrders, monthOrders, todayRevenue, monthRevenue, pendingPrescriptions, activeDeliveries, expiringBatches] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { stockQuantity: { lte: 10, gt: 0 }, isActive: true } }),
      prisma.product.count({ where: { stockQuantity: 0, isActive: true } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: todayStart, lte: todayEnd }, status: { notIn: ["CANCELLED", "REFUNDED"] } }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { createdAt: { gte: monthStart }, status: { notIn: ["CANCELLED", "REFUNDED"] } }, _sum: { totalAmount: true } }),
      prisma.prescription.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.deliveryTracking.count({ where: { status: { in: ["PREPARING", "PACKED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "NEARBY"] } } }),
      prisma.batchExpiry.count({ where: { expiryDate: { lte: subDays(now, 0) } } }),
    ]);

    res.json({
      products: { total: totalProducts, active: activeProducts, lowStock, outOfStock },
      users: { total: totalUsers },
      orders: { today: todayOrders, month: monthOrders, todayRevenue: todayRevenue._sum.totalAmount || 0, monthRevenue: monthRevenue._sum.totalAmount || 0 },
      prescriptions: { pending: pendingPrescriptions },
      deliveries: { active: activeDeliveries },
      batches: { expiring: expiringBatches },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function exportOrdersCSV(req: any, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      take: 1000,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    });

    let csv = "Order Number,Customer Name,Customer Email,Status,Total Amount (GHS),Created At\n";
    for (const o of orders) {
      const cleanName = (o.user?.name || "Guest").replace(/,/g, " ");
      const cleanEmail = (o.user?.email || "").replace(/,/g, " ");
      csv += `${o.orderNumber},"${cleanName}","${cleanEmail}",${o.status},${o.totalAmount},${o.createdAt.toISOString()}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=orders_export_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function exportInventoryCSV(req: any, res: Response) {
  try {
    const products = await prisma.product.findMany({
      take: 1000,
      orderBy: { name: "asc" },
      include: { category: { select: { name: true } } },
    });

    let csv = "SKU,Product Name,Category,Price (GHS),Stock Quantity,Requires Prescription,Is Active\n";
    for (const p of products) {
      const cleanName = p.name.replace(/,/g, " ");
      const cleanCat = (p.category?.name || "General").replace(/,/g, " ");
      csv += `${p.sku},"${cleanName}","${cleanCat}",${p.price},${p.stockQuantity},${p.requiresPrescription},${p.isActive}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=inventory_export_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function exportPrescriptionsCSV(req: any, res: Response) {
  try {
    const rxs = await prisma.prescription.findMany({
      take: 1000,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    });

    let csv = "Prescription ID,Patient Name,Patient Email,Status,Doctor Name,Created At\n";
    for (const r of rxs) {
      const cleanName = (r.user?.name || "Patient").replace(/,/g, " ");
      const cleanEmail = (r.user?.email || "").replace(/,/g, " ");
      const cleanDoctor = (r.doctorName || "N/A").replace(/,/g, " ");
      csv += `${r.id},"${cleanName}","${cleanEmail}",${r.status},"${cleanDoctor}",${r.createdAt.toISOString()}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=prescriptions_export_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
