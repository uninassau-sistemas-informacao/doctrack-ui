"use client";

import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "../../../../../../lib/api/client";
import { HistoryApi } from "../../../../../../lib/api/history";
import DocumentTimeline, { type TimelineRow } from "../../../../../components/document-timeline";
import PageHeader from "../../../../../components/page-header";

const FILTER = "rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

/**
 * Histórico completo com filtro por ator e exportação CSV (E8.2).
 *
 * Consome `GET /documents/{id}/history`, e não o detalhe do documento: o detalhe também traz
 * `movements`, mas pelo DTO sem `actorIp` — que é exatamente o campo que esta tela existe para
 * mostrar. Reusar o detalhe daria uma tela sem IP.
 *
 * O filtro por ator sai da própria lista, sem chamada extra: o histórico de um documento é
 * curto por natureza, e pedir os atores à API seria uma requisição para repetir o que já veio.
 */
export default function HistoryView({ documentId, typeKey }: { documentId: number; typeKey: string }) {
  const [actorId, setActorId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["documents", documentId, "history"] as const,
    queryFn: () => HistoryApi.list(documentId),
  });

  const rows = data ?? [];
  const actors = [...new Map(rows.filter((r) => r.actor).map((r) => [r.actor!.id, r.actor!])).values()];
  const visible = actorId ? rows.filter((row) => row.actor?.id === Number(actorId)) : rows;

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await HistoryApi.exportCsv(documentId, actorId ? Number(actorId) : undefined);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : "Não foi possível exportar o histórico.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Histórico do documento"
        subtitle={`${visible.length} movimentação(ões)`}
        backHref={`/documentos/${typeKey}?documento=${documentId}`}
      >
        <button
          onClick={handleExport}
          disabled={exporting || rows.length === 0}
          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-muted disabled:opacity-50"
        >
          <DownloadSimpleIcon size={15} /> {exporting ? "Baixando…" : "Exportar CSV"}
        </button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-6 py-3">
        <select className={FILTER} value={actorId} onChange={(event) => setActorId(event.target.value)}>
          <option value="">Todos os responsáveis</option>
          {actors.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {isPending && <p className="text-sm text-muted">Carregando histórico…</p>}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error instanceof ApiError ? error.message : "Não foi possível carregar o histórico."}
          </p>
        )}

        {exportError && (
          <p role="alert" className="mb-3 text-sm text-danger">
            {exportError}
          </p>
        )}

        {!isPending && !error && visible.length === 0 && (
          <p className="text-sm text-muted">Nenhuma movimentação para este filtro.</p>
        )}

        {visible.length > 0 && (
          <div className="rounded-2xl border border-line bg-surface p-5">
            <DocumentTimeline movements={visible as TimelineRow[]} showIp />
          </div>
        )}
      </div>
    </>
  );
}
