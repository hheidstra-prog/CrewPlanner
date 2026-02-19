"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function getOrCreateCalendarToken(): Promise<string> {
  const userId = await getCurrentUserId();

  const existing = await prisma.calendarToken.findUnique({
    where: { userId },
  });

  if (existing) return existing.token;

  const created = await prisma.calendarToken.create({
    data: { userId },
  });

  return created.token;
}

export async function regenerateCalendarToken(): Promise<string> {
  const userId = await getCurrentUserId();

  await prisma.calendarToken.deleteMany({
    where: { userId },
  });

  const created = await prisma.calendarToken.create({
    data: { userId },
  });

  return created.token;
}
