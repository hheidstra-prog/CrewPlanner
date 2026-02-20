import { z } from "zod";

export const createMemberSchema = z.object({
  voornaam: z.string().min(1, "Voornaam is verplicht").max(100),
  achternaam: z.string().min(1, "Achternaam is verplicht").max(100),
  email: z.string().min(1, "E-mailadres is verplicht").email("Ongeldig e-mailadres"),
  straat: z.string().max(200).optional().default(""),
  postcode: z.string().max(10).optional().default(""),
  woonplaats: z.string().max(100).optional().default(""),
  geboortedatum: z.string().optional().default(""),
  isTeamManager: z.coerce.boolean().optional().default(false),
});

export type CreateMemberFormData = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = z.object({
  voornaam: z.string().min(1, "Voornaam is verplicht").max(100),
  achternaam: z.string().min(1, "Achternaam is verplicht").max(100),
  email: z.string().min(1, "E-mailadres is verplicht").email("Ongeldig e-mailadres"),
  straat: z.string().max(200).optional().default(""),
  postcode: z.string().max(10).optional().default(""),
  woonplaats: z.string().max(100).optional().default(""),
  geboortedatum: z.string().optional().default(""),
  isTeamManager: z.coerce.boolean().optional().default(false),
});

export type UpdateMemberFormData = z.infer<typeof updateMemberSchema>;

export const updateProfileSchema = z.object({
  voornaam: z.string().min(1, "Voornaam is verplicht").max(100),
  achternaam: z.string().min(1, "Achternaam is verplicht").max(100),
  straat: z.string().max(200).optional().default(""),
  postcode: z.string().max(10).optional().default(""),
  woonplaats: z.string().max(100).optional().default(""),
  geboortedatum: z.string().optional().default(""),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
