import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin, Clock, Pencil, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { AvailabilityButtons } from "@/components/events/availability-buttons";
import { AvailabilityOverview } from "@/components/events/availability-overview";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/constants";
import { formatDatum, formatTijd, relatieveDatum } from "@/lib/utils";
import { getEventById } from "@/lib/queries/events";
import { getCurrentUserId, isAdmin } from "@/lib/auth";
import { resolveUsers } from "@/lib/users";
import { CommentThread } from "@/components/comments/comment-thread";

export default async function EvenementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, userId, admin] = await Promise.all([
    getEventById(id),
    getCurrentUserId(),
    isAdmin(),
  ]);

  if (!event) notFound();

  // Access check: admin can always see, members only if invited
  const invitedUserIds = event.uitnodigingen.map((u) => u.userId);
  if (!admin && !invitedUserIds.includes(userId)) {
    notFound();
  }

  // Resolve users: responders + invited non-responders
  const allUserIds = [...new Set([
    ...event.beschikbaarheid.map((b) => b.userId),
    ...invitedUserIds,
  ])];
  const usersMap = await resolveUsers(allUserIds);

  const myResponse = event.beschikbaarheid.find((b) => b.userId === userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/evenementen">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge
              label={EVENT_TYPE_LABELS[event.type]}
              className={EVENT_TYPE_COLORS[event.type]}
            />
            <span className="text-sm text-muted-foreground">
              {relatieveDatum(event.datum)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-navy">{event.titel}</h1>
        </div>
        {admin && (
          <div className="flex gap-2">
            <Link href={`/evenementen/${event.id}/bewerken`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Bewerken
              </Button>
            </Link>
            <DeleteEventButton eventId={event.id} />
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {formatDatum(event.datum)}
                </span>
                {event.eindtijd && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTijd(event.datum)} — {formatTijd(event.eindtijd)}
                  </span>
                )}
                {event.locatie && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {event.locatie}
                  </span>
                )}
              </div>
              {event.beschrijving && (
                <>
                  <Separator />
                  <p className="text-sm whitespace-pre-wrap">
                    {event.beschrijving}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jouw beschikbaarheid</CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityButtons
                eventId={event.id}
                currentStatus={myResponse?.status}
                currentReden={myResponse?.reden}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Beschikbaarheid{" "}
                <span className="font-mono text-sm font-normal text-muted-foreground">
                  ({event.beschikbaarheid.length}/{invitedUserIds.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityOverview
                beschikbaarheid={event.beschikbaarheid}
                usersMap={usersMap}
                invitedUserIds={invitedUserIds}
                herinneringLogs={event.herinneringLogs}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <CommentThread parentType="EVENT" parentId={event.id} />
    </div>
  );
}
