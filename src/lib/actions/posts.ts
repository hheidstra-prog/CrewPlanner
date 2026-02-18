"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { postSchema } from "@/lib/validations/posts";
import type { ActionResult } from "@/lib/types";
import { notifyMembers } from "@/lib/actions/notifications";

interface UploadedFile {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  try {
    const userId = await requireAdmin();
    const raw = {
      titel: formData.get("titel") as string,
      inhoud: formData.get("inhoud") as string,
      categorie: formData.get("categorie") as string,
      gepind: formData.get("gepind") === "true",
    };
    const data = postSchema.parse(raw);

    const filesJson = formData.get("files") as string | null;
    const files: UploadedFile[] = filesJson ? JSON.parse(filesJson) : [];

    const post = await prisma.post.create({
      data: {
        titel: data.titel,
        inhoud: data.inhoud,
        categorie: data.categorie,
        gepind: data.gepind,
        auteurId: userId,
        files: {
          create: files.map((f) => ({
            url: f.url,
            fileName: f.fileName,
            fileSize: f.fileSize,
            fileType: f.fileType,
          })),
        },
      },
    });

    await notifyMembers({
      type: "NIEUW_BERICHT",
      message: `Nieuw bericht: "${data.titel}"`,
      referenceType: "POST",
      referenceId: post.id,
      actorId: userId,
    });

    revalidatePath("/informatie");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function updatePost(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const raw = {
      titel: formData.get("titel") as string,
      inhoud: formData.get("inhoud") as string,
      categorie: formData.get("categorie") as string,
      gepind: formData.get("gepind") === "true",
    };
    const data = postSchema.parse(raw);

    const filesJson = formData.get("files") as string | null;
    const files: UploadedFile[] = filesJson ? JSON.parse(filesJson) : [];

    // Delete removed blobs
    const existing = await prisma.post.findUnique({
      where: { id },
      include: { files: true },
    });
    const newUrls = new Set(files.map((f) => f.url));
    for (const old of existing?.files ?? []) {
      if (!newUrls.has(old.url)) {
        try { await del(old.url); } catch { /* ignore */ }
      }
    }

    // Remove old file records and create new ones
    await prisma.$transaction([
      prisma.postFile.deleteMany({ where: { postId: id } }),
      prisma.post.update({
        where: { id },
        data: {
          titel: data.titel,
          inhoud: data.inhoud,
          categorie: data.categorie,
          gepind: data.gepind,
          files: {
            create: files.map((f) => ({
              url: f.url,
              fileName: f.fileName,
              fileSize: f.fileSize,
              fileType: f.fileType,
            })),
          },
        },
      }),
    ]);

    revalidatePath("/informatie");
    revalidatePath(`/informatie/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const post = await prisma.post.findUnique({
      where: { id },
      include: { files: true },
    });
    for (const file of post?.files ?? []) {
      try { await del(file.url); } catch { /* ignore */ }
    }
    await prisma.post.delete({ where: { id } });

    revalidatePath("/informatie");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}
