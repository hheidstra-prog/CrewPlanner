"use client";

import { useState } from "react";
import { Check, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { setAvailability } from "@/lib/actions/events";
import { cn } from "@/lib/utils";
import type { BeschikbaarheidStatus } from "@/generated/prisma";
import { toast } from "sonner";

interface AvailabilityButtonsProps {
  eventId: string;
  currentStatus?: BeschikbaarheidStatus;
  currentReden?: string | null;
}

export function AvailabilityButtons({
  eventId,
  currentStatus,
  currentReden,
}: AvailabilityButtonsProps) {
  const [selected, setSelected] = useState<BeschikbaarheidStatus | null>(
    currentStatus ?? null
  );
  const [showReden, setShowReden] = useState(
    currentStatus === "NIET_BESCHIKBAAR"
  );
  const [reden, setReden] = useState(currentReden ?? "");
  const [isPending, setIsPending] = useState(false);

  const handleSelect = async (status: BeschikbaarheidStatus) => {
    if (status === "NIET_BESCHIKBAAR") {
      setSelected(status);
      setShowReden(true);
      return;
    }

    setSelected(status);
    setShowReden(false);
    await submit(status);
  };

  const submit = async (status: BeschikbaarheidStatus, reason?: string) => {
    setIsPending(true);
    const formData = new FormData();
    formData.set("eventId", eventId);
    formData.set("status", status);
    if (reason) formData.set("reden", reason);

    const result = await setAvailability(formData);
    setIsPending(false);

    if (result.success) {
      toast.success("Beschikbaarheid opgeslagen");
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  const handleSubmitReden = async () => {
    if (!reden.trim()) {
      toast.error("Reden is verplicht bij 'niet beschikbaar'");
      return;
    }
    await submit("NIET_BESCHIKBAAR", reden);
  };

  const options = [
    {
      status: "BESCHIKBAAR" as const,
      label: "Beschikbaar",
      icon: Check,
      activeClass: "bg-beschikbaar text-white border-beschikbaar hover:bg-beschikbaar/90",
      inactiveClass: "border-beschikbaar/30 text-beschikbaar hover:bg-beschikbaar-light",
    },
    {
      status: "TWIJFEL" as const,
      label: "Twijfel",
      icon: HelpCircle,
      activeClass: "bg-twijfel text-white border-twijfel hover:bg-twijfel/90",
      inactiveClass: "border-twijfel/30 text-twijfel hover:bg-twijfel-light",
    },
    {
      status: "NIET_BESCHIKBAAR" as const,
      label: "Niet beschikbaar",
      icon: X,
      activeClass: "bg-niet-beschikbaar text-white border-niet-beschikbaar hover:bg-niet-beschikbaar/90",
      inactiveClass: "border-niet-beschikbaar/30 text-niet-beschikbaar hover:bg-niet-beschikbaar-light",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ status, label, icon: Icon, activeClass, inactiveClass }) => (
          <button
            key={status}
            type="button"
            disabled={isPending}
            onClick={() => handleSelect(status)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200",
              "min-h-[60px] cursor-pointer disabled:opacity-50",
              selected === status ? activeClass : inactiveClass
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs sm:text-sm">{label}</span>
          </button>
        ))}
      </div>
      {showReden && (
        <div className="space-y-2">
          <Textarea
            placeholder="Reden (verplicht)..."
            value={reden}
            onChange={(e) => setReden(e.target.value)}
            rows={2}
          />
          <Button
            size="sm"
            onClick={handleSubmitReden}
            disabled={isPending || !reden.trim()}
          >
            {isPending ? "Opslaan..." : "Bevestigen"}
          </Button>
        </div>
      )}
    </div>
  );
}
