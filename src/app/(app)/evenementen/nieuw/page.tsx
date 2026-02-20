import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getAllTeamLeden } from "@/lib/queries/profile";
import { EventForm } from "@/components/events/event-form";
import type { MemberOption } from "@/components/shared/member-picker";

export default async function NieuwEvenementPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/evenementen");

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

  return (
    <div className="max-w-2xl">
      <EventForm members={members} />
    </div>
  );
}
