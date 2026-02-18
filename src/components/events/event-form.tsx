"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { createEvent, updateEvent } from "@/lib/actions/events";
import type { Event, EventType, EventHerinnering } from "@/generated/prisma";
import { MemberPicker, type MemberOption } from "@/components/shared/member-picker";
import { toast } from "sonner";

interface EventFormProps {
  event?: Event & { herinneringen?: EventHerinnering[] };
  members?: MemberOption[];
  invitedUserIds?: string[];
}

function toDatetimeLocal(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getDefaultHerinnering(herinneringen?: EventHerinnering[]): string {
  if (!herinneringen || herinneringen.length === 0) return "geen";
  const dagen = herinneringen.map((h) => h.dagenVoorDeadline).sort((a, b) => a - b);
  return dagen.join(",");
}

const HERINNERING_OPTIONS = [
  { value: "geen", label: "Geen herinnering" },
  { value: "3", label: "3 dagen voor deadline" },
  { value: "5", label: "5 dagen voor deadline" },
  { value: "7", label: "7 dagen voor deadline" },
  { value: "3,7", label: "3 en 7 dagen voor deadline" },
];

export function EventForm({ event, members, invitedUserIds }: EventFormProps) {
  const router = useRouter();
  const isEditing = !!event;

  const action = async (_prev: unknown, formData: FormData) => {
    const result = isEditing
      ? await updateEvent(event.id, formData)
      : await createEvent(formData);

    if (result.success) {
      toast.success(isEditing ? "Evenement bijgewerkt" : "Evenement aangemaakt");
      router.push("/evenementen");
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
    return result;
  };

  const [, formAction, isPending] = useActionState(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Evenement bewerken" : "Nieuw evenement"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue={event?.type ?? "TRAINING"}>
              <SelectTrigger>
                <SelectValue placeholder="Kies type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {EVENT_TYPE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titel">Titel</Label>
            <Input
              id="titel"
              name="titel"
              defaultValue={event?.titel ?? ""}
              placeholder="Naam van het evenement"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beschrijving">Beschrijving</Label>
            <Textarea
              id="beschrijving"
              name="beschrijving"
              defaultValue={event?.beschrijving ?? ""}
              placeholder="Extra informatie over het evenement"
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="datum">Datum & tijd</Label>
              <Input
                id="datum"
                name="datum"
                type="datetime-local"
                defaultValue={toDatetimeLocal(event?.datum)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eindtijd">Eindtijd</Label>
              <Input
                id="eindtijd"
                name="eindtijd"
                type="datetime-local"
                defaultValue={toDatetimeLocal(event?.eindtijd)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locatie">Locatie</Label>
            <Input
              id="locatie"
              name="locatie"
              defaultValue={event?.locatie ?? ""}
              placeholder="Waar vindt het plaats?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadlineBeschikbaarheid">
              Deadline beschikbaarheid
            </Label>
            <Input
              id="deadlineBeschikbaarheid"
              name="deadlineBeschikbaarheid"
              type="datetime-local"
              defaultValue={toDatetimeLocal(event?.deadlineBeschikbaarheid)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="herinnering">Herinnering</Label>
            <Select
              name="herinnering"
              defaultValue={getDefaultHerinnering(event?.herinneringen)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Geen herinnering" />
              </SelectTrigger>
              <SelectContent>
                {HERINNERING_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {members && members.length > 0 && (
            <MemberPicker
              members={members}
              defaultSelectedIds={invitedUserIds}
            />
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Opslaan..."
                : isEditing
                  ? "Bijwerken"
                  : "Aanmaken"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuleren
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
