import { UserAvatar } from "@/components/shared/user-avatar";
import { BESCHIKBAARHEID_LABELS } from "@/lib/constants";
import type { Beschikbaarheid, BeschikbaarheidStatus } from "@/generated/prisma";
import type { ResolvedUser } from "@/lib/users";

interface AvailabilityOverviewProps {
  beschikbaarheid: Beschikbaarheid[];
  usersMap: Map<string, ResolvedUser>;
  invitedUserIds?: string[];
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
}: AvailabilityOverviewProps) {
  const respondedUserIds = new Set(beschikbaarheid.map((b) => b.userId));
  const nonResponders = invitedUserIds
    ? invitedUserIds.filter((id) => !respondedUserIds.has(id))
    : [];

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
                    {b.reden && (
                      <span className="text-xs text-muted-foreground">
                        — {b.reden}
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
