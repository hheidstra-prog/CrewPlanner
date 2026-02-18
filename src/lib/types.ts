import type { Event, Beschikbaarheid, Post, Comment, Task, TaskGroup, EventUitnodiging } from "@/generated/prisma";
import type { ResolvedUser } from "./users";

export type EventWithBeschikbaarheid = Event & {
  beschikbaarheid: Beschikbaarheid[];
  uitnodigingen: EventUitnodiging[];
};

export type EventWithDetails = EventWithBeschikbaarheid & {
  _count?: { beschikbaarheid: number };
};

export type PostWithAuteur = Post & {
  auteur?: ResolvedUser | null;
};

export type CommentWithAuteur = Comment & {
  auteur?: ResolvedUser | null;
};

export type TaskWithGroup = Task & {
  taskGroup: TaskGroup | null;
};

export type ActionResult = {
  success: boolean;
  error?: string;
};
