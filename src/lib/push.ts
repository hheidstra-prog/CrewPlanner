import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let _initialized = false;

function initWebPush() {
  if (_initialized) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn("VAPID keys not configured — push notifications disabled");
    return;
  }

  webpush.setVapidDetails(
    "mailto:admin@virtalize.ai",
    publicKey,
    privateKey,
  );
  _initialized = true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send push notifications to a list of users.
 * Silently handles missing VAPID config and expired subscriptions.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  initWebPush();
  if (!_initialized) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  if (subscriptions.length === 0) return;

  const jsonPayload = JSON.stringify(payload);
  const expiredIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          jsonPayload,
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or invalid — mark for deletion
          expiredIds.push(sub.id);
        } else {
          console.error(`Push failed for ${sub.endpoint}:`, err);
        }
      }
    }),
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: expiredIds } },
    });
  }
}
