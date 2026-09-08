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

export function buildOrderConfirmationEmail(
  orderNumber: string,
  totalAmount: number,
  items: { name: string; quantity: number; unitPrice: number; total: number }[],
  address: { fullAddress: string; city: string; state: string; country: string },
  options?: { shippingFee?: number; taxAmount?: number; dashboardUrl?: string; status?: string }
): { subject: string; html: string } {
  const frontendUrl = env.FRONTEND_URL || "https://jumaraldpharmacy.com";
  const dashboardUrl = options?.dashboardUrl || `${frontendUrl}/orders`;
  const shippingFee = options?.shippingFee || 0;
  const taxAmount = options?.taxAmount || 0;
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 13px;">${item.name}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 13px; text-align: right;">GHS ${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px; text-align: right; font-weight: 600;">GHS ${item.total.toFixed(2)}</td>
    </tr>
  `).join("");

  return {
    subject: `Order Confirmed — ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #059669;">
          <h1 style="color: #059669; font-size: 24px; margin: 0;">Jumarald Pharmacy</h1>
          <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">FDA Ghana & Pharmacy Council Certified</p>
        </div>

        <!-- Success Banner -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 36px; margin-bottom: 8px;">✅</div>
          <h2 style="color: #15803d; font-size: 20px; margin: 0 0 4px 0;">Order Confirmed!</h2>
          <p style="color: #166534; font-size: 13px; margin: 0;">Order <strong>${orderNumber}</strong> has been placed successfully</p>
        </div>

        <!-- Order Items -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #1e293b; font-size: 15px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 8px 12px; text-align: left; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase;">Item</th>
                <th style="padding: 8px 12px; text-align: center; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase;">Qty</th>
                <th style="padding: 8px 12px; text-align: right; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase;">Price</th>
                <th style="padding: 8px 12px; text-align: right; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
        </div>

        <!-- Pricing Breakdown -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 13px;">Subtotal</span>
            <span style="color: #334155; font-size: 13px;">GHS ${subtotal.toFixed(2)}</span>
          </div>
          ${shippingFee > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 13px;">Shipping</span>
            <span style="color: #334155; font-size: 13px;">GHS ${shippingFee.toFixed(2)}</span>
          </div>
          ` : `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 13px;">Shipping</span>
            <span style="color: #059669; font-size: 13px; font-weight: 600;">Free</span>
          </div>
          `}
          ${taxAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 13px;">Tax</span>
            <span style="color: #334155; font-size: 13px;">GHS ${taxAmount.toFixed(2)}</span>
          </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 2px solid #e2e8f0;">
            <span style="color: #1e293b; font-size: 15px; font-weight: bold;">Total</span>
            <span style="color: #059669; font-size: 18px; font-weight: bold;">GHS ${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <!-- Delivery Address -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #1e293b; font-size: 15px; margin: 0 0 10px 0;">Delivery Address</h3>
          <div style="background: #f8fafc; border-radius: 10px; padding: 14px 16px; border: 1px solid #e2e8f0;">
            <p style="color: #334155; font-size: 13px; margin: 0; line-height: 1.5;">
              ${address.fullAddress}<br/>
              ${address.city}, ${address.state}<br/>
              ${address.country}
            </p>
          </div>
        </div>

        <!-- Status -->
        ${options?.status ? `
        <div style="margin-bottom: 24px;">
          <div style="background: ${options.status === "PENDING" ? "#fffbeb" : "#f0fdf4"}; border: 1px solid ${options.status === "PENDING" ? "#fde68a" : "#bbf7d0"}; border-radius: 10px; padding: 12px 16px; text-align: center;">
            <span style="color: ${options.status === "PENDING" ? "#92400e" : "#15803d"}; font-size: 13px; font-weight: 600;">
              Order Status: ${options.status.replace("_", " ")}
            </span>
          </div>
        </div>
        ` : ""}

        <!-- CTA -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="${dashboardUrl}" style="background: #059669; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
            Track Your Order
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">
            Questions? Contact us at <a href="mailto:support@jumaraldpharmacy.com" style="color: #059669;">support@jumaraldpharmacy.com</a>
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            Jumarald Pharmacy — Your Trusted Online Pharmacy in Ghana
          </p>
        </div>
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

export function buildPaymentConfirmationEmail(
  orderNumber: string,
  amount: number,
  reference: string,
  method?: string
): { subject: string; html: string } {
  const methodLabel = method === "momo" ? "Mobile Money" : method === "card" ? "Bank Card" : "Paystack";
  return {
    subject: `Payment Received — ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #059669;">
          <h1 style="color: #059669; font-size: 24px; margin: 0;">Jumarald Pharmacy</h1>
          <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">FDA Ghana & Pharmacy Council Certified</p>
        </div>

        <!-- Payment Success Banner -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 42px; margin-bottom: 10px;">💰</div>
          <h2 style="color: #15803d; font-size: 20px; margin: 0 0 6px 0;">Payment Confirmed!</h2>
          <p style="color: #166534; font-size: 13px; margin: 0;">Your payment has been successfully processed</p>
        </div>

        <!-- Amount -->
        <div style="text-align: center; margin-bottom: 24px;">
          <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</p>
          <p style="color: #059669; font-size: 32px; font-weight: bold; margin: 0;">GHS ${amount.toFixed(2)}</p>
        </div>

        <!-- Details -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #64748b; font-size: 13px;">Order Number</span>
            <span style="color: #1e293b; font-size: 13px; font-weight: 600;">${orderNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #64748b; font-size: 13px;">Payment Method</span>
            <span style="color: #1e293b; font-size: 13px; font-weight: 600;">${methodLabel}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #64748b; font-size: 13px;">Transaction Reference</span>
            <span style="color: #1e293b; font-size: 12px; font-family: monospace;">${reference}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-size: 13px;">Date</span>
            <span style="color: #1e293b; font-size: 13px;">${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>

        <!-- What's Next -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
          <p style="color: #1e40af; font-size: 13px; font-weight: 600; margin: 0 0 6px 0;">What happens next?</p>
          <p style="color: #334155; font-size: 12px; margin: 0; line-height: 1.6;">
            Our pharmacy team is now preparing your order. You'll receive a notification when your order is dispatched for delivery.
          </p>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="${env.FRONTEND_URL || "https://jumaraldpharmacy.com"}/orders" style="background: #059669; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
            Track Your Order
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">
            Questions? Contact us at <a href="mailto:support@jumaraldpharmacy.com" style="color: #059669;">support@jumaraldpharmacy.com</a>
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            Jumarald Pharmacy — Your Trusted Online Pharmacy in Ghana
          </p>
        </div>
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
