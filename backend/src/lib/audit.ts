import { prisma } from "./prisma";
import crypto from "crypto";

export async function createAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details?: any,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, limit = 50, userId, action, entity, startDate, endDate } = params;
  const where: any = {};
  if (userId) where.userId = userId;
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (entity) where.entity = { contains: entity, mode: "insensitive" };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pages: Math.ceil(total / limit) };
}
