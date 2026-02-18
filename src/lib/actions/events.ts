"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, requireAdmin } from "@/lib/auth";
import { eventSchema, beschikbaarheidSchema } from "@/lib/validations/events";
import type { ActionResult } from "@/lib/types";
import { notifyAdmins, notifyMembers } from "@/lib/actions/notifications";
import { BESCHIKBAARHEID_LABELS } from "@/lib/constants";
import type { BeschikbaarheidStatus } from "@/generated/prisma";

export async function createEvent(formData: FormData): Promise<ActionResult> {
  try {
    const userId = await requireAdmin();
    const raw = Object.fromEntries(formData);
    const data = eventSchema.parse(raw);

    const event = await prisma.event.create({
      data: {
        type: data.type,
        titel: data.titel,
        beschrijving: data.beschrijving || null,
        datum: new Date(data.datum),
        eindtijd: data.eindtijd ? new Date(data.eindtijd) : null,
        locatie: data.locatie || null,
        deadlineBeschikbaarheid: data.deadlineBeschikbaarheid
          ? new Date(data.deadlineBeschikbaarheid)
          : null,
        aangemaaaktDoor: userId,
      },
    });

    await notifyMembers({
      type: "NIEUW_EVENEMENT",
      message: `Nieuw evenement: "${data.titel}"`,
      referenceType: "EVENT",
      referenceId: event.id,
      actorId: userId,
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

    await prisma.event.update({
      where: { id },
      data: {
        type: data.type,
        titel: data.titel,
        beschrijving: data.beschrijving || null,
        datum: new Date(data.datum),
        eindtijd: data.eindtijd ? new Date(data.eindtijd) : null,
        locatie: data.locatie || null,
        deadlineBeschikbaarheid: data.deadlineBeschikbaarheid
          ? new Date(data.deadlineBeschikbaarheid)
          : null,
      },
    });

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
