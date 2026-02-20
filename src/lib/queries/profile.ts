import { prisma } from "@/lib/prisma";

export async function getTeamLidByClerkId(clerkUserId: string) {
  return prisma.teamLid.findUnique({
    where: { clerkUserId },
  });
}

export async function getAllTeamLeden() {
  return prisma.teamLid.findMany({
    orderBy: { voornaam: "asc" },
  });
}
