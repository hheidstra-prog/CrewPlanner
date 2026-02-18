"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Folder, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTaskGroup, deleteTaskGroup } from "@/lib/actions/tasks";
import { toast } from "sonner";
import type { TaskGroup } from "@/generated/prisma";

interface TaskGroupManagerProps {
  groups: (TaskGroup & { _count: { tasks: number } })[];
}

export function TaskGroupManager({ groups }: TaskGroupManagerProps) {
  const router = useRouter();

  const addAction = async (_prev: unknown, formData: FormData) => {
    const result = await createTaskGroup(formData);
    if (result.success) {
      toast.success("Groep aangemaakt");
      router.refresh();
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
    return result;
  };

  const [, formAction, isPending] = useActionState(addAction, null);

  const handleDelete = async (groupId: string, titel: string) => {
    if (!confirm(`Weet je zeker dat je groep "${titel}" wilt verwijderen? Taken in deze groep worden niet verwijderd.`)) {
      return;
    }
    const result = await deleteTaskGroup(groupId);
    if (result.success) {
      toast.success("Groep verwijderd");
      router.refresh();
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Folder className="h-5 w-5" />
          Taakgroepen
          <span className="font-mono text-sm font-normal text-muted-foreground">
            ({groups.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="flex gap-2">
          <Input
            name="titel"
            placeholder="Nieuwe groep..."
            required
            className="flex-1"
          />
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? "Toevoegen..." : "Toevoegen"}
          </Button>
        </form>

        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Nog geen taakgroepen. Maak er een aan om taken te organiseren.
          </p>
        ) : (
          <div className="space-y-1">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between rounded-lg p-2 hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium">{group.titel}</p>
                  <p className="text-xs text-muted-foreground">
                    {group._count.tasks} {group._count.tasks === 1 ? "taak" : "taken"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-niet-beschikbaar"
                  onClick={() => handleDelete(group.id, group.titel)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
