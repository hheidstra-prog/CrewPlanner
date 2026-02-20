import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export type ResolvedUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  fullName: string;
  initials: string;
};

export async function resolveUsers(userIds: string[]): Promise<Map<string, ResolvedUser>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();

  const map = new Map<string, ResolvedUser>();

  // Try TeamLid first
  const teamLeden = await prisma.teamLid.findMany({
    where: { clerkUserId: { in: unique } },
  });

  for (const lid of teamLeden) {
    const fullName = [lid.voornaam, lid.achternaam].filter(Boolean).join(" ") || "Onbekend";
    const initials = [lid.voornaam, lid.achternaam]
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "?";

    map.set(lid.clerkUserId, {
      id: lid.clerkUserId,
      firstName: lid.voornaam,
      lastName: lid.achternaam,
      imageUrl: "",
      fullName,
      initials,
    });
  }

  // Fall back to Clerk for any IDs not found in TeamLid
  const missingIds = unique.filter((id) => !map.has(id));
  if (missingIds.length > 0) {
    try {
      const client = await clerkClient();
      const { data: users } = await client.users.getUserList({
        userId: missingIds,
        limit: missingIds.length,
      });

      for (const user of users) {
        const firstName = user.firstName ?? "";
        const lastName = user.lastName ?? "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Onbekend";
        const initials = [firstName, lastName]
          .filter(Boolean)
          .map((n) => n[0]?.toUpperCase())
          .join("") || "?";

        map.set(user.id, {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          fullName,
          initials,
        });
      }
    } catch (error) {
      console.error("Failed to resolve users from Clerk:", error);
    }
  }

  return map;
}

export async function resolveUser(userId: string): Promise<ResolvedUser | null> {
  const map = await resolveUsers([userId]);
  return map.get(userId) ?? null;
}
