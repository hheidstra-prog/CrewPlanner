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
      uitnodigingen: true,
    },
    orderBy: { datum: "asc" },
  });
}

export async function getPastEvents(type?: EventType) {
  return prisma.event.findMany({
    where: {
      datum: { lt: new Date() },
      ...(type ? { type } : {}),
    },
    include: {
      beschikbaarheid: true,
      uitnodigingen: true,
    },
    orderBy: { datum: "desc" },
  });
}

export async function getAllEvents(type?: EventType) {
  return prisma.event.findMany({
    where: type ? { type } : {},
    include: {
      beschikbaarheid: true,
      uitnodigingen: true,
    },
    orderBy: { datum: "desc" },
  });
}

export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      beschikbaarheid: true,
      uitnodigingen: true,
      herinneringen: true,
      herinneringLogs: true,
    },
  });
}

export async function getEventsNeedingResponse(userId: string) {
  const upcomingEvents = await prisma.event.findMany({
    where: {
      datum: { gte: new Date() },
      uitnodigingen: {
        some: { userId },
      },
    },
    include: {
      beschikbaarheid: {
        where: { userId },
      },
      uitnodigingen: true,
    },
    orderBy: { datum: "asc" },
  });

  return upcomingEvents.filter((e) => e.beschikbaarheid.length === 0);
}

export async function getNextEvent(userId?: string) {
  return prisma.event.findFirst({
    where: {
      datum: { gte: new Date() },
      ...(userId
        ? { uitnodigingen: { some: { userId } } }
        : {}),
    },
    include: {
      beschikbaarheid: true,
      uitnodigingen: true,
    },
    orderBy: { datum: "asc" },
  });
}
