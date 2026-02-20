import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getEventById } from "@/lib/queries/events";
import { getAllTeamLeden } from "@/lib/queries/profile";
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

  const teamLeden = await getAllTeamLeden();

  const members: MemberOption[] = teamLeden.map((tl) => ({
    id: tl.clerkUserId,
    fullName: [tl.voornaam, tl.achternaam].filter(Boolean).join(" ") || "Onbekend",
    initials:
      [tl.voornaam, tl.achternaam]
        .filter(Boolean)
        .map((n) => n[0]?.toUpperCase())
        .join("") || "?",
    imageUrl: "",
  }));

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
