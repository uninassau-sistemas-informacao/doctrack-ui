import { z } from "zod";
import { apiFetch } from "./client";
import {
  examCardSchema,
  examSchema,
  type Exam,
  type ExamCard,
  type ExamFilter,
  type ExamInput,
} from "./dto/examSchema";

function query(filter: ExamFilter = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Provas (UC01). O id das rotas é o do **documento**, não o da tabela `exams`. */
export const ExamsApi = {
  /** Cards do Kanban: satélite + documento, sem as questões. */
  async list(filter?: ExamFilter): Promise<ExamCard[]> {
    return z.array(examCardSchema).parse(await apiFetch<unknown>(`/exams${query(filter)}`));
  },

  async create(input: ExamInput): Promise<Exam> {
    const data = await apiFetch<unknown>("/exams", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return examSchema.parse(data);
  },

  /** Só em `rascunho`/`reprovado` e só pelo dono; reescreve a lista inteira de questões. */
  async update(documentId: number, input: ExamInput): Promise<Exam> {
    const data = await apiFetch<unknown>(`/exams/${documentId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return examSchema.parse(data);
  },

  async get(documentId: number): Promise<Exam> {
    return examSchema.parse(await apiFetch<unknown>(`/exams/${documentId}`));
  },
};
