import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getTaskGroups } from "@/lib/queries/tasks";
import { getAllTeamLeden } from "@/lib/queries/profile";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NieuweTaakPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/taken");

  const [taskGroups, teamLeden] = await Promise.all([
    getTaskGroups(),
    getAllTeamLeden(),
  ]);

  const members = teamLeden.map((tl) => ({
    id: tl.clerkUserId,
    fullName: [tl.voornaam, tl.achternaam].filter(Boolean).join(" ") || "Onbekend",
  }));

  return (
    <div className="max-w-2xl">
      <TaskForm taskGroups={taskGroups} members={members} />
    </div>
  );
}
