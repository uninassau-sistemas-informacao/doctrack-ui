import { z } from "zod";
import { apiFetch } from "./client";
import {
  attachmentSchema,
  downloadUrlSchema,
  uploadUrlSchema,
  type Attachment,
} from "./dto/attachmentSchema";

/**
 * Anexos (E7.1). O upload tem três passos porque o arquivo não passa pela API: pedimos a URL
 * assinada, gravamos direto no storage e só então confirmamos a chave.
 *
 * O PUT usa `fetch` puro, e não `apiFetch`: a URL aponta para o storage, fora da API, e mandar
 * os cookies de sessão para lá além de inútil invalidaria a assinatura. Pelo mesmo motivo o
 * `Content-Type` é o que a API devolveu — foi com ele que a URL foi assinada.
 */
export const AttachmentsApi = {
  async list(documentId: number): Promise<Attachment[]> {
    return z
      .array(attachmentSchema)
      .parse(await apiFetch<unknown>(`/documents/${documentId}/attachments`));
  },

  async upload(documentId: number, file: File): Promise<Attachment> {
    const signed = uploadUrlSchema.parse(
      await apiFetch<unknown>(`/documents/${documentId}/attachments/upload-url`, {
        method: "POST",
        body: JSON.stringify({ filename: file.name }),
      })
    );

    if (file.size > signed.maxBytes) {
      throw new Error(`Arquivo maior que o limite de ${Math.floor(signed.maxBytes / 1048576)} MB.`);
    }

    const stored = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": signed.contentType },
      body: file,
    });
    if (!stored.ok) {
      throw new Error(`Falha ao enviar o arquivo para o storage (${stored.status}).`);
    }

    return attachmentSchema.parse(
      await apiFetch<unknown>(`/documents/${documentId}/attachments`, {
        method: "POST",
        body: JSON.stringify({ storageKey: signed.storageKey }),
      })
    );
  },

  async downloadUrl(documentId: number, attachmentId: number): Promise<string> {
    const parsed = downloadUrlSchema.parse(
      await apiFetch<unknown>(`/documents/${documentId}/attachments/${attachmentId}/download-url`)
    );
    return parsed.downloadUrl;
  },

  async cancel(documentId: number, attachmentId: number): Promise<void> {
    await apiFetch<void>(`/documents/${documentId}/attachments/${attachmentId}`, { method: "DELETE" });
  },
};
