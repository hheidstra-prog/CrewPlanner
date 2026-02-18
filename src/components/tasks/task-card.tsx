import Link from "next/link";
import { CalendarDays, UserCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TaskActions } from "./task-actions";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from "@/lib/constants";
import { relatieveDatum } from "@/lib/utils";
import type { TaskWithGroup } from "@/lib/types";
import type { ResolvedUser } from "@/lib/users";

interface TaskCardProps {
  task: TaskWithGroup;
  currentUserId: string;
  assignee?: ResolvedUser | null;
}

export function TaskCard({ task, currentUserId, assignee }: TaskCardProps) {
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
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {task.deadline && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Deadline: {relatieveDatum(task.deadline)}
                </div>
              )}
              {assignee && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserAvatar
                    imageUrl={assignee.imageUrl}
                    initials={assignee.initials}
                    fullName={assignee.fullName}
                    size="sm"
                  />
                  <span>{assignee.fullName}</span>
                </div>
              )}
            </div>
          </Link>
          <div className="shrink-0">
            <TaskActions task={task} currentUserId={currentUserId} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
