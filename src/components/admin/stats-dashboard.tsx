import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberStatsTable } from "./member-stats-table";
import type { MemberParticipationStat, MemberTaskStat, MemberResponseStat } from "@/lib/queries/stats";
import type { ResolvedUser } from "@/lib/users";

interface StatsDashboardProps {
  participation: MemberParticipationStat[];
  tasks: MemberTaskStat[];
  responseTiming: MemberResponseStat[];
  usersMap: Map<string, ResolvedUser>;
}

function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return "< 1u";
  if (hours < 24) return `${hours}u`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function StatsDashboard({
  participation,
  tasks,
  responseTiming,
  usersMap,
}: StatsDashboardProps) {
  // Sort participation by opkomstPercentage descending
  const sortedParticipation = [...participation].sort(
    (a, b) => b.opkomstPercentage - a.opkomstPercentage
  );

  const sortedTasks = [...tasks].sort((a, b) => b.afgerond - a.afgerond);

  const sortedTiming = [...responseTiming].sort((a, b) => {
    if (a.gemiddeldeUren === null) return 1;
    if (b.gemiddeldeUren === null) return -1;
    return a.gemiddeldeUren - b.gemiddeldeUren;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Opkomst</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberStatsTable
            columns={[
              { key: "uitgenodigd", label: "Uitgenodigd" },
              { key: "gereageerd", label: "Gereageerd" },
              { key: "beschikbaar", label: "Beschikbaar" },
              { key: "opkomst", label: "Opkomst %" },
            ]}
            rows={sortedParticipation.map((p) => ({
              userId: p.userId,
              values: {
                uitgenodigd: p.uitgenodigd,
                gereageerd: p.gereageerd,
                beschikbaar: p.beschikbaar,
                opkomst: `${p.opkomstPercentage}%`,
              },
            }))}
            usersMap={usersMap}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Afgeronde taken</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberStatsTable
            columns={[{ key: "afgerond", label: "Afgerond" }]}
            rows={sortedTasks.map((t) => ({
              userId: t.userId,
              values: { afgerond: t.afgerond },
            }))}
            usersMap={usersMap}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Responstijd</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberStatsTable
            columns={[{ key: "gemiddeld", label: "Gem. reactietijd" }]}
            rows={sortedTiming.map((r) => ({
              userId: r.userId,
              values: { gemiddeld: formatHours(r.gemiddeldeUren) },
            }))}
            usersMap={usersMap}
          />
        </CardContent>
      </Card>
    </div>
  );
}
