import { clerkClient } from "@clerk/nextjs/server";

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

  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({
    userId: unique,
    limit: unique.length,
  });

  const map = new Map<string, ResolvedUser>();
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

  return map;
}

export async function resolveUser(userId: string): Promise<ResolvedUser | null> {
  const map = await resolveUsers([userId]);
  return map.get(userId) ?? null;
}
