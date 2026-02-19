"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationItem } from "@/components/layout/notification-item";
import { InboxToolbar } from "@/components/layout/inbox-toolbar";
import type { Notification } from "@/generated/prisma";

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

interface InboxContentProps {
  notifications: Notification[];
  actorNames: Record<string, string>;
}

export function InboxContent({ notifications, actorNames }: InboxContentProps) {
  const [filter, setFilter] = useState<"ongelezen" | "alle">(
    notifications.some((n) => !n.read) ? "ongelezen" : "alle"
  );

  const hasUnread = notifications.some((n) => !n.read);
  const hasRead = notifications.some((n) => n.read);

  const filtered = filter === "ongelezen"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const todayNotifications = filtered.filter((n) => isToday(n.createdAt));
  const earlierNotifications = filtered.filter((n) => !isToday(n.createdAt));

  return (
    <>
      <InboxToolbar
        hasUnread={hasUnread}
        hasRead={hasRead}
        filter={filter}
        onFilterChange={setFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filter === "ongelezen" ? "Geen ongelezen meldingen" : "Geen meldingen"}
          description={
            filter === "ongelezen"
              ? "Je bent helemaal bij! Bekijk alle meldingen voor je geschiedenis."
              : "Hier verschijnen meldingen als teamleden reageren, beschikbaarheid aangeven of taken oppakken."
          }
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
                    actorName={actorNames[n.actorId]}
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
                    actorName={actorNames[n.actorId]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
