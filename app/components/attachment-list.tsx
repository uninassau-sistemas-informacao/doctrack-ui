"use client";

import { DownloadSimpleIcon, PaperclipIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { AttachmentsApi } from "../../lib/api/attachments";
import type { Attachment } from "../../lib/api/dto/attachmentSchema";
import { formatDateTime } from "../lib/data";

const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

function sizeLabel(bytes: number): string {
  return bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * Anexos do documento (E7.2). O arquivo sobe direto para o storage por URL assinada; esta tela
 * só orquestra. A área de arrastar usa o drag-and-drop nativo, o mesmo do quadro (E2.6) — não há
 * biblioteca de dropzone no projeto e este não é motivo para instalar uma.
 *
 * `canEdit` vem do status do documento: em status final a API recusa (409), e a UI não oferece.
 */
export default function AttachmentList({
  documentId,
  canEdit,
}: {
  documentId: number;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["attachments", documentId] as const,
    queryFn: () => AttachmentsApi.list(documentId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => AttachmentsApi.upload(documentId, file),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["attachments", documentId] });
      await queryClient.invalidateQueries({ queryKey: ["documents", documentId] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Não foi possível enviar o arquivo."),
  });

  const cancelMutation = useMutation({
    mutationFn: (attachmentId: number) => AttachmentsApi.cancel(documentId, attachmentId),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["attachments", documentId] });
      await queryClient.invalidateQueries({ queryKey: ["documents", documentId] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Não foi possível cancelar o anexo."),
  });

  async function download(attachment: Attachment) {
    try {
      const url = await AttachmentsApi.downloadUrl(documentId, attachment.id);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível baixar o arquivo.");
    }
  }

  const attachments = listQuery.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) uploadMutation.mutate(file);
          }}
          className={`flex flex-col items-center gap-2 rounded-xl border border-dashed py-6 text-center ${
            dragging ? "border-primary bg-primary-soft" : "border-line"
          }`}
        >
          <UploadSimpleIcon size={22} className="text-muted" />
          <p className="text-sm text-muted">Arraste um arquivo aqui ou</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-primary disabled:cursor-default disabled:opacity-60"
          >
            {uploadMutation.isPending ? "Enviando..." : "Escolher arquivo"}
          </button>
          <p className="text-xs text-muted">PDF, DOC, DOCX, JPG ou PNG, até 10 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Zera para permitir reenviar o mesmo arquivo depois de um erro.
              event.currentTarget.value = "";
              if (file) uploadMutation.mutate(file);
            }}
          />
        </div>
      )}

      {(error || listQuery.error) && (
        <p role="alert" className="text-sm text-danger">
          {error ??
            (listQuery.error instanceof Error
              ? listQuery.error.message
              : "Não foi possível carregar os anexos.")}
        </p>
      )}

      {listQuery.isPending && <p className="text-sm text-muted">Carregando anexos...</p>}

      {listQuery.isSuccess && attachments.length === 0 && (
        <p className="text-sm text-muted">Nenhum anexo neste documento.</p>
      )}

      <ul className="flex list-none flex-col gap-2 p-0">
        {attachments.map((attachment) => (
          <li
            key={attachment.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2"
          >
            <PaperclipIcon size={16} className="shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{attachment.originalName}</p>
              <p className="text-xs text-muted">
                {sizeLabel(attachment.sizeBytes)} · {attachment.uploadedBy?.name ?? "—"} ·{" "}
                {formatDateTime(attachment.createdAt)}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Baixar ${attachment.originalName}`}
              onClick={() => void download(attachment)}
              className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-line text-muted"
            >
              <DownloadSimpleIcon size={14} />
            </button>
            {canEdit && (
              <button
                type="button"
                aria-label={`Cancelar ${attachment.originalName}`}
                onClick={() => cancelMutation.mutate(attachment.id)}
                disabled={cancelMutation.isPending}
                className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-line text-muted disabled:cursor-default disabled:opacity-60"
              >
                <TrashIcon size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
