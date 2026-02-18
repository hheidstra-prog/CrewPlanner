"use client";

import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllAsRead } from "@/lib/actions/notifications";
import { toast } from "sonner";

export function MarkAllReadButton() {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    setIsPending(true);
    const result = await markAllAsRead();
    setIsPending(false);
    if (result.success) {
      toast.success("Alles als gelezen gemarkeerd");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      <CheckCheck className="mr-1.5 h-4 w-4" />
      Alles gelezen
    </Button>
  );
}
