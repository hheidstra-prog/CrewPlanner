"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/users";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/types";

interface ProfileFormProps {
  teamLid: {
    voornaam: string;
    achternaam: string;
    email: string;
    straat: string | null;
    postcode: string | null;
    woonplaats: string | null;
    geboortedatum: Date | null;
  };
}

export function ProfileForm({ teamLid }: ProfileFormProps) {
  const prevResult = useRef<ActionResult | null>(null);

  const [state, formAction, isPending] = useActionState(updateProfile, null);

  useEffect(() => {
    if (!state || state === prevResult.current) return;
    prevResult.current = state;

    if (state.success) {
      toast.success("Profiel bijgewerkt");
    } else {
      toast.error(state.error ?? "Er ging iets mis");
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="voornaam">Voornaam</Label>
          <Input
            id="voornaam"
            name="voornaam"
            defaultValue={teamLid.voornaam}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="achternaam">Achternaam</Label>
          <Input
            id="achternaam"
            name="achternaam"
            defaultValue={teamLid.achternaam}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={teamLid.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          E-mailadres kan alleen door een beheerder gewijzigd worden.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="straat">Straat + huisnummer</Label>
        <Input
          id="straat"
          name="straat"
          defaultValue={teamLid.straat ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            name="postcode"
            defaultValue={teamLid.postcode ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="woonplaats">Woonplaats</Label>
          <Input
            id="woonplaats"
            name="woonplaats"
            defaultValue={teamLid.woonplaats ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="geboortedatum">Geboortedatum</Label>
        <Input
          id="geboortedatum"
          name="geboortedatum"
          type="date"
          defaultValue={
            teamLid.geboortedatum
              ? teamLid.geboortedatum.toISOString().split("T")[0]
              : ""
          }
          className="w-[180px]"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Opslaan..." : "Opslaan"}
      </Button>
    </form>
  );
}
