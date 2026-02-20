import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayMonth = now.getMonth() + 1; // 1-based
    const todayDay = now.getDate();

    // Find team members with birthday today
    // Use raw query to extract month/day from geboortedatum
    const birthdayMembers = await prisma.teamLid.findMany({
      where: {
        geboortedatum: { not: null },
      },
    });

    const todayBirthdays = birthdayMembers.filter((tl) => {
      if (!tl.geboortedatum) return false;
      const d = new Date(tl.geboortedatum);
      return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay;
    });

    if (todayBirthdays.length === 0) {
      return NextResponse.json({ ok: true, birthdays: 0 });
    }

    // Get all team member IDs for notifications
    const allMembers = await prisma.teamLid.findMany({
      select: { clerkUserId: true },
    });
    const allUserIds = allMembers.map((m) => m.clerkUserId);

    let notified = 0;

    for (const birthdayPerson of todayBirthdays) {
      const age = birthdayPerson.geboortedatum
        ? now.getFullYear() - birthdayPerson.geboortedatum.getFullYear()
        : null;
      const voornaam = birthdayPerson.voornaam;
      const achternaam = birthdayPerson.achternaam;
      const fullName = [voornaam, achternaam].filter(Boolean).join(" ");

      const message = age
        ? `${fullName} is vandaag ${age} jaar geworden! 🎂`
        : `${fullName} is vandaag jarig! 🎂`;

      // Notify all other members
      const recipientIds = allUserIds.filter(
        (id) => id !== birthdayPerson.clerkUserId
      );

      if (recipientIds.length === 0) continue;

      await prisma.notification.createMany({
        data: recipientIds.map((userId) => ({
          userId,
          type: "VERJAARDAG" as const,
          message,
          referenceType: "EVENT" as const, // placeholder — required by schema
          referenceId: birthdayPerson.id,
          actorId: birthdayPerson.clerkUserId,
        })),
      });

      // Send push notifications
      try {
        await sendPushToUsers(recipientIds, {
          title: "CrewPlanner",
          body: message,
          url: "/",
          tag: `VERJAARDAG-${birthdayPerson.clerkUserId}`,
        });
      } catch (pushError) {
        console.error("Failed to send birthday push:", pushError);
      }

      notified++;
    }

    return NextResponse.json({
      ok: true,
      birthdays: todayBirthdays.length,
      notified,
    });
  } catch (error) {
    console.error("Cron verjaardagen error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
