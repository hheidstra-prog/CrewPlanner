"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import type { NotificationType, CommentParentType } from "@/generated/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { sendPushToUsers } from "@/lib/push";

const refPaths: Record<CommentParentType, string> = {
  EVENT: "/evenementen",
  POST: "/informatie",
  TASK: "/taken",
};

function buildPushPayload(params: {
  type: NotificationType;
  message: string;
  referenceType: CommentParentType;
  referenceId: string;
}) {
  return {
    title: "CrewPlanner",
    body: params.message,
    url: `${refPaths[params.referenceType]}/${params.referenceId}`,
    tag: `${params.type}-${params.referenceId}`,
  };
}

export async function markAsRead(notificationId: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
    revalidatePath("/inbox");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function markAllAsRead(): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    revalidatePath("/inbox");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function clearReadNotifications(): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();
    await prisma.notification.deleteMany({
      where: { userId, read: true },
    });
    revalidatePath("/inbox");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

/**
 * Create notifications for all members (non-admins), excluding the actor.
 */
export async function notifyMembers({
  type,
  message,
  referenceType,
  referenceId,
  actorId,
}: {
  type: NotificationType;
  message: string;
  referenceType: CommentParentType;
  referenceId: string;
  actorId: string;
}) {
  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ limit: 100 });

    const memberIds = users
      .filter((u) => u.publicMetadata?.role !== "admin" && u.id !== actorId)
      .map((u) => u.id);

    if (memberIds.length === 0) return;

    await prisma.notification.createMany({
      data: memberIds.map((userId) => ({
        userId,
        type,
        message,
        referenceType,
        referenceId,
        actorId,
      })),
    });

    try {
      await sendPushToUsers(memberIds, buildPushPayload({ type, message, referenceType, referenceId }));
    } catch (pushError) {
      console.error("Failed to send push to members:", pushError);
    }
  } catch (error) {
    console.error("Failed to create member notifications:", error);
  }
}

/**
 * Create notifications for specific users (excluding the actor).
 */
export async function notifySpecificUsers({
  userIds,
  type,
  message,
  referenceType,
  referenceId,
  actorId,
}: {
  userIds: string[];
  type: NotificationType;
  message: string;
  referenceType: CommentParentType;
  referenceId: string;
  actorId: string;
}) {
  try {
    const targets = userIds.filter((id) => id !== actorId);
    if (targets.length === 0) return;

    await prisma.notification.createMany({
      data: targets.map((userId) => ({
        userId,
        type,
        message,
        referenceType,
        referenceId,
        actorId,
      })),
    });

    try {
      await sendPushToUsers(targets, buildPushPayload({ type, message, referenceType, referenceId }));
    } catch (pushError) {
      console.error("Failed to send push to specific users:", pushError);
    }
  } catch (error) {
    console.error("Failed to create targeted notifications:", error);
  }
}

/**
 * Create notifications for all admins (except the actor who triggered it).
 */
export async function notifyAdmins({
  type,
  message,
  referenceType,
  referenceId,
  actorId,
}: {
  type: NotificationType;
  message: string;
  referenceType: CommentParentType;
  referenceId: string;
  actorId: string;
}) {
  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ limit: 100 });

    const adminIds = users
      .filter((u) => u.publicMetadata?.role === "admin" && u.id !== actorId)
      .map((u) => u.id);

    if (adminIds.length === 0) return;

    await prisma.notification.createMany({
      data: adminIds.map((userId) => ({
        userId,
        type,
        message,
        referenceType,
        referenceId,
        actorId,
      })),
    });

    try {
      await sendPushToUsers(adminIds, buildPushPayload({ type, message, referenceType, referenceId }));
    } catch (pushError) {
      console.error("Failed to send push to admins:", pushError);
    }
  } catch (error) {
    // Don't fail the parent action if notifications fail
    console.error("Failed to create notifications:", error);
  }
}
