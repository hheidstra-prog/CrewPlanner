import { notFound, redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";
import { getEventById } from "@/lib/queries/events";
import { EventForm } from "@/components/events/event-form";
import type { MemberOption } from "@/components/shared/member-picker";

export default async function BewerkenEvenementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [admin, event] = await Promise.all([isAdmin(), getEventById(id)]);

  if (!admin) redirect("/evenementen");
  if (!event) notFound();

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

  const invitedUserIds = event.uitnodigingen.map((u) => u.userId);

  return (
    <div className="max-w-2xl">
      <EventForm
        event={event}
        members={members}
        invitedUserIds={invitedUserIds}
      />
    </div>
  );
}
