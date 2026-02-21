import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarSubscribe } from "@/components/events/calendar-subscribe";
import { EventList } from "@/components/events/event-list";
import { getUpcomingEvents, getPastEvents } from "@/lib/queries/events";
import { getCurrentUserId, isAdmin } from "@/lib/auth";
import { resolveUsers } from "@/lib/users";
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

      <EventList
        upcoming={upcoming}
        past={past}
        currentUserId={userId}
        usersMap={usersMap}
        isAdmin={admin}
      />
    </div>
  );
}
