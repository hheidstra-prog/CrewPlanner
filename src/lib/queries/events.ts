import { prisma } from "@/lib/prisma";
import type { EventType } from "@/generated/prisma";

export async function getUpcomingEvents(type?: EventType) {
  return prisma.event.findMany({
    where: {
      datum: { gte: new Date() },
      ...(type ? { type } : {}),
    },
    include: {
      beschikbaarheid: true,
    },
    orderBy: { datum: "asc" },
  });
}

export async function getAllEvents(type?: EventType) {
  return prisma.event.findMany({
    where: type ? { type } : {},
    include: {
      beschikbaarheid: true,
    },
    orderBy: { datum: "desc" },
  });
}

export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      beschikbaarheid: true,
    },
  });
}

export async function getEventsNeedingResponse(userId: string) {
  const upcomingEvents = await prisma.event.findMany({
    where: {
      datum: { gte: new Date() },
    },
    include: {
      beschikbaarheid: {
        where: { userId },
      },
    },
    orderBy: { datum: "asc" },
  });

  return upcomingEvents.filter((e) => e.beschikbaarheid.length === 0);
}

export async function getNextEvent() {
  return prisma.event.findFirst({
    where: {
      datum: { gte: new Date() },
    },
    include: {
      beschikbaarheid: true,
    },
    orderBy: { datum: "asc" },
  });
}
