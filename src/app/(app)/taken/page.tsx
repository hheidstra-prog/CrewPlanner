import Link from "next/link";
import { Plus, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskCard } from "@/components/tasks/task-card";
import { getTasks } from "@/lib/queries/tasks";
import { getCurrentUserId, isAdmin } from "@/lib/auth";
import { resolveUsers } from "@/lib/users";
import { TASK_STATUS_LABELS } from "@/lib/constants";
import type { TaskStatus } from "@/generated/prisma";

export default async function TakenPage() {
  const [tasks, userId, admin] = await Promise.all([
    getTasks(),
    getCurrentUserId(),
    isAdmin(),
  ]);

  // Resolve assignees for all tasks that have one
  const assigneeIds = tasks
    .map((t) => t.toegewezenAan)
    .filter((id): id is string => !!id);
  const assigneesMap = await resolveUsers(assigneeIds);

  const statuses: TaskStatus[] = ["OPEN", "OPGEPAKT", "AFGEROND"];

  return (
    <div>
      <PageHeader
        title="Taken"
        description="Overzicht van alle taken"
        action={
          admin ? (
            <Link href="/taken/nieuw">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe taak
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Tabs defaultValue="OPEN">
        <TabsList>
          {statuses.map((status) => {
            const count = tasks.filter((t) => t.status === status).length;
            return (
              <TabsTrigger key={status} value={status}>
                {TASK_STATUS_LABELS[status]}{" "}
                <span className="ml-1 font-mono text-xs">({count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {statuses.map((status) => {
          const filtered = tasks.filter((t) => t.status === status);
          return (
            <TabsContent key={status} value={status} className="mt-6 flex flex-col gap-6">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={ListChecks}
                  title={
                    status === "OPEN"
                      ? "Geen open taken"
                      : status === "OPGEPAKT"
                        ? "Geen taken opgepakt"
                        : "Nog niets afgerond"
                  }
                  description={
                    status === "OPEN"
                      ? "Alle taken zijn opgepakt. Lekker bezig, team!"
                      : status === "OPGEPAKT"
                        ? "Er zijn geen taken in behandeling."
                        : "Er zijn nog geen taken afgerond."
                  }
                />
              ) : (
                filtered.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={userId}
                    assignee={
                      task.toegewezenAan
                        ? assigneesMap.get(task.toegewezenAan)
                        : null
                    }
                  />
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
