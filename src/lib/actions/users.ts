"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, getCurrentUserId } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

export async function setUserRole(
  userId: string,
  role: "admin" | "member"
): Promise<ActionResult> {
  try {
    const currentUserId = await requireAdmin();

    // Prevent removing your own admin role
    if (userId === currentUserId && role === "member") {
      return { success: false, error: "Je kunt je eigen beheerdersrol niet verwijderen" };
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    revalidatePath("/beheer");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}
