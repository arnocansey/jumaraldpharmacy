import crypto from "crypto";

export interface SmsMessage {
  to: string;
  message: string;
}

export async function sendSms(to: string, message: string): Promise<boolean> {
  const provider = process.env.SMS_PROVIDER || "console";

  if (provider === "africastalking") {
    return sendAfricasTalkingSms(to, message);
  }

  console.log(`[SMS] To: ${to} | Message: ${message}`);
  return true;
}

async function sendAfricasTalkingSms(to: string, message: string): Promise<boolean> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || "sandbox";
  const from = process.env.AFRICASTALKING_SENDER_ID;

  if (!apiKey) {
    console.log(`[SMS-SKIPPED] No Africa's Talking API key. To: ${to} | Message: ${message}`);
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("to", to);
    formData.append("message", message);
    if (from) formData.append("from", from);

    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: formData.toString(),
    });

    const result: any = await response.json();
    if (result.SMSMessageData?.Recipients?.[0]?.status === "Success") {
      return true;
    }
    console.error("[SMS] Africa's Talking error:", result);
    return false;
  } catch (err) {
    console.error("[SMS] Send failed:", err);
    return false;
  }
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendOrderConfirmationSms(phone: string, orderNumber: string, total: number) {
  if (!phone) return;
  const message = `Hi! Your order ${orderNumber} for GHS ${total.toFixed(2)} has been received. Track at jumaraldpharmacy.vercel.app/track-order`;
  await sendSms(phone, message);
}

export async function sendDeliveryUpdateSms(phone: string, trackingNumber: string, status: string) {
  if (!phone) return;
  const messages: Record<string, string> = {
    OUT_FOR_DELIVERY: `Your order is out for delivery! Track: ${trackingNumber}`,
    DELIVERED: `Your order has been delivered! Thank you for choosing Jumarald Pharmacy.`,
    ASSIGNED: `A driver has been assigned to your delivery. Track: ${trackingNumber}`,
  };
  const message = messages[status];
  if (message) await sendSms(phone, message);
}

export async function sendPrescriptionUpdateSms(phone: string, status: string) {
  if (!phone) return;
  const messages: Record<string, string> = {
    APPROVED: `Your prescription has been approved! You can now place your order.`,
    REJECTED: `Your prescription needs clarification. Please check your dashboard.`,
  };
  const message = messages[status];
  if (message) await sendSms(phone, message);
}
