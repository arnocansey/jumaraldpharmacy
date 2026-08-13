import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { RoleName } from "@prisma/client";
import { createAuditLog } from "../lib/audit";
import { sendEmail } from "../lib/notifications";

const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.nativeEnum(RoleName).optional().default(RoleName.CUSTOMER),
});

const updateRoleSchema = z.object({
  role: z.nativeEnum(RoleName),
});

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const query = userQuerySchema.parse(req.query);
    const { search, role, page, limit } = query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role && Object.values(RoleName).includes(role as RoleName)) {
      where.role = role as RoleName;
    }

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              prescriptions: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to fetch users" });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (req.user?.id) {
      await createAuditLog(
        req.user.id,
        "USER_CREATED",
        "User",
        user.id,
        { createdUserEmail: user.email, role: user.role },
        req.ip
      );
    }

    // Dispatch welcome email with credentials if role is staff/admin
    if (data.role !== RoleName.CUSTOMER && data.role !== RoleName.PATIENT) {
      sendEmail({
        to: user.email,
        subject: "Welcome to Jumarald Pharmacy Staff Portal",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #059669;">Welcome to Jumarald Pharmacy</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>An account has been created for you with the role <strong>${user.role}</strong>.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>Email:</strong> ${user.email}</p>
              <p style="margin: 5px 0 0 0;"><strong>Temporary Password:</strong> ${data.password}</p>
            </div>
            <p>Please log in and update your password immediately.</p>
          </div>
        `,
      }).catch((e) => console.error("Staff welcome email failed:", e));
    }

    return res.status(201).json(user);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to create user" });
  }
}

export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role } = updateRoleSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    if (req.user?.id) {
      await createAuditLog(
        req.user.id,
        "ROLE_UPDATED",
        "User",
        user.id,
        { previousRole: user.role, newRole: role, userEmail: user.email },
        req.ip
      );
    }

    return res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid role specified", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to update user role" });
  }
}

export async function toggleUserStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user?.id === user.id) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (req.user?.id) {
      await createAuditLog(
        req.user.id,
        "USER_STATUS_TOGGLED",
        "User",
        user.id,
        { isActive: updated.isActive, userEmail: user.email },
        req.ip
      );
    }

    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "Failed to update user status" });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.role === RoleName.SUPER_ADMIN || targetUser.role === RoleName.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: { in: [RoleName.SUPER_ADMIN, RoleName.ADMIN] } },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot delete the sole admin account" });
      }
    }

    await prisma.user.delete({ where: { id } });

    if (req.user?.id) {
      await createAuditLog(
        req.user.id,
        "USER_DELETED",
        "User",
        id,
        { deletedUserEmail: targetUser.email, role: targetUser.role },
        req.ip
      );
    }

    return res.json({ message: "User deleted successfully" });
  } catch {
    return res.status(500).json({ message: "Failed to delete user" });
  }
}
