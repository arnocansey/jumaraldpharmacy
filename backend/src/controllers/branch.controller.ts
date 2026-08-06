import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";

const createBranchSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().default("Ghana"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  isWarehouse: z.boolean().optional().default(false),
  deliveryRadius: z.number().min(0).optional().default(10),
  operatingHours: z.any().optional(),
  holidaySchedule: z.any().optional(),
});

const updateBranchSchema = createBranchSchema.partial();

const transferStockSchema = z.object({
  toBranchId: z.string(),
  productId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

const updateInventorySchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(0),
  minStockAlert: z.number().int().min(0).optional(),
});

const addStaffSchema = z.object({
  userId: z.string(),
  position: z.string().optional(),
});

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function createBranch(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createBranchSchema.parse(req.body);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    const code = data.name.substring(0, 3).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);

    const existing = await prisma.branch.findFirst({
      where: { OR: [{ slug }, { name: { equals: data.name, mode: "insensitive" } }] },
    });
    if (existing) return res.status(400).json({ message: "Branch with this name already exists" });

    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        slug,
        code,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        email: data.email,
        isWarehouse: data.isWarehouse,
        deliveryRadius: data.deliveryRadius,
        operatingHours: data.operatingHours,
        holidaySchedule: data.holidaySchedule,
      },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "BRANCH_CREATED", entity: "Branch", entityId: branch.id, details: `Created branch: ${branch.name}` },
    });

    return res.status(201).json(branch);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to create branch" });
  }
}

export async function updateBranch(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Branch not found" });

    const data = updateBranchSchema.parse(req.body);
    const branch = await prisma.branch.update({ where: { id }, data });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "BRANCH_UPDATED", entity: "Branch", entityId: id, details: `Updated branch: ${branch.name}` },
    });

    return res.json(branch);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to update branch" });
  }
}

export async function deleteBranch(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Branch not found" });

    await prisma.branch.update({ where: { id }, data: { isActive: false } });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "BRANCH_DEACTIVATED", entity: "Branch", entityId: id },
    });

    return res.json({ message: "Branch deactivated" });
  } catch {
    return res.status(500).json({ message: "Failed to delete branch" });
  }
}

export async function getAllBranches(req: any, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;

    const where: any = {};
    if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { city: { contains: search, mode: "insensitive" } }];
    if (isActive !== undefined) where.isActive = isActive;

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        include: { _count: { select: { staff: true, inventory: true, orders: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.branch.count({ where }),
    ]);

    return res.json({ branches, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ message: "Failed to fetch branches" });
  }
}

export async function getBranchById(req: any, res: Response) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.id },
      include: {
        staff: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        _count: { select: { inventory: true, orders: true } },
      },
    });
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    return res.json(branch);
  } catch {
    return res.status(500).json({ message: "Failed to fetch branch" });
  }
}

export async function getNearbyBranches(req: any, res: Response) {
  try {
    const { latitude, longitude, radius } = req.query;
    if (!latitude || !longitude) return res.status(400).json({ message: "latitude and longitude are required" });

    const lat = Number(latitude);
    const lng = Number(longitude);
    const maxRadius = Number(radius) || 20;

    const branches = await prisma.branch.findMany({ where: { isActive: true, latitude: { not: null }, longitude: { not: null } } });

    const nearby = branches
      .map((b) => ({
        ...b,
        distance: haversineDistance(lat, lng, b.latitude!, b.longitude!),
      }))
      .filter((b) => b.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance);

    return res.json(nearby);
  } catch {
    return res.status(500).json({ message: "Failed to find nearby branches" });
  }
}

export async function transferStock(req: AuthenticatedRequest, res: Response) {
  try {
    const data = transferStockSchema.parse(req.body);

    if (data.toBranchId === req.params.id) {
      return res.status(400).json({ message: "Cannot transfer to the same branch" });
    }

    const [fromBranch, toBranch, product] = await Promise.all([
      prisma.branch.findUnique({ where: { id: req.params.id } }),
      prisma.branch.findUnique({ where: { id: data.toBranchId } }),
      prisma.product.findUnique({ where: { id: data.productId } }),
    ]);

    if (!fromBranch || !toBranch) return res.status(404).json({ message: "Branch not found" });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const fromInventory = await prisma.branchInventory.findUnique({
      where: { branchId_productId: { branchId: req.params.id, productId: data.productId } },
    });

    if (!fromInventory || fromInventory.quantity < data.quantity) {
      return res.status(400).json({ message: `Insufficient stock. Available: ${fromInventory?.quantity || 0}` });
    }

    const transfer = await prisma.$transaction(async (tx) => {
      await tx.branchInventory.update({
        where: { branchId_productId: { branchId: req.params.id, productId: data.productId } },
        data: { quantity: { decrement: data.quantity } },
      });

      await tx.branchInventory.upsert({
        where: { branchId_productId: { branchId: data.toBranchId, productId: data.productId } },
        update: { quantity: { increment: data.quantity } },
        create: { branchId: data.toBranchId, productId: data.productId, quantity: data.quantity },
      });

      return tx.stockTransfer.create({
        data: {
          fromBranchId: req.params.id,
          toBranchId: data.toBranchId,
          productId: data.productId,
          quantity: data.quantity,
          notes: data.notes,
          requestedBy: req.user!.id,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "STOCK_TRANSFERRED", entity: "StockTransfer", entityId: transfer.id, details: `${data.quantity} units from ${fromBranch.name} to ${toBranch.name}` },
    });

    return res.status(201).json(transfer);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to transfer stock" });
  }
}

export async function getBranchInventory(req: any, res: Response) {
  try {
    const inventory = await prisma.branchInventory.findMany({
      where: { branchId: req.params.id },
      include: { product: { select: { id: true, name: true, sku: true, price: true, images: true } } },
      orderBy: { quantity: "asc" },
    });
    return res.json(inventory);
  } catch {
    return res.status(500).json({ message: "Failed to fetch branch inventory" });
  }
}

export async function updateBranchInventory(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateInventorySchema.parse(req.body);

    const updated = await prisma.branchInventory.upsert({
      where: { branchId_productId: { branchId: req.params.id, productId: data.productId } },
      update: { quantity: data.quantity, minStockAlert: data.minStockAlert, lastRestockedAt: new Date() },
      create: { branchId: req.params.id, productId: data.productId, quantity: data.quantity, minStockAlert: data.minStockAlert || 5 },
      include: { product: { select: { name: true } } },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "BRANCH_INVENTORY_UPDATED", entity: "BranchInventory", entityId: updated.id, details: `Updated stock for ${updated.product.name}` },
    });

    return res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to update inventory" });
  }
}

export async function getBranchAnalytics(req: any, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await prisma.branchAnalytics.findMany({
      where: { branchId: req.params.id, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    });

    const totals = analytics.reduce(
      (acc, a) => ({ revenue: acc.revenue + a.revenue, orders: acc.orders + a.orders, itemsSold: acc.itemsSold + a.itemsSold }),
      { revenue: 0, orders: 0, itemsSold: 0 }
    );

    return res.json({ analytics, totals });
  } catch {
    return res.status(500).json({ message: "Failed to fetch branch analytics" });
  }
}

export async function getBranchStaff(req: any, res: Response) {
  try {
    const staff = await prisma.branchStaff.findMany({
      where: { branchId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } } },
    });
    return res.json(staff);
  } catch {
    return res.status(500).json({ message: "Failed to fetch branch staff" });
  }
}

export async function addBranchStaff(req: AuthenticatedRequest, res: Response) {
  try {
    const data = addStaffSchema.parse(req.body);
    const existing = await prisma.branchStaff.findUnique({ where: { userId: data.userId } });
    if (existing) return res.status(400).json({ message: "User is already assigned to a branch" });

    const staff = await prisma.branchStaff.create({
      data: { userId: data.userId, branchId: req.params.id, position: data.position },
      include: { user: { select: { name: true, email: true } } },
    });

    return res.status(201).json(staff);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to add staff" });
  }
}

export async function removeBranchStaff(req: AuthenticatedRequest, res: Response) {
  try {
    await prisma.branchStaff.deleteMany({ where: { branchId: req.params.id, userId: req.params.userId } });
    return res.json({ message: "Staff removed" });
  } catch {
    return res.status(500).json({ message: "Failed to remove staff" });
  }
}
