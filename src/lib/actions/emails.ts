"use server";

import { getResend, FROM_EMAIL } from "@/lib/email";
import { nieuwEvenementEmail } from "@/lib/email-templates/nieuw-evenement";
import { herinneringEmail } from "@/lib/email-templates/herinnering";
import { taakToegewezenEmail } from "@/lib/email-templates/taak-toegewezen";
import { formatDatum } from "@/lib/utils";

export async function sendEventInviteEmails({
  eventId,
  titel,
  datum,
  locatie,
  userIds,
}: {
  eventId: string;
  titel: string;
  datum: Date;
  locatie?: string | null;
  userIds: string[];
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("[Email] Skipping invite emails: RESEND_API_KEY not set");
      return;
    }

    console.log(`[Email] Sending invite emails for event "${titel}" to ${userIds.length} users`);

    const template = nieuwEvenementEmail({
      titel,
      datum: formatDatum(datum),
      locatie,
      eventId,
    });

    // Collect email addresses from Clerk users
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const { data: clerkUsers } = await client.users.getUserList({
      userId: userIds,
      limit: userIds.length,
    });

    const emails = clerkUsers
      .map((u) => u.emailAddresses[0]?.emailAddress)
      .filter(Boolean) as string[];

    console.log(`[Email] Resolved ${emails.length} email addresses:`, emails);

    if (emails.length === 0) return;

    const result = await getResend().batch.send(
      emails.map((email) => ({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      }))
    );
    console.log("[Email] Resend batch result:", JSON.stringify(result));
  } catch (error) {
    console.error("[Email] Failed to send event invite emails:", error);
  }
}

export async function sendReminderEmails({
  eventId,
  titel,
  deadline,
  userIds,
}: {
  eventId: string;
  titel: string;
  deadline: Date;
  userIds: string[];
}) {
  try {
    if (!process.env.RESEND_API_KEY) return;

    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const { data: clerkUsers } = await client.users.getUserList({
      userId: userIds,
      limit: userIds.length,
    });

    const template = herinneringEmail({
      titel,
      deadline: formatDatum(deadline),
      eventId,
    });

    const emails = clerkUsers
      .map((u) => u.emailAddresses[0]?.emailAddress)
      .filter(Boolean) as string[];

    if (emails.length === 0) return;

    await getResend().batch.send(
      emails.map((email) => ({
        from: FROM_EMAIL,
        to: email,
        subject: template.subject,
        html: template.html,
      }))
    );
  } catch (error) {
    console.error("Failed to send reminder emails:", error);
  }
}

export async function sendTaskAssignedEmail({
  taskId,
  titel,
  assigneeId,
}: {
  taskId: string;
  titel: string;
  assigneeId: string;
}) {
  try {
    if (!process.env.RESEND_API_KEY) return;

    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const { data: clerkUsers } = await client.users.getUserList({
      userId: [assigneeId],
      limit: 1,
    });

    const email = clerkUsers[0]?.emailAddresses[0]?.emailAddress;
    if (!email) return;

    const template = taakToegewezenEmail({ titel, taskId });

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error("Failed to send task assigned email:", error);
  }
}
