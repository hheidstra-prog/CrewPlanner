"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MemberOption {
  id: string;
  fullName: string;
  initials: string;
  imageUrl: string;
}

interface MemberPickerProps {
  members: MemberOption[];
  defaultSelectedIds?: string[];
  name?: string;
}

export function MemberPicker({
  members,
  defaultSelectedIds,
  name = "uitgenodigden",
}: MemberPickerProps) {
  const allIds = members.map((m) => m.id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(
      defaultSelectedIds && defaultSelectedIds.length > 0
        ? defaultSelectedIds
        : allIds
    )
  );

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const hiddenValue = Array.from(selectedIds).join(",");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Uitgenodigde leden</Label>
        <span className="text-sm text-muted-foreground">
          {selectedIds.size} van {members.length}
        </span>
      </div>

      <input type="hidden" name={name} value={hiddenValue} />

      <div className="grid gap-1.5 max-h-60 overflow-y-auto rounded-md border p-2">
        <button
          type="button"
          onClick={() =>
            setSelectedIds(
              selectedIds.size === members.length ? new Set() : new Set(allIds)
            )
          }
          className="text-xs text-muted-foreground hover:text-foreground text-left px-2 py-1"
        >
          {selectedIds.size === members.length
            ? "Deselecteer alle"
            : "Selecteer alle"}
        </button>
        {members.map((member) => {
          const isSelected = selectedIds.has(member.id);
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => toggleMember(member.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors text-left",
                isSelected
                  ? "bg-ocean/10 text-ocean"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <UserAvatar
                imageUrl={member.imageUrl}
                initials={member.initials}
                fullName={member.fullName}
                size="sm"
              />
              <span className="flex-1">{member.fullName}</span>
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
