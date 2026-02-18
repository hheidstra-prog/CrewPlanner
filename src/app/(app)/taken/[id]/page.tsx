import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TaskActions } from "@/components/tasks/task-actions";
import { CommentThread } from "@/components/comments/comment-thread";
import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from "@/lib/constants";
import { formatDatum, relatieveDatum } from "@/lib/utils";
import { getTaskById } from "@/lib/queries/tasks";
import { getCurrentUserId, isAdmin } from "@/lib/auth";
import { resolveUser } from "@/lib/users";

export default async function TaakDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, userId, admin] = await Promise.all([
    getTaskById(id),
    getCurrentUserId(),
    isAdmin(),
  ]);

  if (!task) notFound();

  const [claimedBy, assignedTo] = await Promise.all([
    task.geclaimdDoor ? resolveUser(task.geclaimdDoor) : null,
    task.toegewezenAan ? resolveUser(task.toegewezenAan) : null,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/taken">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge
              label={TASK_STATUS_LABELS[task.status]}
              className={TASK_STATUS_COLORS[task.status]}
            />
            {task.taskGroup && (
              <span className="text-sm text-muted-foreground">
                {task.taskGroup.titel}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-navy">{task.titel}</h1>
        </div>
        <div className="flex items-center gap-2">
          <TaskActions task={task} currentUserId={userId} />
          {admin && <DeleteTaskButton taskId={task.id} />}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {task.beschrijving && (
            <p className="text-sm whitespace-pre-wrap">{task.beschrijving}</p>
          )}
          {(task.deadline || claimedBy || assignedTo || task.afgerondOp) && (
            <>
              {task.beschrijving && <Separator />}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {task.deadline && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Deadline: {formatDatum(task.deadline)}
                  </span>
                )}
                {assignedTo && (
                  <span className="flex items-center gap-1.5">
                    <UserAvatar
                      imageUrl={assignedTo.imageUrl}
                      initials={assignedTo.initials}
                      fullName={assignedTo.fullName}
                      size="sm"
                    />
                    Toegewezen aan: {assignedTo.fullName}
                  </span>
                )}
                {claimedBy && (
                  <span>Opgepakt door: {claimedBy.fullName}</span>
                )}
                {task.afgerondOp && (
                  <span>Afgerond: {relatieveDatum(task.afgerondOp)}</span>
                )}
              </div>
            </>
          )}
          {!task.beschrijving && !task.deadline && !claimedBy && !assignedTo && !task.afgerondOp && (
            <p className="text-sm text-muted-foreground">
              Geen extra details beschikbaar.
            </p>
          )}
        </CardContent>
      </Card>

      <CommentThread parentType="TASK" parentId={task.id} />
    </div>
  );
}
