"use client";

import { useState } from "react";
import { CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllAsRead, clearReadNotifications } from "@/lib/actions/notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InboxToolbarProps {
  hasUnread: boolean;
  hasRead: boolean;
  onFilterChange: (filter: "ongelezen" | "alle") => void;
  filter: "ongelezen" | "alle";
}

export function InboxToolbar({ hasUnread, hasRead, onFilterChange, filter }: InboxToolbarProps) {
  const [isPendingRead, setIsPendingRead] = useState(false);
  const [isPendingClear, setIsPendingClear] = useState(false);

  const handleMarkAllRead = async () => {
    setIsPendingRead(true);
    const result = await markAllAsRead();
    setIsPendingRead(false);
    if (result.success) {
      toast.success("Alles als gelezen gemarkeerd");
    }
  };

  const handleClearRead = async () => {
    setIsPendingClear(true);
    const result = await clearReadNotifications();
    setIsPendingClear(false);
    if (result.success) {
      toast.success("Gelezen meldingen verwijderd");
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
        <button
          onClick={() => onFilterChange("ongelezen")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            filter === "ongelezen"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Ongelezen
        </button>
        <button
          onClick={() => onFilterChange("alle")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            filter === "alle"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Alle
        </button>
      </div>

      <div className="flex items-center gap-2">
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPendingRead}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Alles gelezen
          </Button>
        )}
        {hasRead && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearRead}
            disabled={isPendingClear}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Wis gelezen
          </Button>
        )}
      </div>
    </div>
  );
}
