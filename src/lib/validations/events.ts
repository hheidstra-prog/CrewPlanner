import { z } from "zod";

export const eventSchema = z.object({
  type: z.enum(["WEDSTRIJD", "TRAINING", "ONDERHOUD", "SOCIAAL"]),
  titel: z.string().min(1, "Titel is verplicht").max(200),
  beschrijving: z.string().max(5000).optional(),
  datum: z.string().min(1, "Datum is verplicht"),
  eindtijd: z.string().optional(), // time-only string "HH:mm"
  locatie: z.string().max(200).optional(),
  deadlineBeschikbaarheid: z.string().optional(),
  uitgenodigden: z.string().optional(), // comma-separated user IDs, empty = all
  herinnering: z.string().optional(), // e.g. "3", "5", "7", "3,7"
});

export type EventFormData = z.infer<typeof eventSchema>;

export const beschikbaarheidSchema = z
  .object({
    eventId: z.string().min(1),
    status: z.enum(["BESCHIKBAAR", "NIET_BESCHIKBAAR", "TWIJFEL"]),
    reden: z.string().max(500).nullish(),
  })
  .refine(
    (data) =>
      data.status !== "NIET_BESCHIKBAAR" || (data.reden && data.reden.trim().length > 0),
    {
      message: "Reden is verplicht bij 'niet beschikbaar'",
      path: ["reden"],
    }
  );

export type BeschikbaarheidFormData = z.infer<typeof beschikbaarheidSchema>;
