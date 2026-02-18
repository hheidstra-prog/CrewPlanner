"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, isAdmin } from "@/lib/auth";
import { commentSchema } from "@/lib/validations/comments";
import type { ActionResult } from "@/lib/types";
import { notifyAdmins, notifyMembers } from "@/lib/actions/notifications";
import { COMMENT_PARENT_LABELS } from "@/lib/constants";
import type { CommentParentType } from "@/generated/prisma";

const parentPaths: Record<string, string> = {
  EVENT: "/evenementen",
  POST: "/informatie",
  TASK: "/taken",
};

export async function addComment(formData: FormData): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();
    const raw = {
      parentType: formData.get("parentType") as string,
      parentId: formData.get("parentId") as string,
      inhoud: formData.get("inhoud") as string,
    };
    const data = commentSchema.parse(raw);

    await prisma.comment.create({
      data: {
        parentType: data.parentType,
        parentId: data.parentId,
        inhoud: data.inhoud,
        auteurId: userId,
      },
    });

    // Notify about the comment
    const parentLabel = COMMENT_PARENT_LABELS[data.parentType as CommentParentType].toLowerCase();
    const preview = data.inhoud.length > 60 ? data.inhoud.slice(0, 60) + "..." : data.inhoud;
    const admin = await isAdmin();
    if (admin) {
      // Admin commented → notify members
      await notifyMembers({
        type: "COMMENT",
        message: `Nieuwe reactie op ${parentLabel}: "${preview}"`,
        referenceType: data.parentType as CommentParentType,
        referenceId: data.parentId,
        actorId: userId,
      });
    } else {
      // Member commented → notify admins
      await notifyAdmins({
        type: "COMMENT",
        message: `Nieuwe reactie op ${parentLabel}: "${preview}"`,
        referenceType: data.parentType as CommentParentType,
        referenceId: data.parentId,
        actorId: userId,
      });
    }

    const basePath = parentPaths[data.parentType] ?? "";
    revalidatePath(`${basePath}/${data.parentId}`);
    revalidatePath("/inbox");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();
    const admin = await isAdmin();

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return { success: false, error: "Reactie niet gevonden" };
    }

    if (comment.auteurId !== userId && !admin) {
      return { success: false, error: "Geen rechten om deze reactie te verwijderen" };
    }

    await prisma.comment.delete({ where: { id: commentId } });

    const basePath = parentPaths[comment.parentType] ?? "";
    revalidatePath(`${basePath}/${comment.parentId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}
