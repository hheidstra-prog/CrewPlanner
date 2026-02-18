import { prisma } from "@/lib/prisma";

export type MemberParticipationStat = {
  userId: string;
  uitgenodigd: number;
  gereageerd: number;
  beschikbaar: number;
  opkomstPercentage: number;
};

export type MemberTaskStat = {
  userId: string;
  afgerond: number;
};

export type MemberResponseStat = {
  userId: string;
  gemiddeldeUren: number | null;
};

export async function getMemberParticipationStats(): Promise<MemberParticipationStat[]> {
  // Get all invitations grouped by user
  const uitnodigingen = await prisma.eventUitnodiging.groupBy({
    by: ["userId"],
    _count: { id: true },
  });

  // Get all responses grouped by user
  const beschikbaarheden = await prisma.beschikbaarheid.findMany({
    select: {
      userId: true,
      status: true,
    },
  });

  const responsesByUser = new Map<string, { gereageerd: number; beschikbaar: number }>();
  for (const b of beschikbaarheden) {
    const existing = responsesByUser.get(b.userId) ?? { gereageerd: 0, beschikbaar: 0 };
    existing.gereageerd++;
    if (b.status === "BESCHIKBAAR") existing.beschikbaar++;
    responsesByUser.set(b.userId, existing);
  }

  return uitnodigingen.map((u) => {
    const responses = responsesByUser.get(u.userId) ?? { gereageerd: 0, beschikbaar: 0 };
    const uitgenodigd = u._count.id;
    return {
      userId: u.userId,
      uitgenodigd,
      gereageerd: responses.gereageerd,
      beschikbaar: responses.beschikbaar,
      opkomstPercentage: uitgenodigd > 0
        ? Math.round((responses.beschikbaar / uitgenodigd) * 100)
        : 0,
    };
  });
}

export async function getTaskCompletionStats(): Promise<MemberTaskStat[]> {
  const completed = await prisma.task.groupBy({
    by: ["geclaimdDoor"],
    where: {
      status: "AFGEROND",
      geclaimdDoor: { not: null },
    },
    _count: { id: true },
  });

  return completed
    .filter((c) => c.geclaimdDoor !== null)
    .map((c) => ({
      userId: c.geclaimdDoor!,
      afgerond: c._count.id,
    }));
}

export async function getResponseTimelinessStats(): Promise<MemberResponseStat[]> {
  // Calculate average response time: tijdstipReactie - event.createdAt
  const responses = await prisma.beschikbaarheid.findMany({
    select: {
      userId: true,
      tijdstipReactie: true,
      event: {
        select: { createdAt: true },
      },
    },
  });

  const timingByUser = new Map<string, number[]>();
  for (const r of responses) {
    const diffMs = r.tijdstipReactie.getTime() - r.event.createdAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const existing = timingByUser.get(r.userId) ?? [];
    existing.push(diffHours);
    timingByUser.set(r.userId, existing);
  }

  return Array.from(timingByUser.entries()).map(([userId, hours]) => ({
    userId,
    gemiddeldeUren: hours.length > 0
      ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length)
      : null,
  }));
}
