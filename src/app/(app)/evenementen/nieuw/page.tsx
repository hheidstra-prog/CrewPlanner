import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { EventForm } from "@/components/events/event-form";

export default async function NieuwEvenementPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/evenementen");

  return (
    <div className="max-w-2xl">
      <EventForm />
    </div>
  );
}
