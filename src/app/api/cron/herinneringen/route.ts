import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmails } from "@/lib/actions/emails";
import { formatDatum } from "@/lib/utils";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all unsent reminders
    const herinneringen = await prisma.eventHerinnering.findMany({
      where: { verzonden: false },
      include: {
        event: {
          include: {
            uitnodigingen: true,
            beschikbaarheid: true,
          },
        },
      },
    });

    let sent = 0;

    for (const herinnering of herinneringen) {
      const { event } = herinnering;

      // Calculate trigger date: event creation + X days
      const triggerDate = new Date(event.createdAt);
      triggerDate.setDate(triggerDate.getDate() + herinnering.dagenNaAanmaak);

      // Only send if trigger date has passed and event is still upcoming
      if (now < triggerDate) continue;
      if (event.datum < now) continue;

      // Find non-responders: invited but no beschikbaarheid record
      const respondedUserIds = new Set(event.beschikbaarheid.map((b) => b.userId));
      const nonResponderIds = event.uitnodigingen
        .map((u) => u.userId)
        .filter((id) => !respondedUserIds.has(id));

      if (nonResponderIds.length === 0) {
        // Everyone responded, mark as sent
        await prisma.eventHerinnering.update({
          where: { id: herinnering.id },
          data: { verzonden: true, verzondenOp: now },
        });
        continue;
      }

      // Send reminder emails
      const deadline = event.deadlineBeschikbaarheid ?? event.datum;
      await sendReminderEmails({
        eventId: event.id,
        titel: event.titel,
        deadline,
        userIds: nonResponderIds,
      });

      // Create in-app notifications
      await prisma.notification.createMany({
        data: nonResponderIds.map((userId) => ({
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
        data: nonResponderIds.map((userId) => ({
          eventId: event.id,
          userId,
        })),
      });

      // Mark reminder as sent
      await prisma.eventHerinnering.update({
        where: { id: herinnering.id },
        data: { verzonden: true, verzondenOp: now },
      });

      sent++;
    }

    return NextResponse.json({
      ok: true,
      processed: herinneringen.length,
      sent,
    });
  } catch (error) {
    console.error("Cron herinneringen error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
