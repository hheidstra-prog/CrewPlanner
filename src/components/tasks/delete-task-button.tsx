"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteTask } from "@/lib/actions/tasks";
import { toast } from "sonner";

interface DeleteTaskButtonProps {
  taskId: string;
}

export function DeleteTaskButton({ taskId }: DeleteTaskButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteTask(taskId);
    setLoading(false);

    if (result.success) {
      toast.success("Taak verwijderd");
      router.push("/taken");
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Taak verwijderen"
        description="Weet je zeker dat je deze taak wilt verwijderen?"
        confirmLabel="Verwijderen"
        variant="destructive"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}
