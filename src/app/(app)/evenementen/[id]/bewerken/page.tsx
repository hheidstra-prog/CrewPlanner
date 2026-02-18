import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getEventById } from "@/lib/queries/events";
import { EventForm } from "@/components/events/event-form";

export default async function BewerkenEvenementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [admin, event] = await Promise.all([isAdmin(), getEventById(id)]);

  if (!admin) redirect("/evenementen");
  if (!event) notFound();

  return (
    <div className="max-w-2xl">
      <EventForm event={event} />
    </div>
  );
}
