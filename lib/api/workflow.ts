import { apiFetch } from "./client";
import {
  documentTypeSchema,
  type DocumentType,
} from "./dto/workflowSchema";
import { z } from "zod";

/** Tipos de documento e seus fluxos — a origem das colunas do Kanban e das cores de status. */
export const WorkflowApi = {
  async listTypes(): Promise<DocumentType[]> {
    return z.array(documentTypeSchema).parse(await apiFetch<unknown>("/document-types"));
  },

  /** Detalhe: único lugar onde `statuses` e `transitions` vêm preenchidos. */
  async getType(key: string): Promise<DocumentType> {
    return documentTypeSchema.parse(await apiFetch<unknown>(`/document-types/${key}`));
  },
};
