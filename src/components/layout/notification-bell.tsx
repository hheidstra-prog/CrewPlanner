import { getUnreadCount } from "@/lib/queries/notifications";
import { getCurrentUserId } from "@/lib/auth";
import { NotificationBellClient } from "./notification-bell-client";

export async function NotificationBell() {
  const userId = await getCurrentUserId();
  const count = await getUnreadCount(userId);

  return <NotificationBellClient initialCount={count} />;
}
