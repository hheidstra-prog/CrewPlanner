"use client";

import { useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { EventCard } from "@/components/events/event-card";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import type { EventType } from "@/generated/prisma";
import type { EventWithBeschikbaarheid } from "@/lib/types";
import type { ResolvedUser } from "@/lib/users";

interface EventListProps {
  upcoming: EventWithBeschikbaarheid[];
  past: EventWithBeschikbaarheid[];
  currentUserId: string;
  usersMap: Record<string, ResolvedUser>;
  isAdmin?: boolean;
}

const eventTypes = Object.keys(EVENT_TYPE_LABELS) as EventType[];

function filterEvents(events: EventWithBeschikbaarheid[], query: string) {
  if (!query) return events;
  const q = query.toLowerCase();
  return events.filter(
    (e) =>
      e.titel.toLowerCase().includes(q) ||
      (e.locatie && e.locatie.toLowerCase().includes(q))
  );
}

export function EventList({ upcoming, past, currentUserId, usersMap, isAdmin }: EventListProps) {
  const [search, setSearch] = useState("");

  const filteredUpcoming = filterEvents(upcoming, search);
  const filteredPast = filterEvents(past, search);

  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Zoek op titel of locatie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

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
          <EventTabContent
            upcoming={filteredUpcoming}
            past={filteredPast}
            currentUserId={currentUserId}
            usersMap={usersMap}
            isAdmin={isAdmin}
          />
        </TabsContent>

        {eventTypes.map((type) => (
          <TabsContent key={type} value={type} className="mt-6 flex flex-col gap-6">
            <EventTabContent
              upcoming={filteredUpcoming.filter((e) => e.type === type)}
              past={filteredPast.filter((e) => e.type === type)}
              currentUserId={currentUserId}
              usersMap={usersMap}
              isAdmin={isAdmin}
              typeLabel={EVENT_TYPE_LABELS[type].toLowerCase()}
            />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function EventTabContent({
  upcoming,
  past,
  currentUserId,
  usersMap,
  isAdmin,
  typeLabel,
}: {
  upcoming: EventWithBeschikbaarheid[];
  past: EventWithBeschikbaarheid[];
  currentUserId: string;
  usersMap: Record<string, ResolvedUser>;
  isAdmin?: boolean;
  typeLabel?: string;
}) {
  const label = typeLabel ?? "evenement";

  if (upcoming.length === 0 && past.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={`Geen ${label}en`}
        description={
          typeLabel
            ? `Er zijn nog geen ${label}en gepland.`
            : "Geen evenementen gevonden."
        }
      />
    );
  }

  return (
    <>
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Geen aankomende {label}en.
        </p>
      ) : (
        upcoming.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            currentUserId={currentUserId}
            usersMap={usersMap}
            isAdmin={isAdmin}
          />
        ))
      )}
      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground py-3 hover:text-foreground transition-colors">
            Afgelopen evenementen ({past.length})
          </summary>
          <div className="flex flex-col gap-6 mt-2 opacity-75">
            {past.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={currentUserId}
                usersMap={usersMap}
              />
            ))}
          </div>
        </details>
      )}
    </>
  );
}
