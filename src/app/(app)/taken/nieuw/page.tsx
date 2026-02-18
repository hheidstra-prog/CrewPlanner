import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";
import { getTaskGroups } from "@/lib/queries/tasks";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NieuweTaakPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/taken");

  const client = await clerkClient();
  const [taskGroups, { data: users }] = await Promise.all([
    getTaskGroups(),
    client.users.getUserList({ limit: 100 }),
  ]);

  const members = users.map((user) => {
    const firstName = user.firstName ?? "";
    const lastName = user.lastName ?? "";
    return {
      id: user.id,
      fullName: [firstName, lastName].filter(Boolean).join(" ") || "Onbekend",
    };
  });

  return (
    <div className="max-w-2xl">
      <TaskForm taskGroups={taskGroups} members={members} />
    </div>
  );
}
