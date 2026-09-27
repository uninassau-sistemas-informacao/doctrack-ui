import { z } from "zod";
import { apiFetch, downloadFile } from "./client";
import { documentHistoryRowSchema, type DocumentHistoryRow } from "./dto/historySchema";

/**
 * Histórico completo de um documento, com IP do ator (E8.2). Coordenador e admin; a API
 * recusa os demais com 403 — inclusive o professor dono do documento, que vê o detalhe mas
 * não a trilha de auditoria.
 */
export const HistoryApi = {
  async list(documentId: number, actorId?: number): Promise<DocumentHistoryRow[]> {
    const qs = actorId ? `?actor=${actorId}` : "";
    return z
      .array(documentHistoryRowSchema)
      .parse(await apiFetch<unknown>(`/documents/${documentId}/history${qs}`));
  },

  async exportCsv(documentId: number, actorId?: number): Promise<void> {
    const params = new URLSearchParams({ format: "csv" });
    if (actorId) {
      params.set("actor", String(actorId));
    }
    return downloadFile(`/documents/${documentId}/history?${params}`, `historico-${documentId}.csv`);
  },
};
