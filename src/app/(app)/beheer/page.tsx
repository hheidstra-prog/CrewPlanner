import { redirect } from "next/navigation";
import { Users, BarChart3 } from "lucide-react";
import { clerkClient } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { isAdmin, getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveUsers } from "@/lib/users";
import { TaskGroupManager } from "@/components/tasks/task-group-manager";
import { TeamMemberList } from "@/components/admin/team-member-list";
import { StatsDashboard } from "@/components/admin/stats-dashboard";
import {
  getMemberParticipationStats,
  getTaskCompletionStats,
  getResponseTimelinessStats,
} from "@/lib/queries/stats";

export default async function BeheerPage() {
  const [admin, currentUserId] = await Promise.all([
    isAdmin(),
    getCurrentUserId(),
  ]);
  if (!admin) redirect("/");

  const client = await clerkClient();
  const [{ data: users }, taskGroups, participation, taskStats, responseTiming] =
    await Promise.all([
      client.users.getUserList({ limit: 100 }),
      prisma.taskGroup.findMany({
        include: { _count: { select: { tasks: true } } },
        orderBy: { createdAt: "desc" },
      }),
      getMemberParticipationStats(),
      getTaskCompletionStats(),
      getResponseTimelinessStats(),
    ]);

  const members = users.map((user) => {
    const firstName = user.firstName ?? "";
    const lastName = user.lastName ?? "";
    return {
      id: user.id,
      fullName: [firstName, lastName].filter(Boolean).join(" ") || "Onbekend",
      initials:
        [firstName, lastName]
          .filter(Boolean)
          .map((n) => n[0]?.toUpperCase())
          .join("") || "?",
      email: user.emailAddresses[0]?.emailAddress ?? "",
      imageUrl: user.imageUrl,
      role: ((user.publicMetadata?.role as string) ?? "member") as "admin" | "member",
      isCurrentUser: user.id === currentUserId,
    };
  });

  // Resolve all user IDs for stats display
  const allStatUserIds = [
    ...new Set([
      ...participation.map((p) => p.userId),
      ...taskStats.map((t) => t.userId),
      ...responseTiming.map((r) => r.userId),
    ]),
  ];
  const statsUsersMap = await resolveUsers(allStatUserIds);

  return (
    <div>
      <PageHeader
        title="Beheer"
        description="Teamleden, statistieken en instellingen"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Teamleden
            <span className="font-mono text-sm font-normal text-muted-foreground">
              ({members.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TeamMemberList members={members} />
        </CardContent>
      </Card>

      <div className="mt-6">
        <TaskGroupManager groups={taskGroups} />
      </div>

      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <BarChart3 className="h-5 w-5" />
          Statistieken
        </h2>
        <StatsDashboard
          participation={participation}
          tasks={taskStats}
          responseTiming={responseTiming}
          usersMap={statsUsersMap}
        />
      </div>
    </div>
  );
}
