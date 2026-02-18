import { auth, currentUser } from "@clerk/nextjs/server";

export async function getCurrentUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Niet ingelogd");
  return userId;
}

export type UserRole = "admin" | "member";

export async function getUserRole(): Promise<UserRole> {
  const user = await currentUser();
  if (!user) throw new Error("Niet ingelogd");
  return (user.publicMetadata?.role as UserRole) ?? "member";
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin";
}

export async function requireAdmin(): Promise<string> {
  const userId = await getCurrentUserId();
  const role = await getUserRole();
  if (role !== "admin") throw new Error("Geen toegang — alleen voor beheerders");
  return userId;
}
