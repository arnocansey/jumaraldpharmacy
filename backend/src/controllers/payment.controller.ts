import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";
import { env } from "../config/env";
import crypto from "crypto";
import { emitToUser, emitToOrder, emitToAdmins } from "../lib/socket";
import { createAuditLog } from "../lib/audit";

interface PaystackResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
    status?: string;
    amount?: number;
  };
}

export async function initializePayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId, email, amount, callback_url } = req.body;

    if (!orderId || !email || !amount) {
      return res.status(400).json({ message: "orderId, email, and amount are required" });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId !== req.user!.id) return res.status(403).json({ message: "Unauthorized" });

    const reference = `JUM-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    if (!env.PAYSTACK_SECRET_KEY) {
      const payment = await prisma.payment.create({
        data: {
          orderId,
          provider: "paystack",
          reference,
          amount,
          status: "COMPLETED",
          paymentMethod: "test",
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PROCESSING" },
      });

      return res.json({
        status: "success",
        message: "Test payment completed",
        data: { reference, paymentId: payment.id },
      });
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        reference,
        callback_url: callback_url || `${env.FRONTEND_URL}/checkout?payment=success`,
        metadata: { orderId, userId: req.user!.id },
      }),
    });

    const data = (await response.json()) as PaystackResponse;

    if (!data.status) {
      return res.status(400).json({ message: data.message || "Payment initialization failed" });
    }

    await prisma.payment.create({
      data: {
        orderId,
        provider: "paystack",
        reference,
        amount,
        status: "PENDING",
        paymentMethod: req.body.method || "card",
      },
    });

    return res.json({
      status: "success",
      authorization_url: data.data?.authorization_url,
      access_code: data.data?.access_code,
      reference,
    });
  } catch (error: any) {
    return res.status(500).json({ message: "Payment initialization failed" });
  }
}

export async function verifyPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { reference } = req.params;

    if (!env.PAYSTACK_SECRET_KEY) {
      const payment = await prisma.payment.findUnique({ where: { reference } });
      if (!payment) return res.status(404).json({ message: "Payment not found" });

      return res.json({
        status: "success",
        data: {
          status: "success",
          reference: payment.reference,
          amount: payment.amount,
        },
      });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
    });

    const result = (await response.json()) as PaystackResponse;

    if (!result.status) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const paymentStatus = result.data?.status === "success" ? "COMPLETED" : "FAILED";

    const payment = await prisma.payment.findFirst({ where: { reference } });
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: paymentStatus as any },
      });

      if (paymentStatus === "COMPLETED") {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "PROCESSING" },
        });
        emitToOrder(payment.orderId, "payment:completed", { orderId: payment.orderId, reference, amount: payment.amount });
        emitToAdmins("order:payment", { orderId: payment.orderId, reference, amount: payment.amount });
        createAuditLog(req.user!.id, "PAYMENT_COMPLETED", "payment", payment.id, { reference, amount: payment.amount });
      }
    }

    return res.json({
      status: "success",
      data: {
        status: result.data?.status,
        reference: result.data?.reference,
        amount: (result.data?.amount || 0) / 100,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: "Payment verification failed" });
  }
}

export async function handlePaystackWebhook(req: any, res: Response) {
  try {
    const body = req.body;
    const event = body.event;

    if (event === "charge.success") {
      const { reference } = body.data;
      const payment = await prisma.payment.findFirst({ where: { reference } });
      if (payment && payment.status === "PENDING") {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: "COMPLETED" } });
        await prisma.order.update({ where: { id: payment.orderId }, data: { status: "PROCESSING" } });
        emitToOrder(payment.orderId, "payment:completed", { orderId: payment.orderId, reference, amount: payment.amount });
        emitToAdmins("order:payment", { orderId: payment.orderId, reference, amount: payment.amount });
      }
    }

    return res.json({ received: true });
  } catch {
    return res.status(500).json({ message: "Webhook processing failed" });
  }
}
