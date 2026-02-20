import { z } from "zod";

export const createMemberSchema = z.object({
  voornaam: z.string().min(1, "Voornaam is verplicht").max(100),
  achternaam: z.string().min(1, "Achternaam is verplicht").max(100),
  email: z.string().min(1, "E-mailadres is verplicht").email("Ongeldig e-mailadres"),
});

export type CreateMemberFormData = z.infer<typeof createMemberSchema>;
