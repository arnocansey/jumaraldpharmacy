import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || "smtp.gmail.com",
  port: Number(env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!env.SMTP_USER) {
    console.log(`[EMAIL] Would send to ${to}: ${subject}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

export function buildPasswordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: "Reset Your Jumarald Pharmacy Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #059669; font-size: 24px; margin: 0;">Jumarald Pharmacy</h1>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background: #059669; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Reset Password
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            This link expires in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
          Jumarald Pharmacy — FDA Ghana & Pharmacy Council Certified
        </p>
      </div>
    `,
  };
}

export function buildOrderConfirmationEmail(orderNumber: string, totalAmount: number): { subject: string; html: string } {
  return {
    subject: `Order Confirmed — ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669; font-size: 22px;">Order Confirmed!</h1>
        <p style="color: #475569; font-size: 14px;">Your order <strong>${orderNumber}</strong> has been placed successfully.</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
          <p style="color: #166534; font-size: 20px; font-weight: bold; margin: 0;">GHS ${totalAmount.toFixed(2)}</p>
          <p style="color: #16a34a; font-size: 12px; margin: 4px 0 0 0;">Total Amount</p>
        </div>
        <p style="color: #475569; font-size: 13px;">We'll notify you when your order ships. Track your order in the Jumarald app.</p>
      </div>
    `,
  };
}

export function buildPrescriptionVerifiedEmail(status: string, pharmacistNote?: string): { subject: string; html: string } {
  return {
    subject: `Prescription ${status} — Jumarald Pharmacy`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669; font-size: 20px;">Prescription ${status.replace("_", " ")}</h1>
        <p style="color: #475569; font-size: 14px;">Your prescription has been reviewed by our pharmacist.</p>
        ${pharmacistNote ? `<p style="color: #1e293b; background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px;"><strong>Pharmacist Note:</strong> ${pharmacistNote}</p>` : ""}
        <p style="color: #475569; font-size: 13px; margin-top: 16px;">${status === "APPROVED" ? "You can now proceed to order your prescribed medications." : "Please upload a clearer prescription or contact support."}</p>
      </div>
    `,
  };
}

export function buildLowStockAlertEmail(product: string, quantity: number): { subject: string; html: string } {
  return {
    subject: `Low Stock Alert — ${product}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706; font-size: 20px;">Low Stock Warning</h1>
        <p style="color: #475569; font-size: 14px;"><strong>${product}</strong> has only <strong>${quantity}</strong> units remaining.</p>
        <p style="color: #475569; font-size: 13px;">Please restock to avoid running out.</p>
      </div>
    `,
  };
}
