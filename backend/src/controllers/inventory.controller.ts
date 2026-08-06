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
  updates: z.array(z.object({
    productId: z.string(),
    branchId: z.string().optional(),
    quantity: z.number().int().min(0),
  })).min(1),
});

export async function getInventoryReport(req: any, res: Response) {
  try {
    const branchId = req.query.branchId as string | undefined;
    const lowStock = req.query.lowStock === "true";

    const where: any = {};
    if (branchId) where.branchId = branchId;

    const inventory = await prisma.branchInventory.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, price: true, images: true, minStockAlert: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { quantity: "asc" },
    });

    const filtered = lowStock ? inventory.filter((i) => i.quantity <= i.product.minStockAlert) : inventory;

    const totalProducts = inventory.length;
    const totalStock = inventory.reduce((sum, i) => sum + i.quantity, 0);
    const lowStockCount = inventory.filter((i) => i.quantity <= i.product.minStockAlert).length;
    const totalValue = inventory.reduce((sum, i) => sum + i.quantity * i.product.price, 0);

    return res.json({ inventory: filtered, summary: { totalProducts, totalStock, lowStockCount, totalValue } });
  } catch {
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
        product: { select: { id: true, name: true, sku: true, images: true } },
        branch: { select: { name: true } },
      },
      orderBy: { expiryDate: "asc" },
    });

    return res.json(batches);
  } catch {
    return res.status(500).json({ message: "Failed to fetch expiring products" });
  }
}

export async function getExpiredProducts(req: any, res: Response) {
  try {
    const batches = await prisma.batchExpiry.findMany({
      where: { expiryDate: { lt: new Date() } },
      include: {
        product: { select: { id: true, name: true, sku: true, images: true } },
        branch: { select: { name: true } },
      },
      orderBy: { expiryDate: "asc" },
    });
    return res.json(batches);
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
        details: `Adjustment: ${data.adjustment > 0 ? "+" : ""}${data.adjustment}. Reason: ${data.reason}`,
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
    const lowStockProducts = await prisma.product.findMany({
      where: { isActive: true, stockQuantity: { lte: prisma.product.fields?.minStockAlert || 10 } },
      select: { id: true, name: true, sku: true, stockQuantity: true, minStockAlert: true, images: true, price: true },
      orderBy: { stockQuantity: "asc" },
    });

    const outOfStock = lowStockProducts.filter((p) => p.stockQuantity === 0);
    const lowStock = lowStockProducts.filter((p) => p.stockQuantity > 0);

    const expiringIn30 = await prisma.batchExpiry.findMany({
      where: {
        expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
      include: { product: { select: { name: true, sku: true } } },
    });

    return res.json({ outOfStock, lowStock, expiringIn30 });
  } catch {
    return res.status(500).json({ message: "Failed to fetch stock alerts" });
  }
}

export async function bulkUpdateStock(req: AuthenticatedRequest, res: Response) {
  try {
    const data = bulkUpdateSchema.parse(req.body);

    await prisma.$transaction(async (tx) => {
      for (const update of data.updates) {
        if (update.branchId) {
          await tx.branchInventory.upsert({
            where: { branchId_productId: { branchId: update.branchId, productId: update.productId } },
            update: { quantity: update.quantity, lastRestockedAt: new Date() },
            create: { branchId: update.branchId, productId: update.productId, quantity: update.quantity },
          });
        } else {
          await tx.product.update({ where: { id: update.productId }, data: { stockQuantity: update.quantity } });
        }
      }
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "BULK_STOCK_UPDATE", details: `Updated ${data.updates.length} products` },
    });

    return res.json({ message: "Stock updated successfully" });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to bulk update stock" });
  }
}

export async function getInventoryHistory(req: any, res: Response) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: { in: ["INVENTORY_ADJUSTED", "BULK_STOCK_UPDATE", "STOCK_TRANSFERRED"] } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json(logs);
  } catch {
    return res.status(500).json({ message: "Failed to fetch inventory history" });
  }
}

export async function cycleCount(req: AuthenticatedRequest, res: Response) {
  try {
    const { branchId, counts } = req.body;
    if (!branchId || !Array.isArray(counts)) {
      return res.status(400).json({ message: "branchId and counts array required" });
    }

    const results: any[] = [];
    for (const item of counts) {
      const inv = await prisma.branchInventory.findUnique({
        where: { branchId_productId: { branchId, productId: item.productId } },
      });
      if (inv && inv.quantity !== item.countedQuantity) {
        await prisma.branchInventory.update({
          where: { id: inv.id },
          data: { quantity: item.countedQuantity },
        });
        results.push({ productId: item.productId, before: inv.quantity, after: item.countedQuantity });
      }
    }

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "CYCLE_COUNT", details: `Cycle count on branch ${branchId}: ${results.length} discrepancies` },
    });

    return res.json({ message: "Cycle count completed", discrepancies: results });
  } catch {
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
