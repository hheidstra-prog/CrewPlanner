"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment } from "@/lib/actions/comments";
import type { CommentParentType } from "@/generated/prisma";
import { toast } from "sonner";

interface CommentFormProps {
  parentType: CommentParentType;
  parentId: string;
}

export function CommentForm({ parentType, parentId }: CommentFormProps) {
  const [inhoud, setInhoud] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inhoud.trim()) return;

    setIsPending(true);
    const formData = new FormData();
    formData.set("parentType", parentType);
    formData.set("parentId", parentId);
    formData.set("inhoud", inhoud);

    const result = await addComment(formData);
    setIsPending(false);

    if (result.success) {
      setInhoud("");
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={inhoud}
        onChange={(e) => setInhoud(e.target.value)}
        placeholder="Schrijf een reactie..."
        rows={2}
        className="flex-1 resize-none"
      />
      <Button
        type="submit"
        size="sm"
        disabled={isPending || !inhoud.trim()}
        className="self-end"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
