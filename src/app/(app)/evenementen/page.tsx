import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EventCard } from "@/components/events/event-card";
import { CalendarSubscribe } from "@/components/events/calendar-subscribe";
import { getUpcomingEvents, getPastEvents } from "@/lib/queries/events";
import { getCurrentUserId, isAdmin } from "@/lib/auth";
import { resolveUsers } from "@/lib/users";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import type { EventType } from "@/generated/prisma";
import type { ResolvedUser } from "@/lib/users";

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

  // Collect all unique user IDs and resolve them once
  const allEvents = [...upcoming, ...past];
  const allUserIds = new Set<string>();
  for (const event of allEvents) {
    for (const b of event.beschikbaarheid) allUserIds.add(b.userId);
    for (const u of event.uitnodigingen) allUserIds.add(u.userId);
  }
  const usersMapObj = await resolveUsers([...allUserIds]);
  const usersMap: Record<string, ResolvedUser> = Object.fromEntries(usersMapObj);

  return (
    <div>
      <PageHeader
        title="Planning"
        description="Alle evenementen en activiteiten"
        action={
          <div className="flex gap-2">
            <CalendarSubscribe />
            {admin && (
              <Link href="/evenementen/nieuw">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuw evenement
                </Button>
              </Link>
            )}
          </div>
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

        <TabsContent value="alle" className="mt-6 flex flex-col gap-6">
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
                    usersMap={usersMap}
                  />
                ))
              )}
              {past.length > 0 && (
                <PastEventsSection events={past} currentUserId={userId} usersMap={usersMap} />
              )}
            </>
          )}
        </TabsContent>

        {eventTypes.map((type) => {
          const filteredUpcoming = upcoming.filter((e) => e.type === type);
          const filteredPast = past.filter((e) => e.type === type);
          return (
            <TabsContent key={type} value={type} className="mt-6 flex flex-col gap-6">
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
                        usersMap={usersMap}
                      />
                    ))
                  )}
                  {filteredPast.length > 0 && (
                    <PastEventsSection
                      events={filteredPast}
                      currentUserId={userId}
                      usersMap={usersMap}
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
  usersMap,
}: {
  events: Awaited<ReturnType<typeof getPastEvents>>;
  currentUserId: string;
  usersMap: Record<string, ResolvedUser>;
}) {
  return (
    <details className="group">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground py-3 hover:text-foreground transition-colors">
        Afgelopen evenementen ({events.length})
      </summary>
      <div className="flex flex-col gap-6 mt-2 opacity-75">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            currentUserId={currentUserId}
            usersMap={usersMap}
          />
        ))}
      </div>
    </details>
  );
}
