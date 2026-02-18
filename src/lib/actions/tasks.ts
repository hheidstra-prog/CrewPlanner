"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, requireAdmin } from "@/lib/auth";
import { taskSchema } from "@/lib/validations/tasks";
import type { ActionResult } from "@/lib/types";
import { notifyAdmins, notifyMembers } from "@/lib/actions/notifications";

export async function createTask(formData: FormData): Promise<ActionResult> {
  try {
    const userId = await requireAdmin();
    const raw = {
      titel: formData.get("titel") as string,
      beschrijving: (formData.get("beschrijving") as string) || undefined,
      deadline: (formData.get("deadline") as string) || undefined,
      taskGroupId: (formData.get("taskGroupId") as string) || undefined,
      toegewezenAan: (formData.get("toegewezenAan") as string) || undefined,
    };
    const data = taskSchema.parse(raw);

    const task = await prisma.task.create({
      data: {
        titel: data.titel,
        beschrijving: data.beschrijving || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        taskGroupId: data.taskGroupId || null,
        toegewezenAan: data.toegewezenAan || null,
        aangemaaaktDoor: userId,
      },
    });

    await notifyMembers({
      type: "NIEUWE_TAAK",
      message: `Nieuwe taak: "${data.titel}"`,
      referenceType: "TASK",
      referenceId: task.id,
      actorId: userId,
    });

    revalidatePath("/taken");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function claimTask(taskId: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { success: false, error: "Taak niet gevonden" };
    if (task.status !== "OPEN") return { success: false, error: "Taak is al opgepakt" };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "OPGEPAKT",
        geclaimdDoor: userId,
      },
    });

    await notifyAdmins({
      type: "TAAK_GECLAIMD",
      message: `Heeft taak "${task.titel}" opgepakt`,
      referenceType: "TASK",
      referenceId: taskId,
      actorId: userId,
    });

    revalidatePath("/taken");
    revalidatePath(`/taken/${taskId}`);
    revalidatePath("/inbox");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function completeTask(taskId: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { success: false, error: "Taak niet gevonden" };
    if (task.status === "AFGEROND") return { success: false, error: "Taak is al afgerond" };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "AFGEROND",
        geclaimdDoor: task.geclaimdDoor ?? userId,
        afgerondOp: new Date(),
      },
    });

    await notifyAdmins({
      type: "TAAK_AFGEROND",
      message: `Heeft taak "${task.titel}" afgerond`,
      referenceType: "TASK",
      referenceId: taskId,
      actorId: userId,
    });

    revalidatePath("/taken");
    revalidatePath(`/taken/${taskId}`);
    revalidatePath("/inbox");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.task.delete({ where: { id: taskId } });

    revalidatePath("/taken");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function createTaskGroup(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const titel = (formData.get("titel") as string)?.trim();
    if (!titel) return { success: false, error: "Titel is verplicht" };

    await prisma.taskGroup.create({
      data: { titel },
    });

    revalidatePath("/beheer");
    revalidatePath("/taken/nieuw");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function deleteTaskGroup(groupId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.taskGroup.delete({ where: { id: groupId } });

    revalidatePath("/beheer");
    revalidatePath("/taken/nieuw");
    revalidatePath("/taken");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}
