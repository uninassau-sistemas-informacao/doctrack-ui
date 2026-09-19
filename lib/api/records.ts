import { z } from "zod";
import { apiFetch } from "./client";
import { examSchema, type Exam } from "./dto/examSchema";
import {
  recordCardSchema,
  recordSchema,
  type EvaluationRecord,
  type RecordCard,
  type RecordEntriesInput,
  type RecordFilter,
  type RecordInput,
} from "./dto/recordSchema";

function query(filter: RecordFilter = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Atas (UC07 a UC09). O id das rotas é o do **documento**, não o da tabela `evaluation_records`. */
export const RecordsApi = {
  /** Cards do Kanban: satélite + documento, sem as entradas. */
  async list(filter?: RecordFilter): Promise<RecordCard[]> {
    return z.array(recordCardSchema).parse(await apiFetch<unknown>(`/records${query(filter)}`));
  },

  async create(input: RecordInput): Promise<EvaluationRecord> {
    const data = await apiFetch<unknown>("/records", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return recordSchema.parse(data);
  },

  async get(documentId: number): Promise<EvaluationRecord> {
    return recordSchema.parse(await apiFetch<unknown>(`/records/${documentId}`));
  },

  /** Só em `rascunho` e só pelo dono; atualiza cada linha no lugar. */
  async updateEntries(documentId: number, input: RecordEntriesInput): Promise<EvaluationRecord> {
    const data = await apiFetch<unknown>(`/records/${documentId}/entries`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return recordSchema.parse(data);
  },

  /** Segunda chamada (E5.5): só para `ausente_justificado`, devolve a prova de reposição criada. */
  async createRetake(documentId: number, entryId: number): Promise<Exam> {
    const data = await apiFetch<unknown>(`/records/${documentId}/entries/${entryId}/retake`, {
      method: "POST",
    });
    return examSchema.parse(data);
  },
};
