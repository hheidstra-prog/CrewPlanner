import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveUsers, resolveUser } from "@/lib/users";
import {
  EVENT_TYPE_LABELS,
  BESCHIKBAARHEID_LABELS,
  TASK_STATUS_LABELS,
  POST_CATEGORIE_LABELS,
} from "@/lib/constants";
import { formatDatum, formatTijd, relatieveDatum } from "@/lib/utils";
import { getUpcomingEvents } from "@/lib/queries/events";
import { getEventById } from "@/lib/queries/events";
import { getEventsNeedingResponse } from "@/lib/queries/events";
import { getTasks, getTaskById, getTaskGroups } from "@/lib/queries/tasks";
import { getPosts, getPostById, getRecentPosts } from "@/lib/queries/posts";
import { getComments } from "@/lib/queries/comments";
import { getOpenTasks } from "@/lib/queries/tasks";
import { getTaskCompletionStats } from "@/lib/queries/stats";
import { setAvailability } from "@/lib/actions/events";
import { claimTask, completeTask } from "@/lib/actions/tasks";
import { addComment } from "@/lib/actions/comments";
import type { EventType, TaskStatus, BeschikbaarheidStatus } from "@/generated/prisma";

export function createTools(userId: string, isUserAdmin: boolean) {
  return {
    getUpcomingEvents: tool({
      description:
        "Haal aankomende evenementen op. Optioneel filter op type (WEDSTRIJD, TRAINING, ONDERHOUD, SOCIAAL).",
      inputSchema: z.object({
        type: z
          .enum(["WEDSTRIJD", "TRAINING", "ONDERHOUD", "SOCIAAL"])
          .optional()
          .describe("Filter op evenement type"),
      }),
      execute: async ({ type }) => {
        const events = await getUpcomingEvents(type as EventType | undefined);

        // Filter to user's invited events unless admin
        const filtered = isUserAdmin
          ? events
          : events.filter((e) =>
              e.uitnodigingen.some((u) => u.userId === userId)
            );

        return filtered.map((e) => ({
          id: e.id,
          titel: e.titel,
          type: EVENT_TYPE_LABELS[e.type],
          datum: formatDatum(e.datum),
          datumRelatief: relatieveDatum(e.datum),
          tijd: formatTijd(e.datum),
          eindtijd: e.eindtijd ? formatTijd(e.eindtijd) : null,
          locatie: e.locatie,
          aantalBeschikbaar: e.beschikbaarheid.filter(
            (b) => b.status === "BESCHIKBAAR"
          ).length,
          aantalNietBeschikbaar: e.beschikbaarheid.filter(
            (b) => b.status === "NIET_BESCHIKBAAR"
          ).length,
          aantalTwijfel: e.beschikbaarheid.filter(
            (b) => b.status === "TWIJFEL"
          ).length,
          aantalUitgenodigd: e.uitnodigingen.length,
          aantalGereageerd: e.beschikbaarheid.length,
        }));
      },
    }),

    getEventDetails: tool({
      description:
        "Haal volledige details op van een specifiek evenement, inclusief wie er beschikbaar is en wie nog niet gereageerd heeft.",
      inputSchema: z.object({
        eventId: z.string().describe("Het ID van het evenement"),
      }),
      execute: async ({ eventId }) => {
        const event = await getEventById(eventId);
        if (!event) return { error: "Evenement niet gevonden" };

        const allUserIds = [
          ...event.beschikbaarheid.map((b) => b.userId),
          ...event.uitnodigingen.map((u) => u.userId),
        ];
        const users = await resolveUsers([...new Set(allUserIds)]);

        const beschikbaarheid = event.beschikbaarheid.map((b) => ({
          naam: users.get(b.userId)?.fullName ?? "Onbekend",
          status: BESCHIKBAARHEID_LABELS[b.status],
          reden: b.reden,
        }));

        const respondedUserIds = new Set(
          event.beschikbaarheid.map((b) => b.userId)
        );
        const nietGereageerd = event.uitnodigingen
          .filter((u) => !respondedUserIds.has(u.userId))
          .map((u) => users.get(u.userId)?.fullName ?? "Onbekend");

        return {
          id: event.id,
          titel: event.titel,
          type: EVENT_TYPE_LABELS[event.type],
          beschrijving: event.beschrijving,
          datum: formatDatum(event.datum),
          datumRelatief: relatieveDatum(event.datum),
          tijd: formatTijd(event.datum),
          eindtijd: event.eindtijd ? formatTijd(event.eindtijd) : null,
          locatie: event.locatie,
          deadline: event.deadlineBeschikbaarheid
            ? formatDatum(event.deadlineBeschikbaarheid)
            : null,
          beschikbaarheid,
          nietGereageerd,
          aantalUitgenodigd: event.uitnodigingen.length,
        };
      },
    }),

    getMyPendingEvents: tool({
      description:
        "Haal evenementen op waar de huidige gebruiker nog niet op gereageerd heeft.",
      inputSchema: z.object({}),
      execute: async () => {
        const events = await getEventsNeedingResponse(userId);
        return events.map((e) => ({
          id: e.id,
          titel: e.titel,
          type: EVENT_TYPE_LABELS[e.type],
          datum: formatDatum(e.datum),
          datumRelatief: relatieveDatum(e.datum),
          tijd: formatTijd(e.datum),
          locatie: e.locatie,
        }));
      },
    }),

    getTasks: tool({
      description:
        "Haal taken op, optioneel gefilterd op status (OPEN, OPGEPAKT, AFGEROND).",
      inputSchema: z.object({
        status: z
          .enum(["OPEN", "OPGEPAKT", "AFGEROND"])
          .optional()
          .describe("Filter op taakstatus"),
      }),
      execute: async ({ status }) => {
        const tasks = await getTasks(status as TaskStatus | undefined);

        const assigneeIds = tasks
          .map((t) => t.toegewezenAan ?? t.geclaimdDoor)
          .filter((id): id is string => id !== null);
        const users = await resolveUsers(assigneeIds);

        return tasks.map((t) => {
          const assignee = t.toegewezenAan ?? t.geclaimdDoor;
          return {
            id: t.id,
            titel: t.titel,
            status: TASK_STATUS_LABELS[t.status],
            groep: t.taskGroup?.titel ?? null,
            toegewezen: assignee
              ? users.get(assignee)?.fullName ?? "Onbekend"
              : null,
            deadline: t.deadline ? formatDatum(t.deadline) : null,
          };
        });
      },
    }),

    getTaskDetails: tool({
      description: "Haal volledige details van een specifieke taak op.",
      inputSchema: z.object({
        taskId: z.string().describe("Het ID van de taak"),
      }),
      execute: async ({ taskId }) => {
        const task = await getTaskById(taskId);
        if (!task) return { error: "Taak niet gevonden" };

        const userIds = [task.toegewezenAan, task.geclaimdDoor].filter(
          (id): id is string => id !== null
        );
        const users = await resolveUsers(userIds);

        return {
          id: task.id,
          titel: task.titel,
          beschrijving: task.beschrijving,
          status: TASK_STATUS_LABELS[task.status],
          groep: task.taskGroup?.titel ?? null,
          toegewezen: task.toegewezenAan
            ? users.get(task.toegewezenAan)?.fullName ?? "Onbekend"
            : null,
          geclaimdDoor: task.geclaimdDoor
            ? users.get(task.geclaimdDoor)?.fullName ?? "Onbekend"
            : null,
          deadline: task.deadline ? formatDatum(task.deadline) : null,
          afgerondOp: task.afgerondOp ? formatDatum(task.afgerondOp) : null,
        };
      },
    }),

    getPosts: tool({
      description:
        "Haal berichten/posts op uit het informatiecentrum. Optioneel filter op categorie of zoekterm.",
      inputSchema: z.object({
        categorie: z
          .enum(["WEDSTRIJDSCHEMA", "REGLEMENTEN", "BOOTINFO", "ALGEMEEN"])
          .optional()
          .describe("Filter op categorie"),
        search: z.string().optional().describe("Zoekterm"),
      }),
      execute: async ({ categorie, search }) => {
        const posts = await getPosts(
          categorie as import("@/generated/prisma").PostCategorie | undefined,
          search
        );
        return posts.map((p) => ({
          id: p.id,
          titel: p.titel,
          categorie: POST_CATEGORIE_LABELS[p.categorie],
          samenvatting: p.inhoud.replace(/<[^>]*>/g, "").slice(0, 200),
          gepind: p.gepind,
          datum: formatDatum(p.createdAt),
          datumRelatief: relatieveDatum(p.createdAt),
        }));
      },
    }),

    getPostDetails: tool({
      description:
        "Haal volledige details van een specifiek bericht op, inclusief reacties.",
      inputSchema: z.object({
        postId: z.string().describe("Het ID van het bericht"),
      }),
      execute: async ({ postId }) => {
        const [post, comments] = await Promise.all([
          getPostById(postId),
          getComments("POST", postId),
        ]);
        if (!post) return { error: "Bericht niet gevonden" };

        const userIds = [post.auteurId, ...comments.map((c) => c.auteurId)];
        const users = await resolveUsers([...new Set(userIds)]);

        return {
          id: post.id,
          titel: post.titel,
          categorie: POST_CATEGORIE_LABELS[post.categorie],
          inhoud: post.inhoud.replace(/<[^>]*>/g, ""),
          auteur: users.get(post.auteurId)?.fullName ?? "Onbekend",
          gepind: post.gepind,
          datum: formatDatum(post.createdAt),
          bestanden: post.files.map((f) => f.fileName),
          reacties: comments.map((c) => ({
            auteur: users.get(c.auteurId)?.fullName ?? "Onbekend",
            inhoud: c.inhoud,
            datum: relatieveDatum(c.createdAt),
          })),
        };
      },
    }),

    getComments: tool({
      description: "Haal reacties op voor een evenement, bericht of taak.",
      inputSchema: z.object({
        parentType: z
          .enum(["EVENT", "POST", "TASK"])
          .describe("Type van het item"),
        parentId: z.string().describe("Het ID van het item"),
      }),
      execute: async ({ parentType, parentId }) => {
        const comments = await getComments(
          parentType as import("@/generated/prisma").CommentParentType,
          parentId
        );
        const users = await resolveUsers(comments.map((c) => c.auteurId));

        return comments.map((c) => ({
          auteur: users.get(c.auteurId)?.fullName ?? "Onbekend",
          inhoud: c.inhoud,
          datum: relatieveDatum(c.createdAt),
        }));
      },
    }),

    getTaskGroups: tool({
      description: "Haal taakgroepen op met hun taken.",
      inputSchema: z.object({}),
      execute: async () => {
        const groups = await getTaskGroups();
        return groups.map((g) => ({
          id: g.id,
          titel: g.titel,
          totaalTaken: g.tasks.length,
          openTaken: g.tasks.filter((t) => t.status === "OPEN").length,
          afgerondeTaken: g.tasks.filter((t) => t.status === "AFGEROND").length,
        }));
      },
    }),

    getTeamMembers: tool({
      description: "Haal de lijst van teamleden op met naam, email en rol.",
      inputSchema: z.object({}),
      execute: async () => {
        const teamLeden = await prisma.teamLid.findMany({
          orderBy: { voornaam: "asc" },
        });
        return teamLeden.map((tl) => ({
          id: tl.clerkUserId,
          naam: [tl.voornaam, tl.achternaam].filter(Boolean).join(" ") || "Onbekend",
          email: tl.email,
          rol: tl.isTeamManager ? "admin" : "member",
        }));
      },
    }),

    getMySummary: tool({
      description:
        "Geef een samenvatting van wat de gebruiker gemist heeft: openstaande evenementen, recente berichten, en open taken.",
      inputSchema: z.object({}),
      execute: async () => {
        const [pendingEvents, recentPosts, openTasks] = await Promise.all([
          getEventsNeedingResponse(userId),
          getRecentPosts(5),
          getOpenTasks(5),
        ]);

        return {
          openstaandeEvenementen: pendingEvents.map((e) => ({
            id: e.id,
            titel: e.titel,
            type: EVENT_TYPE_LABELS[e.type],
            datum: formatDatum(e.datum),
            datumRelatief: relatieveDatum(e.datum),
          })),
          recenteBerichten: recentPosts.map((p) => ({
            id: p.id,
            titel: p.titel,
            categorie: POST_CATEGORIE_LABELS[p.categorie],
            datum: relatieveDatum(p.createdAt),
          })),
          openTaken: openTasks.map((t) => ({
            id: t.id,
            titel: t.titel,
            groep: t.taskGroup?.titel ?? null,
          })),
        };
      },
    }),

    searchAll: tool({
      description:
        "Zoek door evenementen, berichten en taken op basis van een zoekterm.",
      inputSchema: z.object({
        term: z.string().describe("De zoekterm"),
      }),
      execute: async ({ term }) => {
        const [posts, events, tasks] = await Promise.all([
          getPosts(undefined, term),
          prisma.event.findMany({
            where: {
              OR: [
                { titel: { contains: term, mode: "insensitive" } },
                { beschrijving: { contains: term, mode: "insensitive" } },
                { locatie: { contains: term, mode: "insensitive" } },
              ],
            },
            orderBy: { datum: "desc" },
            take: 10,
          }),
          prisma.task.findMany({
            where: {
              OR: [
                { titel: { contains: term, mode: "insensitive" } },
                { beschrijving: { contains: term, mode: "insensitive" } },
              ],
            },
            include: { taskGroup: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
        ]);

        return {
          evenementen: events.map((e) => ({
            id: e.id,
            titel: e.titel,
            type: EVENT_TYPE_LABELS[e.type],
            datum: formatDatum(e.datum),
          })),
          berichten: posts.slice(0, 10).map((p) => ({
            id: p.id,
            titel: p.titel,
            categorie: POST_CATEGORIE_LABELS[p.categorie],
          })),
          taken: tasks.map((t) => ({
            id: t.id,
            titel: t.titel,
            status: TASK_STATUS_LABELS[t.status],
            groep: t.taskGroup?.titel ?? null,
          })),
        };
      },
    }),

    getContributionStats: tool({
      description:
        "Haal statistieken op van afgeronde taken per teamlid. Alleen beschikbaar voor admins.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!isUserAdmin) {
          return { error: "Alleen beheerders kunnen statistieken bekijken" };
        }
        const stats = await getTaskCompletionStats();
        const users = await resolveUsers(stats.map((s) => s.userId));

        return stats.map((s) => ({
          naam: users.get(s.userId)?.fullName ?? "Onbekend",
          afgerondeTaken: s.afgerond,
        }));
      },
    }),

    // ── Write tools ──

    setMyAvailability: tool({
      description:
        "Stel de beschikbaarheid in van de huidige gebruiker voor een evenement. Vraag ALTIJD eerst bevestiging aan de gebruiker voordat je deze actie uitvoert. Bij NIET_BESCHIKBAAR is een reden verplicht.",
      inputSchema: z.object({
        eventId: z.string().describe("Het ID van het evenement"),
        status: z
          .enum(["BESCHIKBAAR", "NIET_BESCHIKBAAR", "TWIJFEL"])
          .describe("De beschikbaarheidsstatus"),
        reden: z
          .string()
          .optional()
          .describe(
            "Reden (verplicht bij NIET_BESCHIKBAAR)"
          ),
      }),
      execute: async ({ eventId, status, reden }) => {
        const formData = new FormData();
        formData.set("eventId", eventId);
        formData.set("status", status);
        if (reden) formData.set("reden", reden);

        const result = await setAvailability(formData);
        if (!result.success) return { error: result.error };

        const statusLabel =
          BESCHIKBAARHEID_LABELS[status as BeschikbaarheidStatus];
        return {
          success: true,
          message: `Je bent nu als "${statusLabel}" geregistreerd.`,
        };
      },
    }),

    claimTask: tool({
      description:
        "Pak een open taak op namens de huidige gebruiker. Vraag ALTIJD eerst bevestiging aan de gebruiker voordat je deze actie uitvoert.",
      inputSchema: z.object({
        taskId: z.string().describe("Het ID van de taak"),
      }),
      execute: async ({ taskId }) => {
        const result = await claimTask(taskId);
        if (!result.success) return { error: result.error };
        return { success: true, message: "Je hebt de taak opgepakt!" };
      },
    }),

    completeTask: tool({
      description:
        "Rond een taak af. Vraag ALTIJD eerst bevestiging aan de gebruiker voordat je deze actie uitvoert.",
      inputSchema: z.object({
        taskId: z.string().describe("Het ID van de taak"),
      }),
      execute: async ({ taskId }) => {
        const result = await completeTask(taskId);
        if (!result.success) return { error: result.error };
        return { success: true, message: "De taak is afgerond!" };
      },
    }),

    addComment: tool({
      description:
        "Plaats een reactie op een evenement, bericht of taak namens de huidige gebruiker. Vraag ALTIJD eerst bevestiging aan de gebruiker voordat je deze actie uitvoert.",
      inputSchema: z.object({
        parentType: z
          .enum(["EVENT", "POST", "TASK"])
          .describe("Type van het item"),
        parentId: z.string().describe("Het ID van het item"),
        inhoud: z.string().describe("De tekst van de reactie"),
      }),
      execute: async ({ parentType, parentId, inhoud }) => {
        const formData = new FormData();
        formData.set("parentType", parentType);
        formData.set("parentId", parentId);
        formData.set("inhoud", inhoud);

        const result = await addComment(formData);
        if (!result.success) return { error: result.error };
        return { success: true, message: "Reactie geplaatst!" };
      },
    }),
  };
}
