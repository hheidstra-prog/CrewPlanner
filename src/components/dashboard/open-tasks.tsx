import Link from "next/link";
import { ListChecks, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskActions } from "@/components/tasks/task-actions";
import type { TaskWithGroup } from "@/lib/types";

interface OpenTasksProps {
  tasks: TaskWithGroup[];
  currentUserId: string;
}

export function OpenTasks({ tasks, currentUserId }: OpenTasksProps) {
  if (tasks.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-beschikbaar" />
            Open taken
          </CardTitle>
          <Link href="/taken" className="text-xs text-ocean hover:underline">
            Alles bekijken
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-lg p-2 hover:bg-muted transition-colors"
          >
            <Link href={`/taken/${task.id}`} className="min-w-0 flex-1">
              <p className="text-sm font-medium">{task.titel}</p>
              {task.taskGroup && (
                <p className="text-xs text-muted-foreground">
                  {task.taskGroup.titel}
                </p>
              )}
            </Link>
            <TaskActions task={task} currentUserId={currentUserId} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
