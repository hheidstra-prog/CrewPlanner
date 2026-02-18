"use client";

import { X } from "lucide-react";
import { deleteComment } from "@/lib/actions/comments";
import { toast } from "sonner";

interface DeleteCommentButtonProps {
  commentId: string;
}

export function DeleteCommentButton({ commentId }: DeleteCommentButtonProps) {
  const handleDelete = async () => {
    const result = await deleteComment(commentId);
    if (!result.success) {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-muted-foreground hover:text-destructive transition-colors"
      title="Verwijderen"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
