"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

export type AvailabilityMember = {
  userId: string;
  fullName: string;
  initials: string;
  imageUrl: string;
  status: "BESCHIKBAAR" | "TWIJFEL" | "NIET_BESCHIKBAAR";
  reden?: string | null;
};

export type NonResponder = {
  userId: string;
  fullName: string;
  initials: string;
  imageUrl: string;
};

interface ExpandableAvailabilityProps {
  members: AvailabilityMember[];
  nonResponders: NonResponder[];
}

const statusConfig = [
  { status: "BESCHIKBAAR" as const, label: "Beschikbaar", color: "text-beschikbaar" },
  { status: "TWIJFEL" as const, label: "Twijfel", color: "text-twijfel" },
  { status: "NIET_BESCHIKBAAR" as const, label: "Niet beschikbaar", color: "text-niet-beschikbaar" },
];

export function ExpandableAvailability({ members, nonResponders }: ExpandableAvailabilityProps) {
  const [expanded, setExpanded] = useState(false);
  const totalPeople = members.length + nonResponders.length;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        className={cn(
          "mt-1 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
          expanded
            ? "border-primary/30 bg-primary/5 text-primary"
            : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Users className="h-3.5 w-3.5" />
        {expanded ? "Verberg details" : `Wie komt er? (${totalPeople})`}
        <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div onClick={handleContentClick} className="mt-2 space-y-2 border-t pt-2">
          {statusConfig.map(({ status, label, color }) => {
            const items = members.filter((m) => m.status === status);
            if (items.length === 0) return null;

            return (
              <div key={status}>
                <p className={cn("text-xs font-semibold mb-1", color)}>
                  {label} ({items.length})
                </p>
                <div className="space-y-1">
                  {items.map((m) => (
                    <div key={m.userId} className="flex items-center gap-1.5 text-xs">
                      <UserAvatar imageUrl={m.imageUrl} initials={m.initials} fullName={m.fullName} size="sm" />
                      <span>{m.fullName}</span>
                      {m.reden && <span className="text-muted-foreground">— {m.reden}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {nonResponders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Niet gereageerd ({nonResponders.length})
              </p>
              <div className="space-y-1">
                {nonResponders.map((m) => (
                  <div key={m.userId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserAvatar imageUrl={m.imageUrl} initials={m.initials} fullName={m.fullName} size="sm" />
                    <span>{m.fullName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
