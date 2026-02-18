import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDatumKort } from "@/lib/utils";
import type { Event } from "@/generated/prisma";

interface PendingEventsProps {
  events: Event[];
}

export function PendingEvents({ events }: PendingEventsProps) {
  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-4 w-4 text-twijfel" />
          Wacht op jouw reactie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/evenementen/${event.id}`}
            className="flex items-center justify-between rounded-lg p-2 hover:bg-muted transition-colors"
          >
            <div>
              <p className="text-sm font-medium">{event.titel}</p>
              <p className="text-xs text-muted-foreground">
                {formatDatumKort(event.datum)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
