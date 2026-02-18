import { prisma } from "@/lib/prisma";
import type { PostCategorie } from "@/generated/prisma";

export async function getPosts(categorie?: PostCategorie, search?: string) {
  return prisma.post.findMany({
    where: {
      ...(categorie ? { categorie } : {}),
      ...(search
        ? {
            OR: [
              { titel: { contains: search, mode: "insensitive" } },
              { inhoud: { contains: search, mode: "insensitive" } },
              { files: { some: { fileName: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: { files: true },
    orderBy: [{ gepind: "desc" }, { createdAt: "desc" }],
  });
}

export async function getRecentPosts(limit = 3) {
  return prisma.post.findMany({
    include: { files: true },
    orderBy: [{ gepind: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getPostById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { files: true },
  });
}
