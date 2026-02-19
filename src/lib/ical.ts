import type { Event, EventType } from "@/generated/prisma";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { APP_URL } from "@/lib/email";

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  const maxLen = 75;
  if (line.length <= maxLen) return line;
  const parts: string[] = [];
  parts.push(line.slice(0, maxLen));
  let pos = maxLen;
  while (pos < line.length) {
    parts.push(" " + line.slice(pos, pos + maxLen - 1));
    pos += maxLen - 1;
  }
  return parts.join("\r\n");
}

type CalendarEvent = Pick<
  Event,
  "id" | "type" | "titel" | "beschrijving" | "datum" | "eindtijd" | "locatie" | "createdAt"
>;

export function generateICalFeed(events: CalendarEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CrewPlanner//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:CrewPlanner",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const event of events) {
    const dtStart = formatICalDate(new Date(event.datum));

    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${event.id}@crew-planner.vercel.app`));
    lines.push(foldLine(`DTSTAMP:${formatICalDate(new Date(event.createdAt))}`));
    lines.push(foldLine(`DTSTART:${dtStart}`));

    if (event.eindtijd) {
      lines.push(foldLine(`DTEND:${formatICalDate(new Date(event.eindtijd))}`));
    }

    lines.push(foldLine(`SUMMARY:${escapeICalText(event.titel)}`));

    if (event.beschrijving) {
      lines.push(foldLine(`DESCRIPTION:${escapeICalText(event.beschrijving)}`));
    }

    if (event.locatie) {
      lines.push(foldLine(`LOCATION:${escapeICalText(event.locatie)}`));
    }

    lines.push(foldLine(`URL:${APP_URL}/evenementen/${event.id}`));
    lines.push(foldLine(`CATEGORIES:${EVENT_TYPE_LABELS[event.type as EventType]}`));
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}
