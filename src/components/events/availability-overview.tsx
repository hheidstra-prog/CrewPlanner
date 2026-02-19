import { UserAvatar } from "@/components/shared/user-avatar";
import { BESCHIKBAARHEID_LABELS } from "@/lib/constants";
import { relatieveDatum } from "@/lib/utils";
import type { Beschikbaarheid, BeschikbaarheidStatus, EventHerinneringLog } from "@/generated/prisma";
import type { ResolvedUser } from "@/lib/users";
import { Bell } from "lucide-react";

interface AvailabilityOverviewProps {
  beschikbaarheid: Beschikbaarheid[];
  usersMap: Map<string, ResolvedUser>;
  invitedUserIds?: string[];
  herinneringLogs?: EventHerinneringLog[];
}

const statusGroups: { status: BeschikbaarheidStatus; color: string }[] = [
  { status: "BESCHIKBAAR", color: "text-beschikbaar" },
  { status: "TWIJFEL", color: "text-twijfel" },
  { status: "NIET_BESCHIKBAAR", color: "text-niet-beschikbaar" },
];

export function AvailabilityOverview({
  beschikbaarheid,
  usersMap,
  invitedUserIds,
  herinneringLogs,
}: AvailabilityOverviewProps) {
  const respondedUserIds = new Set(beschikbaarheid.map((b) => b.userId));
  const nonResponders = invitedUserIds
    ? invitedUserIds.filter((id) => !respondedUserIds.has(id))
    : [];

  // Count reminders per user
  const reminderCountByUser = new Map<string, number>();
  if (herinneringLogs) {
    for (const log of herinneringLogs) {
      reminderCountByUser.set(log.userId, (reminderCountByUser.get(log.userId) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-4">
      {statusGroups.map(({ status, color }) => {
        const items = beschikbaarheid.filter((b) => b.status === status);
        if (items.length === 0) return null;

        return (
          <div key={status}>
            <h4 className={`text-sm font-semibold ${color} mb-2`}>
              {BESCHIKBAARHEID_LABELS[status]}{" "}
              <span className="font-mono text-xs">({items.length})</span>
            </h4>
            <div className="space-y-2">
              {items.map((b) => {
                const user = usersMap.get(b.userId);
                const reminderCount = reminderCountByUser.get(b.userId) ?? 0;
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <UserAvatar
                      imageUrl={user?.imageUrl}
                      initials={user?.initials ?? "?"}
                      fullName={user?.fullName}
                      size="sm"
                    />
                    <span>{user?.fullName ?? "Onbekend"}</span>
                    <span className="text-xs text-muted-foreground">
                      {relatieveDatum(b.tijdstipReactie)}
                    </span>
                    {b.reden && (
                      <span className="text-xs text-muted-foreground">
                        — {b.reden}
                      </span>
                    )}
                    {reminderCount > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-twijfel" title={`${reminderCount} herinnering(en) verstuurd`}>
                        <Bell className="h-3 w-3" />
                        {reminderCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {nonResponders.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Niet gereageerd{" "}
            <span className="font-mono text-xs">({nonResponders.length})</span>
          </h4>
          <div className="space-y-2">
            {nonResponders.map((userId) => {
              const user = usersMap.get(userId);
              const reminderCount = reminderCountByUser.get(userId) ?? 0;
              return (
                <div
                  key={userId}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <UserAvatar
                    imageUrl={user?.imageUrl}
                    initials={user?.initials ?? "?"}
                    fullName={user?.fullName}
                    size="sm"
                  />
                  <span>{user?.fullName ?? "Onbekend"}</span>
                  {reminderCount > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-twijfel" title={`${reminderCount} herinnering(en) verstuurd`}>
                      <Bell className="h-3 w-3" />
                      {reminderCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {beschikbaarheid.length === 0 && nonResponders.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nog niemand heeft gereageerd.
        </p>
      )}
    </div>
  );
}
