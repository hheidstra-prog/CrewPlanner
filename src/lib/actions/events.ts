"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, requireAdmin } from "@/lib/auth";
import { eventSchema, beschikbaarheidSchema } from "@/lib/validations/events";
import type { ActionResult } from "@/lib/types";
import { notifyAdmins, notifySpecificUsers } from "@/lib/actions/notifications";
import { BESCHIKBAARHEID_LABELS } from "@/lib/constants";
import type { BeschikbaarheidStatus } from "@/generated/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { sendEventInviteEmails } from "@/lib/actions/emails";

function combineDateTime(dateStr: string, timeStr?: string): Date | null {
  if (!timeStr) return null;
  // dateStr is a datetime-local string "YYYY-MM-DDTHH:mm", take the date part
  const datePart = dateStr.split("T")[0];
  return new Date(`${datePart}T${timeStr}`);
}

async function getAllUserIds(): Promise<string[]> {
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ limit: 100 });
  return users.map((u) => u.id);
}

function parseHerinnering(value: string | undefined): number[] {
  if (!value || value === "geen") return [];
  return value
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);
}

export async function createEvent(formData: FormData): Promise<ActionResult> {
  try {
    const userId = await requireAdmin();
    const raw = Object.fromEntries(formData);
    const data = eventSchema.parse(raw);

    // Determine invited user IDs
    const uitgenodigdenRaw = data.uitgenodigden?.trim();
    const invitedIds = uitgenodigdenRaw
      ? uitgenodigdenRaw.split(",").filter(Boolean)
      : await getAllUserIds();

    const event = await prisma.event.create({
      data: {
        type: data.type,
        titel: data.titel,
        beschrijving: data.beschrijving || null,
        datum: new Date(data.datum),
        eindtijd: combineDateTime(data.datum, data.eindtijd),
        locatie: data.locatie || null,
        deadlineBeschikbaarheid: data.deadlineBeschikbaarheid
          ? new Date(data.deadlineBeschikbaarheid)
          : null,
        aangemaaaktDoor: userId,
        uitnodigingen: {
          create: invitedIds.map((uid) => ({ userId: uid })),
        },
      },
    });

    // Create reminder records
    const herinneringDagen = parseHerinnering(data.herinnering);
    if (herinneringDagen.length > 0) {
      await prisma.eventHerinnering.createMany({
        data: herinneringDagen.map((dagen) => ({
          eventId: event.id,
          dagenNaAanmaak: dagen,
        })),
      });
    }

    // Notify invited users (in-app + email)
    await notifySpecificUsers({
      userIds: invitedIds,
      type: "NIEUW_EVENEMENT",
      message: `Nieuw evenement: "${data.titel}"`,
      referenceType: "EVENT",
      referenceId: event.id,
      actorId: userId,
    });

    await sendEventInviteEmails({
      eventId: event.id,
      titel: data.titel,
      datum: new Date(data.datum),
      locatie: data.locatie,
      userIds: invitedIds.filter((id) => id !== userId),
    });

    revalidatePath("/evenementen");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function updateEvent(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const raw = Object.fromEntries(formData);
    const data = eventSchema.parse(raw);

    // Determine invited user IDs
    const uitgenodigdenRaw = data.uitgenodigden?.trim();
    const invitedIds = uitgenodigdenRaw
      ? uitgenodigdenRaw.split(",").filter(Boolean)
      : await getAllUserIds();

    await prisma.event.update({
      where: { id },
      data: {
        type: data.type,
        titel: data.titel,
        beschrijving: data.beschrijving || null,
        datum: new Date(data.datum),
        eindtijd: combineDateTime(data.datum, data.eindtijd),
        locatie: data.locatie || null,
        deadlineBeschikbaarheid: data.deadlineBeschikbaarheid
          ? new Date(data.deadlineBeschikbaarheid)
          : null,
      },
    });

    // Delete + recreate invitations
    await prisma.eventUitnodiging.deleteMany({ where: { eventId: id } });
    await prisma.eventUitnodiging.createMany({
      data: invitedIds.map((uid) => ({ eventId: id, userId: uid })),
    });

    // Delete + recreate reminders
    await prisma.eventHerinnering.deleteMany({ where: { eventId: id } });
    const herinneringDagen = parseHerinnering(data.herinnering);
    if (herinneringDagen.length > 0) {
      await prisma.eventHerinnering.createMany({
        data: herinneringDagen.map((dagen) => ({
          eventId: id,
          dagenNaAanmaak: dagen,
        })),
      });
    }

    revalidatePath("/evenementen");
    revalidatePath(`/evenementen/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.event.delete({ where: { id } });

    revalidatePath("/evenementen");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function setAvailability(formData: FormData): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();
    const raw = {
      eventId: formData.get("eventId") as string,
      status: formData.get("status") as string,
      reden: formData.get("reden") as string | undefined,
    };
    const data = beschikbaarheidSchema.parse(raw);

    await prisma.beschikbaarheid.upsert({
      where: {
        eventId_userId: {
          eventId: data.eventId,
          userId,
        },
      },
      update: {
        status: data.status,
        reden: data.reden || null,
        tijdstipReactie: new Date(),
      },
      create: {
        eventId: data.eventId,
        userId,
        status: data.status,
        reden: data.reden || null,
      },
    });

    // Notify admins
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: { titel: true },
    });
    const statusLabel = BESCHIKBAARHEID_LABELS[data.status as BeschikbaarheidStatus].toLowerCase();
    await notifyAdmins({
      type: "BESCHIKBAARHEID",
      message: `Heeft zich als ${statusLabel} gemeld voor "${event?.titel}"`,
      referenceType: "EVENT",
      referenceId: data.eventId,
      actorId: userId,
    });

    revalidatePath(`/evenementen/${data.eventId}`);
    revalidatePath("/evenementen");
    revalidatePath("/inbox");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}
