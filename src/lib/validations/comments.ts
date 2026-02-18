import { z } from "zod";

export const commentSchema = z.object({
  parentType: z.enum(["EVENT", "POST", "TASK"]),
  parentId: z.string().min(1),
  inhoud: z.string().min(1, "Reactie mag niet leeg zijn").max(2000),
});

export type CommentFormData = z.infer<typeof commentSchema>;
