import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateICalFeed } from "@/lib/ical";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ics = generateICalFeed([event]);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(event.titel)}.ics"`,
    },
  });
}
