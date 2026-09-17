import { z } from "zod";
import { apiFetch } from "./client";
import {
  documentDetailSchema,
  documentSchema,
  type Document,
  type DocumentDetail,
  type DocumentFilter,
} from "./dto/documentSchema";
import { workflowTransitionSchema, type WorkflowTransition } from "./dto/workflowSchema";

function query(filter: DocumentFilter = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Leitura de documentos e execução de transições (o motor de fluxo genérico do E1). */
export const DocumentsApi = {
  async list(filter?: DocumentFilter): Promise<Document[]> {
    return z.array(documentSchema).parse(await apiFetch<unknown>(`/documents${query(filter)}`));
  },

  async get(id: number): Promise<DocumentDetail> {
    return documentDetailSchema.parse(await apiFetch<unknown>(`/documents/${id}`));
  },

  /** Só as transições que o usuário logado pode executar — a UI renderiza um botão por item. */
  async availableTransitions(id: number): Promise<WorkflowTransition[]> {
    return z
      .array(workflowTransitionSchema)
      .parse(await apiFetch<unknown>(`/documents/${id}/transitions`));
  },

  /** Devolve o documento já com o histórico atualizado, evitando um GET em seguida. */
  async transition(id: number, transitionId: number, comment?: string): Promise<DocumentDetail> {
    const data = await apiFetch<unknown>(`/documents/${id}/transitions/${transitionId}`, {
      method: "POST",
      body: JSON.stringify({ comment: comment ?? null }),
    });
    return documentDetailSchema.parse(data);
  },
};
