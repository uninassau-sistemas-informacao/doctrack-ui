import { z } from "zod";

export const classGroupSchema = z.object({
  id: z.number(),
  code: z.string(),
  discipline: z.string().nullable(),
  period: z.string().nullable(),
  professorId: z.number().nullable(),
  professorName: z.string().nullable(),
  supervisorId: z.number().nullable(),
  supervisorName: z.string().nullable(),
});

export const userOptionSchema = z.object({ id: z.number(), name: z.string() });
export type UserOption = z.infer<typeof userOptionSchema>;

export const studentSchema = z.object({
  id: z.number(),
  name: z.string(),
  registration: z.string(),
});

export const classGroupInputSchema = z.object({
  code: z.string().trim().min(1, "Código é obrigatório").max(40),
  discipline: z.string().trim().max(120).nullish(),
  period: z.string().trim().max(20).nullish(),
});

export const studentInputSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(160),
  registration: z.string().trim().min(1, "Matrícula é obrigatória").max(40),
});

export type ClassGroupInput = z.infer<typeof classGroupInputSchema>;
export type StudentInput = z.infer<typeof studentInputSchema>;
export type ClassGroup = z.infer<typeof classGroupSchema>;
export type Student = z.infer<typeof studentSchema>;
