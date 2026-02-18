"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteEvent } from "@/lib/actions/events";
import { toast } from "sonner";

interface DeleteEventButtonProps {
  eventId: string;
}

export function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteEvent(eventId);
    setLoading(false);

    if (result.success) {
      toast.success("Evenement verwijderd");
      router.push("/evenementen");
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
        title="Evenement verwijderen"
        description="Weet je zeker dat je dit evenement wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
        confirmLabel="Verwijderen"
        variant="destructive"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}
