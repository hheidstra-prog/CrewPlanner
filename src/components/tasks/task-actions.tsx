"use client";

import { useState } from "react";
import { Hand, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { claimTask, completeTask } from "@/lib/actions/tasks";
import type { Task } from "@/generated/prisma";
import { toast } from "sonner";

interface TaskActionsProps {
  task: Task;
  currentUserId: string;
}

export function TaskActions({ task, currentUserId }: TaskActionsProps) {
  const [isPending, setIsPending] = useState(false);

  const handleClaim = async () => {
    setIsPending(true);
    const result = await claimTask(task.id);
    setIsPending(false);
    if (result.success) {
      toast.success("Taak opgepakt!");
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  const handleComplete = async () => {
    setIsPending(true);
    const result = await completeTask(task.id);
    setIsPending(false);
    if (result.success) {
      toast.success("Taak afgerond!");
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  if (task.status === "OPEN") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleClaim}
        disabled={isPending}
        className="text-ocean border-ocean hover:bg-ocean-light"
      >
        <Hand className="mr-1 h-3.5 w-3.5" />
        Oppakken
      </Button>
    );
  }

  if (task.status === "OPGEPAKT" && task.geclaimdDoor === currentUserId) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleComplete}
        disabled={isPending}
        className="text-beschikbaar border-beschikbaar hover:bg-beschikbaar-light"
      >
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        Afronden
      </Button>
    );
  }

  return null;
}
