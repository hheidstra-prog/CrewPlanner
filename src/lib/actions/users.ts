"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, getCurrentUserId } from "@/lib/auth";
import { createMemberSchema } from "@/lib/validations/users";
import { getResend, FROM_EMAIL } from "@/lib/email";
import { welkomEmail } from "@/lib/email-templates/welkom";
import type { ActionResult } from "@/lib/types";

export async function toggleUserBan(
  userId: string,
  ban: boolean
): Promise<ActionResult> {
  try {
    const currentUserId = await requireAdmin();

    if (userId === currentUserId) {
      return { success: false, error: "Je kunt jezelf niet deactiveren" };
    }

    const client = await clerkClient();
    if (ban) {
      await client.users.banUser(userId);
    } else {
      await client.users.unbanUser(userId);
    }

    revalidatePath("/beheer");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

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

export async function createTeamMember(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = createMemberSchema.safeParse({
      voornaam: formData.get("voornaam"),
      achternaam: formData.get("achternaam"),
      email: formData.get("email"),
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Ongeldige invoer";
      return { success: false, error: firstError };
    }

    const { voornaam, achternaam, email } = parsed.data;

    const client = await clerkClient();

    const user = await client.users.createUser({
      emailAddress: [email],
      firstName: voornaam,
      lastName: achternaam,
      skipPasswordRequirement: true,
    });

    await client.users.updateUserMetadata(user.id, {
      publicMetadata: { role: "member" },
    });

    revalidatePath("/beheer");
    return { success: true };
  } catch (error: unknown) {
    // Clerk duplicate email error
    if (
      error &&
      typeof error === "object" &&
      "errors" in error &&
      Array.isArray((error as { errors: unknown[] }).errors)
    ) {
      const clerkErrors = (error as { errors: { code: string }[] }).errors;
      if (clerkErrors.some((e) => e.code === "form_identifier_exists")) {
        return { success: false, error: "Dit e-mailadres is al in gebruik" };
      }
    }
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function sendWelcomeEmail(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: "E-mail is niet geconfigureerd" };
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return { success: false, error: "Geen e-mailadres gevonden" };
    }

    const voornaam = user.firstName || "teamlid";
    const { subject, html } = welkomEmail({ voornaam });

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}
