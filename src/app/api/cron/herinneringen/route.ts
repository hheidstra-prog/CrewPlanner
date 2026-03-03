import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmails } from "@/lib/actions/emails";
import { sendPushToUsers } from "@/lib/push";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find active reminders (verzonden: false) for upcoming events
    // Old one-shot reminders (verzonden: true) are never picked up
    const herinneringen = await prisma.eventHerinnering.findMany({
      where: { verzonden: false },
      include: {
        event: {
          include: {
            uitnodigingen: true,
            beschikbaarheid: true,
            herinneringLogs: true,
          },
        },
      },
    });

    let sent = 0;

    for (const herinnering of herinneringen) {
      const { event } = herinnering;
      const interval = herinnering.dagenNaAanmaak;

      // Skip past events
      if (event.datum < now) continue;

      // Skip events past their deadline
      if (event.deadlineBeschikbaarheid && event.deadlineBeschikbaarheid < now) continue;

      // Initial delay: event.createdAt + interval must have passed
      const firstTrigger = new Date(event.createdAt);
      firstTrigger.setDate(firstTrigger.getDate() + interval);
      if (now < firstTrigger) continue;

      // Find non-responders: invited but no beschikbaarheid record
      const respondedUserIds = new Set(event.beschikbaarheid.map((b) => b.userId));
      const nonResponderIds = event.uitnodigingen
        .map((u) => u.userId)
        .filter((id) => !respondedUserIds.has(id));

      if (nonResponderIds.length === 0) continue;

      // For each non-responder, check if enough time has passed since their last reminder
      const intervalMs = interval * 24 * 60 * 60 * 1000;
      const usersToRemind: string[] = [];

      for (const userId of nonResponderIds) {
        const userLogs = event.herinneringLogs
          .filter((log) => log.userId === userId)
          .sort((a, b) => b.verzondenOp.getTime() - a.verzondenOp.getTime());

        if (userLogs.length === 0) {
          // Never reminded — initial delay already passed, so send
          usersToRemind.push(userId);
        } else {
          // Check if interval has passed since last reminder
          const lastSent = userLogs[0].verzondenOp;
          if (now.getTime() - lastSent.getTime() >= intervalMs) {
            usersToRemind.push(userId);
          }
        }
      }

      if (usersToRemind.length === 0) continue;

      // Send reminder emails
      const deadline = event.deadlineBeschikbaarheid ?? event.datum;
      await sendReminderEmails({
        eventId: event.id,
        titel: event.titel,
        deadline,
        userIds: usersToRemind,
      });

      // Send push notifications
      await sendPushToUsers(usersToRemind, {
        title: "Herinnering",
        body: `Reageer op "${event.titel}"`,
        url: `/evenementen/${event.id}`,
      });

      // Create in-app notifications
      await prisma.notification.createMany({
        data: usersToRemind.map((userId) => ({
          userId,
          type: "HERINNERING" as const,
          message: `Herinnering: reageer op "${event.titel}"`,
          referenceType: "EVENT" as const,
          referenceId: event.id,
          actorId: event.aangemaaaktDoor,
        })),
      });

      // Log per-user reminder delivery
      await prisma.eventHerinneringLog.createMany({
        data: usersToRemind.map((userId) => ({
          eventId: event.id,
          userId,
        })),
      });

      sent += usersToRemind.length;
    }

    return NextResponse.json({
      ok: true,
      processed: herinneringen.length,
      reminders_sent: sent,
    });
  } catch (error) {
    console.error("Cron herinneringen error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
