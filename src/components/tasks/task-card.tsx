import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { TaskActions } from "./task-actions";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from "@/lib/constants";
import { relatieveDatum } from "@/lib/utils";
import type { TaskWithGroup } from "@/lib/types";

interface TaskCardProps {
  task: TaskWithGroup;
  currentUserId: string;
}

export function TaskCard({ task, currentUserId }: TaskCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/taken/${task.id}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge
                label={TASK_STATUS_LABELS[task.status]}
                className={TASK_STATUS_COLORS[task.status]}
              />
              {task.taskGroup && (
                <span className="text-xs text-muted-foreground">
                  {task.taskGroup.titel}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground">{task.titel}</h3>
            {task.deadline && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                Deadline: {relatieveDatum(task.deadline)}
              </div>
            )}
          </Link>
          <div className="shrink-0">
            <TaskActions task={task} currentUserId={currentUserId} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
