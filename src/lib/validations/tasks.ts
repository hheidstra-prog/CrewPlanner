import { z } from "zod";

export const taskSchema = z.object({
  titel: z.string().min(1, "Titel is verplicht").max(200),
  beschrijving: z.string().max(5000).optional(),
  deadline: z.string().optional(),
  taskGroupId: z.string().optional(),
  toegewezenAan: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;

export const taskGroupSchema = z.object({
  titel: z.string().min(1, "Titel is verplicht").max(200),
  beschrijving: z.string().max(2000).optional(),
});

export type TaskGroupFormData = z.infer<typeof taskGroupSchema>;
