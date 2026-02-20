"use client";

import { useActionState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createTeamMember } from "@/lib/actions/users";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/types";

export function AddMemberForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const prevResult = useRef<ActionResult | null>(null);

  const addAction = async (_prev: unknown, formData: FormData) => {
    const result = await createTeamMember(null, formData);
    return result;
  };

  const [state, formAction, isPending] = useActionState(addAction, null);

  useEffect(() => {
    if (!state || state === prevResult.current) return;
    prevResult.current = state;

    if (state.success) {
      toast.success("Lid toegevoegd");
      formRef.current?.reset();
      router.refresh();
    } else {
      toast.error(state.error ?? "Er ging iets mis");
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Input
          name="voornaam"
          placeholder="Voornaam"
          required
          className="flex-1 min-w-[120px]"
        />
        <Input
          name="achternaam"
          placeholder="Achternaam"
          required
          className="flex-1 min-w-[120px]"
        />
        <Input
          name="email"
          type="email"
          placeholder="E-mailadres"
          required
          className="flex-1 min-w-[180px]"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Input
          name="straat"
          placeholder="Straat + huisnummer"
          className="flex-1 min-w-[160px]"
        />
        <Input
          name="postcode"
          placeholder="Postcode"
          className="w-[100px]"
        />
        <Input
          name="woonplaats"
          placeholder="Woonplaats"
          className="flex-1 min-w-[120px]"
        />
      </div>
      <div className="flex gap-4 items-end flex-wrap">
        <div className="space-y-1">
          <Label htmlFor="geboortedatum">Geboortedatum</Label>
          <Input
            id="geboortedatum"
            name="geboortedatum"
            type="date"
            className="w-[160px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="isTeamManager" name="isTeamManager" value="on" />
          <Label htmlFor="isTeamManager" className="text-sm">Team manager</Label>
        </div>
        <Button type="submit" disabled={isPending} size="sm">
          <UserPlus className="h-4 w-4 mr-1" />
          {isPending ? "Toevoegen..." : "Toevoegen"}
        </Button>
      </div>
    </form>
  );
}
