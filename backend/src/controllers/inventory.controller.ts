import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";

const adjustInventorySchema = z.object({
  productId: z.string(),
  branchId: z.string().optional(),
  adjustment: z.number().int(),
  reason: z.string().min(1),
});

const bulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      productId: z.string(),
      branchId: z.string().optional(),
      stockQuantity: z.number().int().min(0).optional(),
      quantity: z.number().int().min(0).optional(),
    })
  ).min(1),
});

export async function getInventoryReport(req: any, res: Response) {
  try {
    const branchId = req.query.branchId as string | undefined;
    const lowStock = req.query.lowStock === "true";

    if (branchId) {
      const inventory = await prisma.branchInventory.findMany({
        where: { branchId },
        include: {
          product: { select: { id: true, name: true, sku: true, price: true, images: true, minStockAlert: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { quantity: "asc" },
      });

      const filtered = lowStock ? inventory.filter((i) => i.quantity <= (i.product?.minStockAlert || 10)) : inventory;

      const totalProducts = inventory.length;
      const totalStock = inventory.reduce((sum, i) => sum + i.quantity, 0);
      const lowStockCount = inventory.filter((i) => i.quantity <= (i.product?.minStockAlert || 10)).length;
      const outOfStockCount = inventory.filter((i) => i.quantity === 0).length;
      const totalValue = inventory.reduce((sum, i) => sum + i.quantity * (i.product?.price || 0), 0);

      return res.json({
        inventory: filtered,
        summary: { totalProducts, totalStock, lowStockCount, outOfStockCount, totalValue }
      });
    }

    // Global Inventory view across master product catalog
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        batchExpiries: { select: { expiryDate: true, batchNumber: true }, orderBy: { expiryDate: "asc" }, take: 1 },
      },
      orderBy: { stockQuantity: "asc" },
    });

    const mappedInventory = products.map((p) => ({
      id: p.id,
      productId: p.id,
      quantity: p.stockQuantity,
      product: p,
      branch: { id: "main", name: "Main Warehouse / Online Store" },
    }));

    const filtered = lowStock ? mappedInventory.filter((i) => i.quantity <= (i.product.minStockAlert || 10)) : mappedInventory;

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const lowStockCount = products.filter((p) => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) <= (p.minStockAlert || 10)).length;
    const outOfStockCount = products.filter((p) => (p.stockQuantity || 0) === 0).length;
    const totalStockValue = products.reduce((sum, p) => sum + (p.stockQuantity || 0) * (p.price || 0), 0);

    const expiringSoon = await prisma.batchExpiry.count({
      where: { expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
    });

    const productsList = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stockQuantity,
      minStockAlert: p.minStockAlert,
      price: p.price,
      category: p.category ? { name: p.category.name } : undefined,
      expiryDate: p.batchExpiries?.[0]?.expiryDate ? p.batchExpiries[0].expiryDate.toISOString() : undefined,
      batchNumber: p.batchExpiries?.[0]?.batchNumber,
    }));

    return res.json({
      totalProducts,
      totalStockValue,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      expiringSoon,
      products: productsList,
      inventory: filtered,
      summary: { totalProducts, totalStock, lowStockCount, outOfStockCount, expiringSoon, totalValue: totalStockValue }
    });
  } catch (err: any) {
    console.error("getInventoryReport error:", err);
    return res.status(500).json({ message: "Failed to fetch inventory report" });
  }
}

export async function getExpiringProducts(req: any, res: Response) {
  try {
    const days = Number(req.query.days) || 30;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    const batches = await prisma.batchExpiry.findMany({
      where: { expiryDate: { lte: threshold, gte: new Date() } },
      include: {
        product: { select: { id: true, name: true, sku: true, images: true, stockQuantity: true } },
        branch: { select: { name: true } },
      },
      orderBy: { expiryDate: "asc" },
    });

    const formatted = batches.map((b) => ({
      id: b.id,
      name: b.product.name,
      sku: b.product.sku,
      stockQuantity: b.quantity || b.product.stockQuantity,
      price: 0,
      expiryDate: b.expiryDate.toISOString(),
      batchNumber: b.batchNumber,
    }));

    return res.json(formatted);
  } catch {
    return res.status(500).json({ message: "Failed to fetch expiring products" });
  }
}

export async function getExpiredProducts(req: any, res: Response) {
  try {
    const batches = await prisma.batchExpiry.findMany({
      where: { expiryDate: { lt: new Date() } },
      include: {
        product: { select: { id: true, name: true, sku: true, images: true, stockQuantity: true } },
        branch: { select: { name: true } },
      },
      orderBy: { expiryDate: "asc" },
    });

    const formatted = batches.map((b) => ({
      id: b.id,
      name: b.product.name,
      sku: b.product.sku,
      stockQuantity: b.quantity || b.product.stockQuantity,
      price: 0,
      expiryDate: b.expiryDate.toISOString(),
      batchNumber: b.batchNumber,
    }));

    return res.json(formatted);
  } catch {
    return res.status(500).json({ message: "Failed to fetch expired products" });
  }
}

export async function adjustInventory(req: AuthenticatedRequest, res: Response) {
  try {
    const data = adjustInventorySchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (data.branchId) {
      await prisma.branchInventory.upsert({
        where: { branchId_productId: { branchId: data.branchId, productId: data.productId } },
        update: { quantity: { increment: data.adjustment } },
        create: { branchId: data.branchId, productId: data.productId, quantity: Math.max(0, data.adjustment) },
      });
    } else {
      const newQty = Math.max(0, product.stockQuantity + data.adjustment);
      await prisma.product.update({ where: { id: data.productId }, data: { stockQuantity: newQty } });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "INVENTORY_ADJUSTED",
        entity: "Product",
        entityId: data.productId,
        details: `Product: "${product.name}". Adjustment: ${data.adjustment > 0 ? "+" : ""}${data.adjustment}. Reason: ${data.reason}`,
      },
    });

    return res.json({ message: "Inventory adjusted successfully" });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to adjust inventory" });
  }
}

export async function getStockAlerts(req: any, res: Response) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true, stockQuantity: true, minStockAlert: true, images: true, price: true, category: { select: { name: true } } },
      orderBy: { stockQuantity: "asc" },
    });

    const lowStockProducts = products.filter((p) => p.stockQuantity <= (p.minStockAlert || 10));
    const outOfStock = lowStockProducts.filter((p) => p.stockQuantity === 0);
    const lowStock = lowStockProducts.filter((p) => p.stockQuantity > 0);

    const expiringIn30 = await prisma.batchExpiry.findMany({
      where: {
        expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
      include: { product: { select: { name: true, sku: true } } },
    });

    const alerts = lowStockProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stockQuantity,
      minStockAlert: p.minStockAlert,
      category: p.category?.name || "General",
    }));

    return res.json({ alerts, outOfStock, lowStock, expiringIn30 });
  } catch (err: any) {
    console.error("getStockAlerts error:", err);
    return res.status(500).json({ message: "Failed to fetch stock alerts" });
  }
}

export async function bulkUpdateStock(req: AuthenticatedRequest, res: Response) {
  try {
    const data = bulkUpdateSchema.parse(req.body);

    await prisma.$transaction(async (tx) => {
      for (const update of data.updates) {
        const qty = update.stockQuantity ?? update.quantity ?? 0;
        if (update.branchId) {
          await tx.branchInventory.upsert({
            where: { branchId_productId: { branchId: update.branchId, productId: update.productId } },
            update: { quantity: qty, lastRestockedAt: new Date() },
            create: { branchId: update.branchId, productId: update.productId, quantity: qty },
          });
        } else {
          await tx.product.update({ where: { id: update.productId }, data: { stockQuantity: qty } });
        }
      }
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "BULK_STOCK_UPDATE", details: `Bulk updated ${data.updates.length} products` },
    });

    return res.json({ message: "Stock updated successfully" });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to bulk update stock" });
  }
}

export async function getInventoryHistory(req: any, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { action: { in: ["INVENTORY_ADJUSTED", "BULK_STOCK_UPDATE", "STOCK_TRANSFERRED", "CYCLE_COUNT"] } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.auditLog.count({
        where: { action: { in: ["INVENTORY_ADJUSTED", "BULK_STOCK_UPDATE", "STOCK_TRANSFERRED", "CYCLE_COUNT"] } },
      }),
    ]);

    const data = logs.map((l) => ({
      id: l.id,
      productId: l.entityId || undefined,
      productName: l.details ? l.details.split(".")[0] : "System Update",
      type: l.action,
      reason: l.details || "",
      performedBy: l.user?.name || "System Administrator",
      createdAt: l.createdAt.toISOString(),
    }));

    return res.json({
      data,
      logs,
      pagination: { page, limit, pages: Math.ceil(total / limit) || 1, total }
    });
  } catch (err: any) {
    console.error("getInventoryHistory error:", err);
    return res.status(500).json({ message: "Failed to fetch inventory history" });
  }
}

export async function cycleCount(req: AuthenticatedRequest, res: Response) {
  try {
    const { branchId, counts, items } = req.body;
    const itemList = counts || items;
    if (!Array.isArray(itemList) || itemList.length === 0) {
      return res.status(400).json({ message: "Items or counts array required" });
    }

    const results: any[] = [];
    for (const item of itemList) {
      if (!item.productId) continue;
      const count = Number(item.countedQuantity ?? item.quantity ?? item.stockQuantity ?? 0);
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        const prev = product.stockQuantity;
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: count },
        });
        results.push({ productId: item.productId, before: prev, after: count });
      }
    }

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "CYCLE_COUNT", details: `Cycle count reconciled ${results.length} products` },
    });

    return res.json({ message: "Cycle count completed", discrepancies: results });
  } catch (err: any) {
    console.error("cycleCount error:", err);
    return res.status(500).json({ message: "Failed to perform cycle count" });
  }
}

export async function getInventoryForecast(req: any, res: Response) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const salesByProduct = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: { order: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } } },
    });

    const forecast = salesByProduct.map((s) => ({
      productId: s.productId,
      monthlySalesRate: (s._sum.quantity || 0) / 30,
      daysUntilStockout: 0,
    })).map((f) => ({
      ...f,
      daysUntilStockout: f.monthlySalesRate > 0 ? Math.round(30 / f.monthlySalesRate) : 999,
    }));

    return res.json(forecast);
  } catch {
    return res.status(500).json({ message: "Failed to generate forecast" });
  }
}
