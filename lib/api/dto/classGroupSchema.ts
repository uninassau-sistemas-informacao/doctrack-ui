import { z } from "zod";

export const classGroupSchema = z.object({
  id: z.number(),
  code: z.string(),
  discipline: z.string(),
  period: z.string(),
});

export const studentSchema = z.object({
  id: z.number(),
  name: z.string(),
  registration: z.string(),
});

export type ClassGroup = z.infer<typeof classGroupSchema>;
export type Student = z.infer<typeof studentSchema>;
