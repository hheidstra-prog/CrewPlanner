import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getUnreadCount } from "@/lib/queries/notifications";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const count = await getUnreadCount(userId);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
