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
import type { TeamMember } from "@/components/admin/team-member-list";
import { AddMemberForm } from "@/components/admin/add-member-form";
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
  const [{ data: users }, teamLeden, taskGroups, participation, taskStats, responseTiming] =
    await Promise.all([
      client.users.getUserList({ limit: 100 }),
      prisma.teamLid.findMany(),
      prisma.taskGroup.findMany({
        include: { _count: { select: { tasks: true } } },
        orderBy: { createdAt: "desc" },
      }),
      getMemberParticipationStats(),
      getTaskCompletionStats(),
      getResponseTimelinessStats(),
    ]);

  // Build a map of TeamLid by clerkUserId for merging
  const teamLidMap = new Map(teamLeden.map((tl) => [tl.clerkUserId, tl]));

  const members: TeamMember[] = users.map((user) => {
    const teamLid = teamLidMap.get(user.id);
    const firstName = teamLid?.voornaam ?? user.firstName ?? "";
    const lastName = teamLid?.achternaam ?? user.lastName ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Onbekend";
    const initials =
      [firstName, lastName]
        .filter(Boolean)
        .map((n) => n[0]?.toUpperCase())
        .join("") || "?";

    return {
      id: user.id,
      fullName,
      initials,
      email: teamLid?.email ?? user.emailAddresses[0]?.emailAddress ?? "",
      imageUrl: user.imageUrl,
      role: ((user.publicMetadata?.role as string) ?? "member") as "admin" | "member",
      banned: user.banned,
      isCurrentUser: user.id === currentUserId,
      teamLidId: teamLid?.id,
      voornaam: firstName,
      achternaam: lastName,
      straat: teamLid?.straat ?? null,
      postcode: teamLid?.postcode ?? null,
      woonplaats: teamLid?.woonplaats ?? null,
      geboortedatum: teamLid?.geboortedatum
        ? teamLid.geboortedatum.toISOString().split("T")[0]
        : null,
      isTeamManager: teamLid?.isTeamManager ?? false,
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
        <CardContent className="space-y-4">
          <AddMemberForm />
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
