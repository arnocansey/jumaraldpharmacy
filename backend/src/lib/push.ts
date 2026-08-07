import webPush from "web-push";

let pushConfigured = false;

export function configureWebPush() {
  if (pushConfigured) return;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log("[Push] VAPID keys not configured. Push notifications disabled.");
    return;
  }

  webPush.setVapidDetails("mailto:admin@jumaraldpharmacy.com", vapidPublicKey, vapidPrivateKey);
  pushConfigured = true;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; icon?: string; url?: string }
): Promise<boolean> {
  if (!pushConfigured) {
    console.log(`[Push-Skipped] ${payload.title}: ${payload.body}`);
    return false;
  }

  try {
    await webPush.sendNotification(subscription, JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      data: { url: payload.url || "/" },
      vibrate: [200, 100, 200],
    }));
    return true;
  } catch (err: any) {
    console.error("[Push] Send failed:", err.message);
    return false;
  }
}

export async function savePushSubscription(userId: string, subscription: any) {
  const { prisma } = await import("./prisma");
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        title: "Push Notifications",
        message: "Push notifications enabled",
        link: "/dashboard",
      },
    });
  } catch {}
}

export async function broadcastPushNotification(
  title: string,
  body: string,
  url?: string,
  userIds?: string[]
) {
  console.log(`[Push-Broadcast] ${title}: ${body} | Recipients: ${userIds?.length || "all"}`);
}
