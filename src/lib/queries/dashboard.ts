import { getNextEvent, getEventsNeedingResponse } from "./events";
import { getRecentPosts } from "./posts";
import { getOpenTasks } from "./tasks";

export async function getDashboardData(userId: string) {
  const [nextEvent, pendingEvents, recentPosts, openTasks] = await Promise.all([
    getNextEvent(),
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
