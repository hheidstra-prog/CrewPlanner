import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const { endpoint } = await request.json();

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint verplicht" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });

  return NextResponse.json({ ok: true });
}
