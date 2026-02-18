import Link from "next/link";
import { CalendarDays, MapPin, Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/constants";
import { formatDatumKort, formatTijd, relatieveDatum } from "@/lib/utils";
import type { EventWithBeschikbaarheid } from "@/lib/types";

interface EventHeroProps {
  event: EventWithBeschikbaarheid;
}

export function EventHero({ event }: EventHeroProps) {
  const beschikbaar = event.beschikbaarheid.filter(
    (b) => b.status === "BESCHIKBAAR"
  ).length;

  return (
    <Link href={`/evenementen/${event.id}`}>
      <Card className="bg-navy text-white border-0 transition-shadow hover:shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <StatusBadge
              label={EVENT_TYPE_LABELS[event.type]}
              className="bg-white/20 text-white border-0"
            />
            <span className="text-sm font-medium text-white/80">
              {relatieveDatum(event.datum)}
            </span>
          </div>
          <h2 className="text-xl font-bold mb-3">{event.titel}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDatumKort(event.datum)}
              {event.eindtijd && ` • ${formatTijd(event.eindtijd)}`}
            </span>
            {event.locatie && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {event.locatie}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span className="font-mono">{beschikbaar}</span> beschikbaar
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-white/60">
            Bekijk details <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
