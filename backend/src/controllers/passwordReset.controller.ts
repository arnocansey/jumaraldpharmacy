import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { sendEmail, buildPasswordResetEmail } from "../lib/notifications";
import { z } from "zod";
import { Response } from "express";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function forgotPassword(req: any, res: Response) {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      return res.json({ message: "If an account exists with that email, a reset link has been sent." });
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const email = buildPasswordResetEmail(resetUrl);
    await sendEmail({ to: user.email, subject: email.subject, html: email.html });

    return res.json({ message: "If an account exists with that email, a reset link has been sent." });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Failed to process request" });
  }
}

export async function resetPassword(req: any, res: Response) {
  try {
    const data = resetPasswordSchema.parse(req.body);

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { token: data.token, used: false, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return res.json({ message: "Password reset successful. You can now sign in." });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    return res.status(500).json({ message: "Password reset failed" });
  }
}
