import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().optional(),
  from: z.string().optional(),
});

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Jumarald Mailer Microservice",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. API Key Authentication Check
    const apiKeyHeader = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedKey = process.env.MAILER_API_KEY;

    if (expectedKey && apiKeyHeader !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing x-api-key header" },
        { status: 401 }
      );
    }

    // 2. Parse & Validate Payload
    const body = await req.json();
    const parsed = sendEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { to, subject, html, text, from } = parsed.data;

    // 3. SMTP Transporter Configuration
    const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT?.trim() || "587", 10);
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const defaultFrom = process.env.SMTP_FROM?.trim() || smtpUser || "Jumarald Pharmacy <noreply@jumaraldpharmacy.com>";

    if (!smtpUser || !smtpPass) {
      console.error("[Mailer Microservice] Missing SMTP_USER or SMTP_PASS environment variables");
      return NextResponse.json(
        { success: false, error: "Server SMTP configuration missing" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // 4. Send Email
    const info = await transporter.sendMail({
      from: from || defaultFrom,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ""),
    });

    console.log(`[Mailer Microservice] Email sent successfully to ${to}. MessageId: ${info.messageId}`);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
    });
  } catch (error: any) {
    console.error("[Mailer Microservice] Execution error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch email via SMTP" },
      { status: 500 }
    );
  }
}
