import { prisma } from "../lib/prisma";
import { sendEmail } from "./notifications";

export async function sendNewsletter(params: {
  subject: string;
  htmlContent: string;
  segment?: string;
}) {
  const { subject, htmlContent, segment } = params;

  if (process.env.SENDGRID_API_KEY) {
    return sendWithSendGrid(params);
  }

  if (process.env.MAILCHIMP_API_KEY) {
    return sendWithMailchimp(params);
  }

  console.log(`[NEWSLETTER] Subject: ${subject} | Recipients: ${segment || "all"} | Preview: ${htmlContent.substring(0, 100)}...`);
  return { sent: 0, message: "No email provider configured" };
}

async function sendWithSendGrid(params: { subject: string; htmlContent: string; segment?: string }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@jumaraldpharmacy.com";

  try {
    const users = await prisma.user.findMany({
      where: { role: "CUSTOMER", isActive: true },
      select: { email: true, name: true },
    });

    const batchSize = 500;
    let sent = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const personalizations = batch.map((user) => ({
        to: [{ email: user.email }],
        substitutions: { name: user.name },
      }));

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations,
          from: { email: fromEmail, name: "Jumarald Pharmacy" },
          subject: params.subject,
          content: [{ type: "text/html", value: params.htmlContent }],
        }),
      });

      if (response.ok) sent += batch.length;
    }

    return { sent, message: `Sent to ${sent} subscribers via SendGrid` };
  } catch (err: any) {
    console.error("[NEWSLETTER] SendGrid error:", err.message);
    return { sent: 0, message: err.message };
  }
}

async function sendWithMailchimp(params: { subject: string; htmlContent: string; segment?: string }) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const server = apiKey?.split("-").pop();
  const listId = process.env.MAILCHIMP_LIST_ID;

  if (!server || !listId) {
    return { sent: 0, message: "Mailchimp configuration incomplete" };
  }

  try {
    const response = await fetch(`https://${server}.api.mailchimp.com/3.0/campaigns`, {
      method: "POST",
      headers: {
        Authorization: `apikey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "regular",
        recipients: { list_id: listId },
        settings: {
          subject_line: params.subject,
          from_name: "Jumarald Pharmacy",
          reply_to: "noreply@jumaraldpharmacy.com",
        },
        content: { html: params.htmlContent },
      }),
    });

    const campaign: any = await response.json();

    if (campaign.id) {
      await fetch(`https://${server}.api.mailchimp.com/3.0/campaigns/${campaign.id}/actions/send`, {
        method: "POST",
        headers: { Authorization: `apikey ${apiKey}` },
      });
    }

    return { sent: 1, message: "Campaign sent via Mailchimp" };
  } catch (err: any) {
    console.error("[NEWSLETTER] Mailchimp error:", err.message);
    return { sent: 0, message: err.message };
  }
}

export async function subscribeToNewsletter(email: string, name?: string) {
  if (process.env.SENDGRID_API_KEY) {
    try {
      await fetch("https://api.sendgrid.com/v3/marketing/contacts", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          list_ids: [process.env.SENDGRID_LIST_ID || ""],
          contacts: [{ email, name }],
        }),
      });
      return { success: true };
    } catch { return { success: false }; }
  }
  console.log(`[NEWSLETTER] Subscribe: ${email}`);
  return { success: true };
}
