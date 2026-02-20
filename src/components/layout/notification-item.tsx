"use client";

import Link from "next/link";
import { MessageSquare, CalendarCheck, Hand, CheckCircle2, Calendar, FileText, ClipboardList, Bell, UserCheck, Cake } from "lucide-react";
import { cn } from "@/lib/utils";
import { relatieveDatum } from "@/lib/utils";
import { markAsRead } from "@/lib/actions/notifications";
import type { Notification, NotificationType, CommentParentType } from "@/generated/prisma";

const icons: Record<NotificationType, typeof MessageSquare> = {
  COMMENT: MessageSquare,
  BESCHIKBAARHEID: CalendarCheck,
  TAAK_GECLAIMD: Hand,
  TAAK_AFGEROND: CheckCircle2,
  NIEUW_EVENEMENT: Calendar,
  NIEUW_BERICHT: FileText,
  NIEUWE_TAAK: ClipboardList,
  HERINNERING: Bell,
  TAAK_TOEGEWEZEN: UserCheck,
  VERJAARDAG: Cake,
};

const iconColors: Record<NotificationType, string> = {
  COMMENT: "text-ocean",
  BESCHIKBAARHEID: "text-beschikbaar",
  TAAK_GECLAIMD: "text-twijfel",
  TAAK_AFGEROND: "text-beschikbaar",
  NIEUW_EVENEMENT: "text-ocean",
  NIEUW_BERICHT: "text-navy",
  NIEUWE_TAAK: "text-twijfel",
  HERINNERING: "text-twijfel",
  TAAK_TOEGEWEZEN: "text-ocean",
  VERJAARDAG: "text-twijfel",
};

const refPaths: Record<CommentParentType, string> = {
  EVENT: "/evenementen",
  POST: "/informatie",
  TASK: "/taken",
};

interface NotificationItemProps {
  notification: Notification;
  actorName?: string;
}

export function NotificationItem({ notification, actorName }: NotificationItemProps) {
  const Icon = icons[notification.type];
  // Birthday notifications link to dashboard instead of a specific entity
  const href = notification.type === "VERJAARDAG"
    ? "/"
    : `${refPaths[notification.referenceType]}/${notification.referenceId}`;

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted",
        !notification.read && "bg-ocean-light/50"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          !notification.read ? "bg-white" : "bg-muted"
        )}
      >
        <Icon className={cn("h-4 w-4", iconColors[notification.type])} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.read && "font-medium")}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {actorName && <span>{actorName} &middot; </span>}
          {relatieveDatum(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-ocean" />
      )}
    </Link>
  );
}
