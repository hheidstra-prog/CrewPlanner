import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { clerkClient } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EventCard } from "@/components/events/event-card";
import { getAllEvents } from "@/lib/queries/events";
import { getCurrentUserId, isAdmin } from "@/lib/auth";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import type { EventType } from "@/generated/prisma";

export default async function EvenementenPage() {
  const client = await clerkClient();
  const [events, userId, admin, { data: users }] = await Promise.all([
    getAllEvents(),
    getCurrentUserId(),
    isAdmin(),
    client.users.getUserList({ limit: 100 }),
  ]);

  const totalMembers = users.length;
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
          {events.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Geen evenementen"
              description="Nog geen evenementen gepland. Tijd om het water op te gaan!"
            />
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={userId}
                totalMembers={totalMembers}
              />
            ))
          )}
        </TabsContent>

        {eventTypes.map((type) => {
          const filtered = events.filter((e) => e.type === type);
          return (
            <TabsContent key={type} value={type} className="mt-4 space-y-3">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title={`Geen ${EVENT_TYPE_LABELS[type].toLowerCase()}en`}
                  description={`Er zijn nog geen ${EVENT_TYPE_LABELS[type].toLowerCase()}en gepland.`}
                />
              ) : (
                filtered.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    currentUserId={userId}
                    totalMembers={totalMembers}
                  />
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
