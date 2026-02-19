import { prisma } from "@/lib/prisma";

export type MemberParticipationStat = {
  userId: string;
  uitgenodigd: number;
  beschikbaar: number;
  twijfel: number;
  nietBeschikbaar: number;
  herinneringen: number;
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

  const responsesByUser = new Map<string, { beschikbaar: number; twijfel: number; nietBeschikbaar: number }>();
  for (const b of beschikbaarheden) {
    const existing = responsesByUser.get(b.userId) ?? { beschikbaar: 0, twijfel: 0, nietBeschikbaar: 0 };
    if (b.status === "BESCHIKBAAR") existing.beschikbaar++;
    else if (b.status === "TWIJFEL") existing.twijfel++;
    else if (b.status === "NIET_BESCHIKBAAR") existing.nietBeschikbaar++;
    responsesByUser.set(b.userId, existing);
  }

  // Count reminders per user
  const herinneringLogs = await prisma.eventHerinneringLog.groupBy({
    by: ["userId"],
    _count: { id: true },
  });
  const herinneringenByUser = new Map<string, number>();
  for (const h of herinneringLogs) {
    herinneringenByUser.set(h.userId, h._count.id);
  }

  return uitnodigingen.map((u) => {
    const responses = responsesByUser.get(u.userId) ?? { beschikbaar: 0, twijfel: 0, nietBeschikbaar: 0 };
    const uitgenodigd = u._count.id;
    return {
      userId: u.userId,
      uitgenodigd,
      beschikbaar: responses.beschikbaar,
      twijfel: responses.twijfel,
      nietBeschikbaar: responses.nietBeschikbaar,
      herinneringen: herinneringenByUser.get(u.userId) ?? 0,
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
