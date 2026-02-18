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
import { createTask } from "@/lib/actions/tasks";
import type { TaskGroup } from "@/generated/prisma";
import { toast } from "sonner";

interface MemberOption {
  id: string;
  fullName: string;
}

interface TaskFormProps {
  taskGroups: TaskGroup[];
  members?: MemberOption[];
}

export function TaskForm({ taskGroups, members }: TaskFormProps) {
  const router = useRouter();

  const action = async (_prev: unknown, formData: FormData) => {
    const result = await createTask(formData);
    if (result.success) {
      toast.success("Taak aangemaakt");
      router.push("/taken");
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
    return result;
  };

  const [, formAction, isPending] = useActionState(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nieuwe taak</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titel">Titel</Label>
            <Input
              id="titel"
              name="titel"
              placeholder="Wat moet er gedaan worden?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beschrijving">Beschrijving</Label>
            <Textarea
              id="beschrijving"
              name="beschrijving"
              placeholder="Extra details..."
              rows={4}
            />
          </div>

          {taskGroups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="taskGroupId">Groep (optioneel)</Label>
              <Select name="taskGroupId">
                <SelectTrigger>
                  <SelectValue placeholder="Geen groep" />
                </SelectTrigger>
                <SelectContent>
                  {taskGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.titel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (optioneel)</Label>
            <Input id="deadline" name="deadline" type="datetime-local" />
          </div>

          {members && members.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="toegewezenAan">Toewijzen aan (optioneel)</Label>
              <Select name="toegewezenAan">
                <SelectTrigger>
                  <SelectValue placeholder="Niemand" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Aanmaken..." : "Taak aanmaken"}
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
