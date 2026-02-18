import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getTaskGroups } from "@/lib/queries/tasks";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NieuweTaakPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/taken");

  const taskGroups = await getTaskGroups();

  return (
    <div className="max-w-2xl">
      <TaskForm taskGroups={taskGroups} />
    </div>
  );
}
