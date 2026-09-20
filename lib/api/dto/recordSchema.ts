import { z } from "zod";
import { documentSchema, prioritySchema } from "./documentSchema";

export const presenceSchema = z.enum(["presente", "ausente", "ausente_justificado"]);

/** `situation` é derivada no backend a partir da nota e de `app.records.passing-grade`.
 *  Vem `null` enquanto o aluno presente não tem nota — a ata em rascunho mostra "—". */
export const recordEntrySchema = z.object({
  id: z.number(),
  studentId: z.number(),
  studentName: z.string(),
  registration: z.string(),
  presence: presenceSchema,
  grade: z.number().nullable(),
  observation: z.string().nullable(),
  situation: z.enum(["aprovado", "reprovado", "ausente"]).nullable(),
});

/** `RecordResponse`: satélite + documento aninhado. A UI navega pelo `document.id`. */
export const recordSchema = z.object({
  id: z.number(),
  document: documentSchema,
  classGroupId: z.number(),
  classGroupCode: z.string(),
  discipline: z.string(),
  evaluationType: z.string(),
  date: z.string(),
  examDocumentId: z.number().nullable(),
  passingGrade: z.number(),
  average: z.number().nullable(),
  totalStudents: z.number(),
  gradedCount: z.number(),
  entries: z.array(recordEntrySchema),
});

/** `RecordCardResponse` — sem as entradas, devolvido por `GET /records` para o Kanban. */
export const recordCardSchema = recordSchema.omit({
  entries: true,
  passingGrade: true,
  average: true,
  totalStudents: true,
  gradedCount: true,
  examDocumentId: true,
});

export type Presence = z.infer<typeof presenceSchema>;
export type RecordEntry = z.infer<typeof recordEntrySchema>;
export type EvaluationRecord = z.infer<typeof recordSchema>;
export type RecordCard = z.infer<typeof recordCardSchema>;

/** Query de `GET /records`. Disciplina não é filtro da API: o quadro filtra no cliente. */
export interface RecordFilter {
  status?: string;
  priority?: string;
  requesterId?: number;
  mine?: boolean;
}

/** `RecordRequest` — as entradas não vão no corpo: nascem da turma (UC11). */
export const recordInputSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(255),
  description: z.string().nullish(),
  priority: prioritySchema.optional(),
  deadline: z.string().nullish(),
  classGroupId: z.number({ message: "Turma é obrigatória" }),
  examDocumentId: z.number().nullish(),
  evaluationType: z.string().trim().min(1, "Tipo de avaliação é obrigatório").max(60),
  date: z.string().min(1, "Data é obrigatória"),
});

/** `RecordEntriesRequest`. A faixa 0–10 espelha o `@DecimalMin/@DecimalMax` e o CHECK do banco. */
export const recordEntriesInputSchema = z.object({
  entries: z.array(
    z.object({
      studentId: z.number(),
      presence: presenceSchema,
      grade: z.number().min(0, "Nota mínima é 0").max(10, "Nota máxima é 10").nullish(),
      observation: z.string().nullish(),
    }),
  ),
});

export type RecordInput = z.infer<typeof recordInputSchema>;
export type RecordEntriesInput = z.infer<typeof recordEntriesInputSchema>;
