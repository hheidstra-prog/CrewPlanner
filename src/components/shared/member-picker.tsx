"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Users } from "lucide-react";
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
  const [selectAll, setSelectAll] = useState(
    !defaultSelectedIds || defaultSelectedIds.length === 0 || defaultSelectedIds.length === members.length
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(defaultSelectedIds && defaultSelectedIds.length > 0 && defaultSelectedIds.length < members.length ? defaultSelectedIds : allIds)
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

  const handleSelectAllToggle = () => {
    if (selectAll) {
      // Switch to manual selection, keep all selected
      setSelectAll(false);
    } else {
      // Switch back to all
      setSelectAll(true);
      setSelectedIds(new Set(allIds));
    }
  };

  // Hidden input value: empty string for "all", comma-separated IDs for specific
  const hiddenValue = selectAll ? "" : Array.from(selectedIds).join(",");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Uitgenodigde leden</Label>
        <Button
          type="button"
          variant={selectAll ? "default" : "outline"}
          size="sm"
          onClick={handleSelectAllToggle}
        >
          <Users className="mr-1.5 h-3.5 w-3.5" />
          {selectAll ? "Alle leden" : `${selectedIds.size} van ${members.length}`}
        </Button>
      </div>

      <input type="hidden" name={name} value={hiddenValue} />

      {!selectAll && (
        <div className="grid gap-1.5 max-h-60 overflow-y-auto rounded-md border p-2">
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
      )}
    </div>
  );
}
