import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";
import crypto from "crypto";

const createDeliverySchema = z.object({
  orderId: z.string(),
  branchId: z.string().optional(),
  estimatedTime: z.string().datetime().optional(),
});

const updateStatusSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const assignDriverSchema = z.object({
  driverId: z.string(),
});

function generateTrackingNumber(): string {
  return "TRK-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createDelivery(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createDeliverySchema.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const existing = await prisma.deliveryTracking.findUnique({ where: { orderId: data.orderId } });
    if (existing) return res.status(400).json({ message: "Delivery already exists for this order" });

    const delivery = await prisma.$transaction(async (tx) => {
      const d = await tx.deliveryTracking.create({
        data: {
          orderId: data.orderId,
          branchId: data.branchId || order.branchId,
          trackingNumber: generateTrackingNumber(),
          status: "PREPARING",
          otpCode: generateOtp(),
          estimatedTime: data.estimatedTime ? new Date(data.estimatedTime) : null,
        },
      });

      await tx.deliveryStatusLog.create({
        data: { deliveryTrackingId: d.id, status: "PREPARING", notes: "Delivery created" },
      });

      return d;
    });

    return res.status(201).json(delivery);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to create delivery" });
  }
}

export async function updateDeliveryStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateStatusSchema.parse(req.body);
    const { id } = req.params;

    const delivery = await prisma.deliveryTracking.findUnique({ where: { id } });
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.deliveryStatusLog.create({
        data: {
          deliveryTrackingId: id,
          status: data.status as any,
          notes: data.notes,
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });

      return tx.deliveryTracking.update({
        where: { id },
        data: {
          status: data.status as any,
          currentLat: data.latitude || delivery.currentLat,
          currentLng: data.longitude || delivery.currentLng,
          actualDelivery: data.status === "DELIVERED" ? new Date() : undefined,
        },
      });
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: "DELIVERY_STATUS_UPDATED", entity: "DeliveryTracking", entityId: id, details: `Status: ${data.status}` },
    });

    return res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to update delivery status" });
  }
}

export async function assignDriver(req: AuthenticatedRequest, res: Response) {
  try {
    const data = assignDriverSchema.parse(req.body);
    const { id } = req.params;

    const driver = await prisma.user.findUnique({ where: { id: data.driverId } });
    if (!driver || driver.role !== "DELIVERY_DRIVER") {
      return res.status(400).json({ message: "Invalid driver" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.deliveryTracking.update({
        where: { id },
        data: { driverId: data.driverId, assignedById: req.user!.id, status: "ASSIGNED" },
      });

      await tx.deliveryStatusLog.create({
        data: { deliveryTrackingId: id, status: "ASSIGNED", notes: `Assigned to ${driver.name}` },
      });

      return d;
    });

    return res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", errors: error.errors });
    return res.status(500).json({ message: "Failed to assign driver" });
  }
}

export async function getDeliveryTracking(req: any, res: Response) {
  try {
    const { trackingNumber } = req.params;
    const delivery = await prisma.deliveryTracking.findUnique({
      where: { trackingNumber },
      include: {
        order: { select: { orderNumber: true, totalAmount: true, status: true } },
        driver: { select: { name: true, phone: true } },
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!delivery) return res.status(404).json({ message: "Tracking not found" });
    return res.json(delivery);
  } catch {
    return res.status(500).json({ message: "Failed to fetch tracking" });
  }
}

export async function getMyDeliveries(req: AuthenticatedRequest, res: Response) {
  try {
    const deliveries = await prisma.deliveryTracking.findMany({
      where: { driverId: req.user!.id },
      include: {
        order: { select: { orderNumber: true, totalAmount: true } },
        branch: { select: { name: true, address: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(deliveries);
  } catch {
    return res.status(500).json({ message: "Failed to fetch deliveries" });
  }
}

export async function getDeliveryStats(req: any, res: Response) {
  try {
    const [total, active, completed, failed] = await Promise.all([
      prisma.deliveryTracking.count(),
      prisma.deliveryTracking.count({ where: { status: { in: ["PREPARING", "PACKED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "NEARBY"] } } }),
      prisma.deliveryTracking.count({ where: { status: "DELIVERED" } }),
      prisma.deliveryTracking.count({ where: { status: "FAILED" } }),
    ]);

    const recentDeliveries = await prisma.deliveryTracking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { order: { select: { orderNumber: true } }, driver: { select: { name: true } } },
    });

    return res.json({ total, active, completed, failed, recentDeliveries });
  } catch {
    return res.status(500).json({ message: "Failed to fetch delivery stats" });
  }
}

export async function updateDriverLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ message: "latitude and longitude required" });

    await prisma.deliveryTracking.updateMany({
      where: { driverId: req.user!.id, status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "NEARBY"] } },
      data: { currentLat: latitude, currentLng: longitude },
    });

    return res.json({ message: "Location updated" });
  } catch {
    return res.status(500).json({ message: "Failed to update location" });
  }
}

export async function verifyDeliveryOtp(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const delivery = await prisma.deliveryTracking.findUnique({ where: { id } });
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });
    if (delivery.otpCode !== otp) return res.status(400).json({ message: "Invalid OTP" });

    return res.json({ verified: true });
  } catch {
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
}

export async function confirmDelivery(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { proofOfDelivery, notes } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.deliveryTracking.update({
        where: { id },
        data: { status: "DELIVERED", proofOfDelivery, deliveryNotes: notes, actualDelivery: new Date() },
      });

      await tx.deliveryStatusLog.create({
        data: { deliveryTrackingId: id, status: "DELIVERED", notes: notes || "Delivery confirmed" },
      });

      await tx.order.update({ where: { id: d.orderId }, data: { status: "DELIVERED" } });

      return d;
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "Failed to confirm delivery" });
  }
}

export async function getDeliveryHistory(req: any, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;

    const where: any = {};
    if (status) where.status = status;

    const [deliveries, total] = await Promise.all([
      prisma.deliveryTracking.findMany({
        where,
        include: { order: { select: { orderNumber: true } }, driver: { select: { name: true } }, branch: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.deliveryTracking.count({ where }),
    ]);

    return res.json({ deliveries, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ message: "Failed to fetch delivery history" });
  }
}
