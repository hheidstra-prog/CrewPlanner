import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";
import { EventForm } from "@/components/events/event-form";
import type { MemberOption } from "@/components/shared/member-picker";

export default async function NieuwEvenementPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/evenementen");

  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ limit: 100 });

  const members: MemberOption[] = users.map((user) => {
    const firstName = user.firstName ?? "";
    const lastName = user.lastName ?? "";
    return {
      id: user.id,
      fullName: [firstName, lastName].filter(Boolean).join(" ") || "Onbekend",
      initials:
        [firstName, lastName]
          .filter(Boolean)
          .map((n) => n[0]?.toUpperCase())
          .join("") || "?",
      imageUrl: user.imageUrl,
    };
  });

  return (
    <div className="max-w-2xl">
      <EventForm members={members} />
    </div>
  );
}
