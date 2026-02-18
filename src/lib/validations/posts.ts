import { z } from "zod";

export const postSchema = z.object({
  titel: z.string().min(1, "Titel is verplicht").max(200),
  inhoud: z.string().min(1, "Inhoud is verplicht"),
  categorie: z.enum(["WEDSTRIJDSCHEMA", "REGLEMENTEN", "BOOTINFO", "ALGEMEEN"]),
  gepind: z.boolean().default(false),
});

export type PostFormData = z.infer<typeof postSchema>;
