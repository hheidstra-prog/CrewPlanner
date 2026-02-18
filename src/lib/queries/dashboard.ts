import { getNextEvent, getEventsNeedingResponse } from "./events";
import { getRecentPosts } from "./posts";
import { getOpenTasks } from "./tasks";
import { isAdmin } from "@/lib/auth";

export async function getDashboardData(userId: string) {
  const admin = await isAdmin();

  const [nextEvent, pendingEvents, recentPosts, openTasks] = await Promise.all([
    // Admins see the global next event; members see events they're invited to
    getNextEvent(admin ? undefined : userId),
    getEventsNeedingResponse(userId),
    getRecentPosts(3),
    getOpenTasks(5),
  ]);

  return {
    nextEvent,
    pendingEvents,
    recentPosts,
    openTasks,
  };
}
