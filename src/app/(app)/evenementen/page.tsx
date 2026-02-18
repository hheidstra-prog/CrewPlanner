import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EventCard } from "@/components/events/event-card";
import { getUpcomingEvents, getPastEvents } from "@/lib/queries/events";
import { getCurrentUserId, isAdmin } from "@/lib/auth";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import type { EventType } from "@/generated/prisma";

export default async function EvenementenPage() {
  const [upcomingEvents, pastEvents, userId, admin] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
    getCurrentUserId(),
    isAdmin(),
  ]);

  // Members only see events they're invited to
  const filterByInvitation = (events: typeof upcomingEvents) =>
    admin
      ? events
      : events.filter((e) => e.uitnodigingen.some((u) => u.userId === userId));

  const upcoming = filterByInvitation(upcomingEvents);
  const past = filterByInvitation(pastEvents);
  const eventTypes = Object.keys(EVENT_TYPE_LABELS) as EventType[];

  return (
    <div>
      <PageHeader
        title="Planning"
        description="Alle evenementen en activiteiten"
        action={
          admin ? (
            <Link href="/evenementen/nieuw">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nieuw evenement
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Tabs defaultValue="alle">
        <TabsList>
          <TabsTrigger value="alle">Alle</TabsTrigger>
          {eventTypes.map((type) => (
            <TabsTrigger key={type} value={type}>
              {EVENT_TYPE_LABELS[type]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="alle" className="mt-4 space-y-3">
          {upcoming.length === 0 && past.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Geen evenementen"
              description="Nog geen evenementen gepland. Tijd om het water op te gaan!"
            />
          ) : (
            <>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Geen aankomende evenementen.
                </p>
              ) : (
                upcoming.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    currentUserId={userId}
                  />
                ))
              )}
              {past.length > 0 && (
                <PastEventsSection events={past} currentUserId={userId} />
              )}
            </>
          )}
        </TabsContent>

        {eventTypes.map((type) => {
          const filteredUpcoming = upcoming.filter((e) => e.type === type);
          const filteredPast = past.filter((e) => e.type === type);
          return (
            <TabsContent key={type} value={type} className="mt-4 space-y-3">
              {filteredUpcoming.length === 0 && filteredPast.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title={`Geen ${EVENT_TYPE_LABELS[type].toLowerCase()}en`}
                  description={`Er zijn nog geen ${EVENT_TYPE_LABELS[type].toLowerCase()}en gepland.`}
                />
              ) : (
                <>
                  {filteredUpcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Geen aankomende {EVENT_TYPE_LABELS[type].toLowerCase()}en.
                    </p>
                  ) : (
                    filteredUpcoming.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        currentUserId={userId}
                      />
                    ))
                  )}
                  {filteredPast.length > 0 && (
                    <PastEventsSection
                      events={filteredPast}
                      currentUserId={userId}
                    />
                  )}
                </>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function PastEventsSection({
  events,
  currentUserId,
}: {
  events: Awaited<ReturnType<typeof getPastEvents>>;
  currentUserId: string;
}) {
  return (
    <details className="group">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground py-3 hover:text-foreground transition-colors">
        Afgelopen evenementen ({events.length})
      </summary>
      <div className="space-y-3 mt-2 opacity-75">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </details>
  );
}
