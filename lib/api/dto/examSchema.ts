import { z } from "zod";
import { documentSchema, prioritySchema } from "./documentSchema";

export const examQuestionSchema = z.object({
  id: z.number(),
  position: z.number(),
  content: z.string(),
});

/** `ExamResponse`: satélite + documento aninhado. `id` é o da prova; a UI navega pelo `document.id`. */
export const examSchema = z.object({
  id: z.number(),
  document: documentSchema,
  discipline: z.string(),
  classGroup: z.string(),
  applicationDate: z.string(),
  durationMinutes: z.number(),
  notes: z.string().nullable(),
  /** E5.5: prova de reposição aponta para o documento da prova original. */
  parentExamDocumentId: z.number().nullable(),
  questions: z.array(examQuestionSchema),
});

/**
 * `ExamCardResponse` — prova sem as questões, devolvida por `GET /exams` para o Kanban.
 * O backend mantém o DTO separado de propósito: `questions` é lazy no JPA e montar a
 * resposta cheia numa listagem custaria uma consulta por prova.
 */
export const examCardSchema = examSchema.omit({ questions: true });

export type ExamQuestion = z.infer<typeof examQuestionSchema>;
export type Exam = z.infer<typeof examSchema>;
export type ExamCard = z.infer<typeof examCardSchema>;

/** Query de `GET /exams`. Disciplina não é filtro da API: o quadro filtra no cliente. */
export interface ExamFilter {
  status?: string;
  priority?: string;
  requesterId?: number;
  mine?: boolean;
}

/**
 * `ExamRequest` — o mesmo corpo serve POST e PUT. Espelha as validações do backend para o
 * formulário errar antes da viagem; o 422 do servidor continua sendo a fonte da verdade.
 * `questions` pode ir vazio (rascunho salva assim); quem exige ≥1 é a transição `submeter`.
 */
export const examInputSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(255),
  description: z.string().nullish(),
  priority: prioritySchema.optional(),
  deadline: z.string().nullish(),
  discipline: z.string().trim().min(1, "Disciplina é obrigatória").max(120),
  classGroup: z.string().trim().min(1, "Turma é obrigatória").max(60),
  applicationDate: z.string().min(1, "Data de aplicação é obrigatória"),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Duração deve ser maior que zero")
    .max(600, "Duração máxima é 600 minutos"),
  notes: z.string().nullish(),
  questions: z.array(z.string().trim().min(1, "Questão não pode ser vazia")).optional(),
});

export type ExamInput = z.infer<typeof examInputSchema>;
