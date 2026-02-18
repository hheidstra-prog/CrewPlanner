import Link from "next/link";
import { CalendarDays, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/constants";
import { formatDatumKort, formatTijd, relatieveDatum } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { EventWithBeschikbaarheid } from "@/lib/types";

interface EventCardProps {
  event: EventWithBeschikbaarheid;
  currentUserId?: string;
}

function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDeadlineUrgency(event: EventWithBeschikbaarheid) {
  const totalInvited = event.uitnodigingen.length;
  const deadline = event.deadlineBeschikbaarheid ?? event.datum;
  const days = daysUntil(deadline);
  const responded = event.beschikbaarheid.length;
  const responseRate = totalInvited > 0 ? responded / totalInvited : 0;
  const beschikbaar = event.beschikbaarheid.filter((b) => b.status === "BESCHIKBAAR").length;
  const nietBeschikbaar = event.beschikbaarheid.filter((b) => b.status === "NIET_BESCHIKBAAR").length;

  if (days <= 2 && responseRate < 0.5) return "critical";
  if (days <= 3 && nietBeschikbaar > beschikbaar && responded >= 2) return "critical";
  if (days <= 5 && responseRate < 0.5) return "warning";
  if (days <= 7 && responseRate < 0.3) return "warning";
  if (days < 0) return "past";

  return "ok";
}

export function EventCard({ event, currentUserId }: EventCardProps) {
  const totalInvited = event.uitnodigingen.length;
  const beschikbaar = event.beschikbaarheid.filter((b) => b.status === "BESCHIKBAAR").length;
  const nietBeschikbaar = event.beschikbaarheid.filter((b) => b.status === "NIET_BESCHIKBAAR").length;
  const twijfel = event.beschikbaarheid.filter((b) => b.status === "TWIJFEL").length;
  const responded = event.beschikbaarheid.length;
  const notResponded = Math.max(0, totalInvited - responded);

  const userResponse = currentUserId
    ? event.beschikbaarheid.find((b) => b.userId === currentUserId)
    : null;

  const deadline = event.deadlineBeschikbaarheid;
  const deadlineDays = deadline ? daysUntil(deadline) : null;
  const urgency = getDeadlineUrgency(event);

  const total = totalInvited || 1;
  const pctBeschikbaar = (beschikbaar / total) * 100;
  const pctNiet = (nietBeschikbaar / total) * 100;
  const pctTwijfel = (twijfel / total) * 100;

  return (
    <Link href={`/evenementen/${event.id}`}>
      <Card
        className={cn(
          "transition-shadow hover:shadow-md",
          urgency === "critical" && "border-niet-beschikbaar/50 bg-niet-beschikbaar/[0.02]",
          urgency === "warning" && "border-twijfel/50"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge
                  label={EVENT_TYPE_LABELS[event.type]}
                  className={EVENT_TYPE_COLORS[event.type]}
                />
                <span className="text-xs text-muted-foreground">
                  {relatieveDatum(event.datum)}
                </span>
                {urgency === "critical" && (
                  <span className="flex items-center gap-1 text-xs font-medium text-niet-beschikbaar">
                    <AlertTriangle className="h-3 w-3" />
                    Actie vereist
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-foreground truncate">
                {event.titel}
              </h3>

              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDatumKort(event.datum)}
                  {event.eindtijd && ` — ${formatTijd(event.eindtijd)}`}
                </span>
                {event.locatie && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.locatie}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  {pctBeschikbaar > 0 && (
                    <div
                      className="bg-beschikbaar transition-all"
                      style={{ width: `${pctBeschikbaar}%` }}
                    />
                  )}
                  {pctTwijfel > 0 && (
                    <div
                      className="bg-twijfel transition-all"
                      style={{ width: `${pctTwijfel}%` }}
                    />
                  )}
                  {pctNiet > 0 && (
                    <div
                      className="bg-niet-beschikbaar transition-all"
                      style={{ width: `${pctNiet}%` }}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-beschikbaar" />
                      {beschikbaar}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-twijfel" />
                      {twijfel}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-niet-beschikbaar" />
                      {nietBeschikbaar}
                    </span>
                    {notResponded > 0 && (
                      <span className="text-muted-foreground">
                        {notResponded} niet gereageerd
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {responded}/{totalInvited}
                  </span>
                </div>

                {deadline && deadlineDays !== null && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      deadlineDays < 0 && "text-muted-foreground",
                      deadlineDays >= 0 && deadlineDays <= 2 && "text-niet-beschikbaar font-medium",
                      deadlineDays > 2 && deadlineDays <= 5 && "text-twijfel",
                      deadlineDays > 5 && "text-muted-foreground"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {deadlineDays < 0
                      ? "Deadline verstreken"
                      : deadlineDays === 0
                        ? "Deadline vandaag"
                        : deadlineDays === 1
                          ? "Deadline morgen"
                          : `Deadline over ${deadlineDays} dagen`}
                  </div>
                )}
              </div>
            </div>

            {currentUserId && !userResponse && (
              <span className="shrink-0 mt-1 rounded-full bg-twijfel-light px-2.5 py-1 text-xs font-medium text-twijfel">
                Reageer
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
