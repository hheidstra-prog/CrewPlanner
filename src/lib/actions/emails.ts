"use server";

import { prisma } from "@/lib/prisma";
import { getResend, FROM_EMAIL } from "@/lib/email";
import { nieuwEvenementEmail } from "@/lib/email-templates/nieuw-evenement";
import { herinneringEmail } from "@/lib/email-templates/herinnering";
import { taakToegewezenEmail } from "@/lib/email-templates/taak-toegewezen";
import { formatDatum } from "@/lib/utils";

async function getEmailsForUserIds(userIds: string[]): Promise<string[]> {
  const teamLeden = await prisma.teamLid.findMany({
    where: { clerkUserId: { in: userIds } },
    select: { email: true },
  });
  const emails = teamLeden.map((tl) => tl.email).filter(Boolean);

  // Fall back to Clerk for any users not in TeamLid
  if (emails.length < userIds.length) {
    const foundClerkIds = new Set(
      (await prisma.teamLid.findMany({
        where: { clerkUserId: { in: userIds } },
        select: { clerkUserId: true },
      })).map((tl) => tl.clerkUserId)
    );
    const missingIds = userIds.filter((id) => !foundClerkIds.has(id));

    if (missingIds.length > 0) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const { data: clerkUsers } = await client.users.getUserList({
          userId: missingIds,
          limit: missingIds.length,
        });
        const clerkEmails = clerkUsers
          .map((u) => u.emailAddresses[0]?.emailAddress)
          .filter(Boolean) as string[];
        emails.push(...clerkEmails);
      } catch (error) {
        console.error("Failed to get emails from Clerk fallback:", error);
      }
    }
  }

  return emails;
}

export async function sendEventInviteEmails({
  eventId,
  titel,
  datum,
  eindtijd,
  locatie,
  beschrijving,
  userIds,
}: {
  eventId: string;
  titel: string;
  datum: Date;
  eindtijd?: Date | null;
  locatie?: string | null;
  beschrijving?: string | null;
  userIds: string[];
}) {
  try {
    if (!process.env.RESEND_API_KEY) return;

    const template = nieuwEvenementEmail({
      titel,
      datum: formatDatum(datum),
      datumStart: datum,
      datumEnd: eindtijd,
      locatie,
      beschrijving,
      eventId,
    });

    const emails = await getEmailsForUserIds(userIds);
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
    console.error("Failed to send event invite emails:", error);
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

    const template = herinneringEmail({
      titel,
      deadline: formatDatum(deadline),
      eventId,
    });

    const emails = await getEmailsForUserIds(userIds);
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

    const emails = await getEmailsForUserIds([assigneeId]);
    const email = emails[0];
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
