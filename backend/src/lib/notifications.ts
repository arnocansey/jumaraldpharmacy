import nodemailer from "nodemailer";
import { env } from "../config/env";

const port = Number(env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || "smtp.gmail.com",
  port: port,
  secure: port === 465, // true for 465, false for 587 or others
  auth: env.SMTP_USER && env.SMTP_PASS ? {
    user: env.SMTP_USER.trim(),
    pass: env.SMTP_PASS.trim(),
  } : undefined,
  tls: {
    rejectUnauthorized: false, // Prevents self-signed cert issues on shared hosts
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const mailerUrl = env.MAILER_SERVICE_URL || process.env.MAILER_SERVICE_URL;
  const mailerApiKey = env.MAILER_API_KEY || process.env.MAILER_API_KEY;

  if (mailerUrl) {
    try {
      console.log(`[EMAIL DISPATCH] Forwarding email to Vercel Mailer microservice: ${mailerUrl}`);
      const response = await fetch(mailerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": mailerApiKey || "",
        },
        body: JSON.stringify({ to, subject, html }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[EMAIL MICROSERVICE ERROR] HTTP ${response.status}: ${errText}`);
      } else {
        const data = await response.json();
        console.log(`[EMAIL MICROSERVICE SUCCESS] Sent to ${to}. Response:`, data);
        return true;
      }
    } catch (err: any) {
      console.error(`[EMAIL MICROSERVICE FETCH ERROR] Failed to connect to Vercel mailer microservice:`, err.message || err);
    }
  }

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.log(`[EMAIL DEV MOCK] Would send to ${to}: "${subject}"`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM || `"Jumarald Pharmacy" <${env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL SUCCESS] Sent to ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message || error);
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
            <a href="${resetUrl}" style="background: #059669; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
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

export function buildPrescriptionVerifiedEmail(status: string, pharmacistNote?: string, dashboardUrl: string = "http://localhost:3000/dashboard"): { subject: string; html: string } {
  const isApproved = status === "APPROVED";
  return {
    subject: `Prescription ${status.replace("_", " ")} — Jumarald Pharmacy`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #059669; font-size: 22px; margin: 0;">Jumarald Pharmacy</h1>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px;">FDA Ghana & Pharmacy Council Certified</p>
        </div>
        <div style="background: ${isApproved ? "#f0fdf4" : "#fef2f2"}; border: 1px solid ${isApproved ? "#bbf7d0" : "#fecaca"}; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <h2 style="color: ${isApproved ? "#15803d" : "#b91c1c"}; font-size: 18px; margin: 0 0 8px 0;">Prescription ${status.replace("_", " ")}</h2>
          <p style="color: #334155; font-size: 14px; margin: 0; line-height: 1.5;">
            Your uploaded prescription has been reviewed and verified by our Superintendent Pharmacist.
          </p>
        </div>
        ${pharmacistNote ? `
          <div style="background: #f8fafc; border-left: 4px solid #059669; padding: 14px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #0f172a; font-size: 13px; font-weight: bold; margin: 0 0 4px 0;">Pharmacist Directives / Notes:</p>
            <p style="color: #475569; font-size: 13px; margin: 0; line-height: 1.5;">${pharmacistNote}</p>
          </div>
        ` : ""}
        ${isApproved ? `
          <div style="text-align: center; margin: 24px 0;">
            <a href="${dashboardUrl}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">
              View Prescribed Medicines & Checkout
            </a>
          </div>
        ` : `
          <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 16px;">
            Please log in to your account to review pharmacist feedback or re-upload a clear prescription.
          </p>
        `}
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
