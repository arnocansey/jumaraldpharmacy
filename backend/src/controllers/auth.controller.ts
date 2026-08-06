import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { RoleName } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";
import { Response } from "express";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: any, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: RoleName.CUSTOMER,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({ user, token });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(400).json({ message: "Registration failed" });
  }
}

export async function login(req: any, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(400).json({ message: "Login failed" });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, createdAt: true },
  });
  return res.json(user);
}
