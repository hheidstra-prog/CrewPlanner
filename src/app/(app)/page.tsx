import { Sailboat } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EventHero } from "@/components/dashboard/event-hero";
import { PendingEvents } from "@/components/dashboard/pending-events";
import { RecentPosts } from "@/components/dashboard/recent-posts";
import { OpenTasks } from "@/components/dashboard/open-tasks";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getCurrentUserId } from "@/lib/auth";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const { nextEvent, pendingEvents, recentPosts, openTasks } =
    await getDashboardData(userId);

  const hasContent = nextEvent || pendingEvents.length > 0 || recentPosts.length > 0 || openTasks.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Welkom bij CrewPlanner" />

      {!hasContent ? (
        <EmptyState
          icon={Sailboat}
          title="Welkom aan boord!"
          description="Er is nog niets te zien. Het bestuur gaat binnenkort evenementen en taken aanmaken."
        />
      ) : (
        <div className="space-y-4">
          {nextEvent && <EventHero event={nextEvent} />}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <PendingEvents events={pendingEvents} />
              <RecentPosts posts={recentPosts} />
            </div>
            <div>
              <OpenTasks tasks={openTasks} currentUserId={userId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
