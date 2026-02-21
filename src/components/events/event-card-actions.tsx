"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteEvent } from "@/lib/actions/events";
import { toast } from "sonner";

export function EventCardActions({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteEvent(eventId);
    setDeleting(false);
    if (result.success) {
      toast.success("Evenement verwijderd");
      setShowDelete(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/evenementen/${eventId}/bewerken`);
          }}
          title="Bewerken"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDelete(true);
          }}
          title="Verwijderen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Evenement verwijderen"
        description="Weet je zeker dat je dit evenement wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
        confirmLabel="Verwijderen"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
