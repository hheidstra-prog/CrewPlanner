import { Bell, Inbox } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationItem } from "@/components/layout/notification-item";
import { MarkAllReadButton } from "@/components/layout/mark-all-read-button";
import { getNotifications } from "@/lib/queries/notifications";
import { getCurrentUserId } from "@/lib/auth";
import { resolveUsers } from "@/lib/users";

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export default async function InboxPage() {
  const userId = await getCurrentUserId();

  const notifications = await getNotifications(userId);
  const actorIds = [...new Set(notifications.map((n) => n.actorId))];
  const usersMap = await resolveUsers(actorIds);

  const hasUnread = notifications.some((n) => !n.read);
  const todayNotifications = notifications.filter((n) => isToday(n.createdAt));
  const earlierNotifications = notifications.filter((n) => !isToday(n.createdAt));

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Meldingen over activiteit in je team"
        action={hasUnread ? <MarkAllReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Geen meldingen"
          description="Hier verschijnen meldingen als teamleden reageren, beschikbaarheid aangeven of taken oppakken."
        />
      ) : (
        <div className="space-y-6">
          {todayNotifications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                Vandaag
              </h3>
              <div className="space-y-1">
                {todayNotifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    actorName={usersMap.get(n.actorId)?.fullName}
                  />
                ))}
              </div>
            </div>
          )}
          {earlierNotifications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                Eerder
              </h3>
              <div className="space-y-1">
                {earlierNotifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    actorName={usersMap.get(n.actorId)?.fullName}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
