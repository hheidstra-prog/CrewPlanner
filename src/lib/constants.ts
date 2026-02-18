import type {
  EventType,
  BeschikbaarheidStatus,
  PostCategorie,
  TaskStatus,
  CommentParentType,
} from "@/generated/prisma";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  WEDSTRIJD: "Wedstrijd",
  TRAINING: "Training",
  ONDERHOUD: "Onderhoud",
  SOCIAAL: "Sociaal",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  WEDSTRIJD: "bg-ocean text-white",
  TRAINING: "bg-beschikbaar text-white",
  ONDERHOUD: "bg-twijfel text-white",
  SOCIAAL: "bg-navy text-white",
};

export const BESCHIKBAARHEID_LABELS: Record<BeschikbaarheidStatus, string> = {
  BESCHIKBAAR: "Beschikbaar",
  NIET_BESCHIKBAAR: "Niet beschikbaar",
  TWIJFEL: "Twijfel",
};

export const BESCHIKBAARHEID_COLORS: Record<BeschikbaarheidStatus, string> = {
  BESCHIKBAAR: "bg-beschikbaar-light text-beschikbaar border-beschikbaar",
  NIET_BESCHIKBAAR: "bg-niet-beschikbaar-light text-niet-beschikbaar border-niet-beschikbaar",
  TWIJFEL: "bg-twijfel-light text-twijfel border-twijfel",
};

export const POST_CATEGORIE_LABELS: Record<PostCategorie, string> = {
  WEDSTRIJDSCHEMA: "Wedstrijdschema",
  REGLEMENTEN: "Reglementen",
  BOOTINFO: "Bootinfo",
  ALGEMEEN: "Algemeen",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  OPEN: "Open",
  OPGEPAKT: "Opgepakt",
  AFGEROND: "Afgerond",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  OPEN: "bg-ocean-light text-ocean",
  OPGEPAKT: "bg-twijfel-light text-twijfel",
  AFGEROND: "bg-beschikbaar-light text-beschikbaar",
};

export const COMMENT_PARENT_LABELS: Record<CommentParentType, string> = {
  EVENT: "Evenement",
  POST: "Bericht",
  TASK: "Taak",
};
