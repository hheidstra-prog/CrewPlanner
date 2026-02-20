"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMemberSchema, updateMemberSchema, updateProfileSchema } from "@/lib/validations/users";
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

    if (userId === currentUserId && role === "member") {
      return { success: false, error: "Je kunt je eigen beheerdersrol niet verwijderen" };
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    // Keep TeamLid.isTeamManager in sync
    await prisma.teamLid.updateMany({
      where: { clerkUserId: userId },
      data: { isTeamManager: role === "admin" },
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
      straat: formData.get("straat") || "",
      postcode: formData.get("postcode") || "",
      woonplaats: formData.get("woonplaats") || "",
      geboortedatum: formData.get("geboortedatum") || "",
      isTeamManager: formData.get("isTeamManager") === "on" || formData.get("isTeamManager") === "true",
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Ongeldige invoer";
      return { success: false, error: firstError };
    }

    const { voornaam, achternaam, email, straat, postcode, woonplaats, geboortedatum, isTeamManager } = parsed.data;

    const client = await clerkClient();

    const user = await client.users.createUser({
      emailAddress: [email],
      firstName: voornaam,
      lastName: achternaam,
      skipPasswordRequirement: true,
    });

    await client.users.updateUserMetadata(user.id, {
      publicMetadata: { role: isTeamManager ? "admin" : "member" },
    });

    // Create TeamLid record
    await prisma.teamLid.create({
      data: {
        clerkUserId: user.id,
        voornaam,
        achternaam,
        email,
        straat: straat || null,
        postcode: postcode || null,
        woonplaats: woonplaats || null,
        geboortedatum: geboortedatum ? new Date(geboortedatum) : null,
        isTeamManager,
      },
    });

    revalidatePath("/beheer");
    return { success: true };
  } catch (error: unknown) {
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

export async function updateTeamMember(
  teamLidId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const parsed = updateMemberSchema.safeParse({
      voornaam: formData.get("voornaam"),
      achternaam: formData.get("achternaam"),
      email: formData.get("email"),
      straat: formData.get("straat") || "",
      postcode: formData.get("postcode") || "",
      woonplaats: formData.get("woonplaats") || "",
      geboortedatum: formData.get("geboortedatum") || "",
      isTeamManager: formData.get("isTeamManager") === "on" || formData.get("isTeamManager") === "true",
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Ongeldige invoer";
      return { success: false, error: firstError };
    }

    const { voornaam, achternaam, email, straat, postcode, woonplaats, geboortedatum, isTeamManager } = parsed.data;

    const teamLid = await prisma.teamLid.findUnique({ where: { id: teamLidId } });
    if (!teamLid) {
      return { success: false, error: "Teamlid niet gevonden" };
    }

    // Update TeamLid record
    await prisma.teamLid.update({
      where: { id: teamLidId },
      data: {
        voornaam,
        achternaam,
        email,
        straat: straat || null,
        postcode: postcode || null,
        woonplaats: woonplaats || null,
        geboortedatum: geboortedatum ? new Date(geboortedatum) : null,
        isTeamManager,
      },
    });

    // Sync name, email, and role to Clerk
    const client = await clerkClient();
    await client.users.updateUser(teamLid.clerkUserId, {
      firstName: voornaam,
      lastName: achternaam,
    });
    await client.users.updateUserMetadata(teamLid.clerkUserId, {
      publicMetadata: { role: isTeamManager ? "admin" : "member" },
    });

    revalidatePath("/beheer");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function updateProfile(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId();

    const parsed = updateProfileSchema.safeParse({
      voornaam: formData.get("voornaam"),
      achternaam: formData.get("achternaam"),
      straat: formData.get("straat") || "",
      postcode: formData.get("postcode") || "",
      woonplaats: formData.get("woonplaats") || "",
      geboortedatum: formData.get("geboortedatum") || "",
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Ongeldige invoer";
      return { success: false, error: firstError };
    }

    const { voornaam, achternaam, straat, postcode, woonplaats, geboortedatum } = parsed.data;

    const teamLid = await prisma.teamLid.findUnique({ where: { clerkUserId: userId } });
    if (!teamLid) {
      return { success: false, error: "Profiel niet gevonden" };
    }

    await prisma.teamLid.update({
      where: { clerkUserId: userId },
      data: {
        voornaam,
        achternaam,
        straat: straat || null,
        postcode: postcode || null,
        woonplaats: woonplaats || null,
        geboortedatum: geboortedatum ? new Date(geboortedatum) : null,
      },
    });

    // Sync name to Clerk
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      firstName: voornaam,
      lastName: achternaam,
    });

    revalidatePath("/profiel");
    revalidatePath("/beheer");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Er ging iets mis" };
  }
}

export async function sendWelcomeEmail(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: "E-mail is niet geconfigureerd" };
    }

    // Try TeamLid first, fall back to Clerk
    const teamLid = await prisma.teamLid.findUnique({ where: { clerkUserId: userId } });

    let email: string | undefined;
    let voornaam: string;

    if (teamLid) {
      email = teamLid.email;
      voornaam = teamLid.voornaam || "teamlid";
    } else {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      email = user.emailAddresses[0]?.emailAddress;
      voornaam = user.firstName || "teamlid";
    }

    if (!email) {
      return { success: false, error: "Geen e-mailadres gevonden" };
    }

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
