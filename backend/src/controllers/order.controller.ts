import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { sendEmail, buildOrderConfirmationEmail, buildLowStockAlertEmail } from "../lib/notifications";
import { emitToAdmins, emitToUser } from "../lib/socket";
import { sendOrderConfirmationSms } from "../lib/sms";
import { createAuditLog } from "../lib/audit";

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1),
  address: z.object({
    fullAddress: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().optional().default(""),
    country: z.string().default("Ghana"),
  }),
  prescriptionId: z.string().nullable().optional(),
  totalAmount: z.number().positive(),
  shippingFee: z.number().min(0).optional().default(0),
  taxAmount: z.number().min(0).optional().default(0),
});

const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export async function createOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createOrderSchema.parse(req.body);
    const orderNumber = `JUM-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, requested: ${item.quantity}`,
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      const newAddress = await tx.address.create({
        data: {
          userId: req.user!.id,
          fullAddress: data.address.fullAddress,
          city: data.address.city,
          state: data.address.state,
          postalCode: data.address.postalCode,
          country: data.address.country,
        },
      });

      return tx.order.create({
        data: {
          orderNumber, userId: req.user!.id, addressId: newAddress.id,
          prescriptionId: data.prescriptionId || null,
          totalAmount: data.totalAmount, shippingFee: data.shippingFee, taxAmount: data.taxAmount,
          status: data.prescriptionId ? OrderStatus.PRESCRIPTION_CHECK : OrderStatus.PENDING,
          orderItems: { create: data.items.map((item) => ({
            productId: item.productId, quantity: item.quantity,
            unitPrice: item.price, total: item.price * item.quantity,
          })) },
        },
        include: { orderItems: { include: { product: true } }, user: { select: { email: true, name: true } } },
      });
    });

    const emailContent = buildOrderConfirmationEmail(orderNumber, data.totalAmount);
    sendEmail({ to: result.user.email, subject: emailContent.subject, html: emailContent.html }).catch(() => {});

    for (const item of result.orderItems) {
      const product = productMap.get(item.productId);
      if (product && product.stockQuantity <= product.minStockAlert) {
        const alert = buildLowStockAlertEmail(product.name, product.stockQuantity);
        sendEmail({ to: "admin@jumaraldpharmacy.com", subject: alert.subject, html: alert.html }).catch(() => {});
      }
    }

    emitToAdmins("order:created", { orderId: result.id, orderNumber: result.orderNumber, totalAmount: result.totalAmount });
    createAuditLog(req.user!.id, "ORDER_CREATED", "order", result.id, { orderNumber, totalAmount: data.totalAmount });

    const userWithPhone = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { phone: true } });
    if (userWithPhone?.phone) {
      sendOrderConfirmationSms(userWithPhone.phone, orderNumber, data.totalAmount);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(400).json({ message: error.message || "Order creation failed" });
  }
}

export async function getMyOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { orderItems: { include: { product: true } }, shippingAddress: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(orders);
  } catch {
    return res.status(500).json({ message: "Failed to fetch user orders" });
  }
}

export async function getAllOrders(req: any, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      include: { user: { select: { name: true, email: true } }, orderItems: true, shippingAddress: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(orders);
  } catch {
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
}

export async function updateOrderStatus(req: any, res: Response) {
  try {
    const data = updateOrderStatusSchema.parse(req.body);
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: data.status },
    });

    emitToUser(order.userId, "order:status", { orderId: order.id, orderNumber: order.orderNumber, status: data.status });
    emitToAdmins("order:status-update", { orderId: order.id, orderNumber: order.orderNumber, status: data.status });
    createAuditLog(req.user!.id, "ORDER_STATUS_UPDATED", "order", order.id, { status: data.status });

    return res.json(order);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid status value", errors: error.errors });
    }
    return res.status(400).json({ message: "Failed to update order status" });
  }
}
