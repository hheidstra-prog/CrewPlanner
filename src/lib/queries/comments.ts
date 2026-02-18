import { prisma } from "@/lib/prisma";
import type { CommentParentType } from "@/generated/prisma";

export async function getComments(parentType: CommentParentType, parentId: string) {
  return prisma.comment.findMany({
    where: { parentType, parentId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCommentCount(parentType: CommentParentType, parentId: string) {
  return prisma.comment.count({
    where: { parentType, parentId },
  });
}
