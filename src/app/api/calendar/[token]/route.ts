import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateICalFeed } from "@/lib/ical";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const calendarToken = await prisma.calendarToken.findUnique({
    where: { token },
  });

  if (!calendarToken) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = calendarToken.userId;

  // Get upcoming events + past 30 days that the user is invited to
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const events = await prisma.event.findMany({
    where: {
      datum: { gte: thirtyDaysAgo },
      uitnodigingen: { some: { userId } },
    },
    orderBy: { datum: "asc" },
  });

  const ical = generateICalFeed(events);

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="crewplanner.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
