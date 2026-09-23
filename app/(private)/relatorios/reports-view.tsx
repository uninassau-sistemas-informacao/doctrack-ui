"use client";

import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "../../../lib/api/client";
import { ReportsApi, type ReportFormat } from "../../../lib/api/reports";
import type { ReportFilter } from "../../../lib/api/dto/reportSchema";
import type { DocumentType } from "../../../lib/api/dto/workflowSchema";
import PageHeader from "../../components/page-header";
import ReportChart, { type ChartDatum } from "../../components/reports/report-chart";

const FILTER = "rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary";

/** Uma casa decimal: horas com mais dígitos é falsa precisão. */
function hours(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Relatórios gerenciais (E8.3/E8.4): throughput, SLA e volume por papel, cada um com tabela e
 * gráfico, e exportação em CSV e PDF.
 *
 * Os filtros ficam em `useState` e não na URL, seguindo os quadros: a escolha de período é
 * efêmera, não é um link que se compartilha. As três consultas usam `placeholderData` para a
 * tela não piscar vazia a cada troca de data — são três requisições e o vazio apareceria três
 * vezes.
 *
 * O período volta na resposta e é ele que rotula a tela: sem `from`/`to` o servidor resolve os
 * últimos 30 dias, e mostrar o que foi pedido em vez do que foi usado mentiria no cabeçalho.
 */
export default function ReportsView({ documentTypes }: { documentTypes: DocumentType[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeKey, setTypeKey] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const filter: ReportFilter = {
    from: from || undefined,
    to: to || undefined,
    typeKey: typeKey || undefined,
  };
  const key = { from: from || null, to: to || null, typeKey: typeKey || null };

  const throughput = useQuery({
    queryKey: ["reports", "throughput", key] as const,
    queryFn: () => ReportsApi.throughput(filter),
    placeholderData: (previous) => previous,
  });

  const sla = useQuery({
    queryKey: ["reports", "sla", key] as const,
    queryFn: () => ReportsApi.sla(filter),
    placeholderData: (previous) => previous,
  });

  // Volume por papel não aceita typeKey: a pergunta é sobre quem move, não sobre o que é movido.
  const volume = useQuery({
    queryKey: ["reports", "volume-by-role", { from: key.from, to: key.to }] as const,
    queryFn: () => ReportsApi.volumeByRole({ from: filter.from, to: filter.to }),
    placeholderData: (previous) => previous,
  });

  const error = throughput.error ?? sla.error ?? volume.error;
  const period = throughput.data ?? sla.data ?? volume.data;

  async function handleExport(
    report: "throughput" | "sla" | "volume-by-role",
    format: ReportFormat,
  ) {
    const token = `${report}-${format}`;
    setExporting(token);
    setExportError(null);
    try {
      await ReportsApi.export(report, format, report === "volume-by-role" ? { from: filter.from, to: filter.to } : filter);
    } catch (err) {
      setExportError(
        err instanceof ApiError ? err.message : "Não foi possível exportar o relatório.",
      );
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle={
          period
            ? `Período de ${formatDate(period.from)} a ${formatDate(period.to)}`
            : "Indicadores de tramitação"
        }
      />

      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          De
          <input type="date" className={FILTER} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Até
          <input type="date" className={FILTER} value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <select className={FILTER} value={typeKey} onChange={(e) => setTypeKey(e.target.value)}>
          <option value="">Todos os tipos</option>
          {documentTypes.map((type) => (
            <option key={type.key} value={type.key}>
              {type.name}
            </option>
          ))}
        </select>
        {(from || to || typeKey) && (
          <button
            onClick={() => {
              setFrom("");
              setTo("");
              setTypeKey("");
            }}
            className="cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-sm text-muted"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        {error && (
          <p role="alert" className="text-sm text-[#993C1D]">
            {error instanceof ApiError ? error.message : "Não foi possível carregar os relatórios."}
          </p>
        )}
        {exportError && (
          <p role="alert" className="text-sm text-[#993C1D]">
            {exportError}
          </p>
        )}

        <ReportBlock
          title="Documentos por status"
          hint="Quantos documentos passaram por cada status no período — não quantos estão nele agora."
          report="throughput"
          exporting={exporting}
          onExport={handleExport}
          loading={throughput.isPending}
          empty={(throughput.data?.rows.length ?? 0) === 0}
          chart={(throughput.data?.rows ?? []).map<ChartDatum>((row) => ({
            label: row.statusLabel,
            value: row.total,
          }))}
          headers={["Tipo", "Status", "Total"]}
          rows={(throughput.data?.rows ?? []).map((row) => ({
            key: `${row.typeKey}-${row.statusKey}`,
            cells: [row.typeName, row.statusLabel, String(row.total)],
          }))}
        />

        <ReportBlock
          title="Tempo por transição (SLA)"
          hint="Quanto o documento esperou antes de cada transição disparar."
          report="sla"
          exporting={exporting}
          onExport={handleExport}
          loading={sla.isPending}
          empty={(sla.data?.rows.length ?? 0) === 0}
          horizontal
          valueSuffix=" h"
          chart={(sla.data?.rows ?? []).map<ChartDatum>((row) => ({
            label: row.transitionLabel,
            value: Number(row.avgHours.toFixed(1)),
          }))}
          headers={["Tipo", "Transição", "Média (h)", "Mediana (h)", "Amostras"]}
          rows={(sla.data?.rows ?? []).map((row) => ({
            key: `${row.typeKey}-${row.transitionKey}`,
            cells: [
              row.typeName,
              row.transitionLabel,
              hours(row.avgHours),
              hours(row.medianHours),
              String(row.samples),
            ],
          }))}
        />

        <ReportBlock
          title="Volume por papel"
          hint="Movimentações registradas no período, por papel de quem as executou."
          report="volume-by-role"
          exporting={exporting}
          onExport={handleExport}
          loading={volume.isPending}
          empty={(volume.data?.rows.length ?? 0) === 0}
          chart={(volume.data?.rows ?? []).map<ChartDatum>((row) => ({
            label: row.roleLabel,
            value: row.total,
          }))}
          headers={["Papel", "Total"]}
          rows={(volume.data?.rows ?? []).map((row) => ({
            key: row.role,
            cells: [row.roleLabel, String(row.total)],
          }))}
        />
      </div>
    </>
  );
}

function ReportBlock({
  title,
  hint,
  report,
  exporting,
  onExport,
  loading,
  empty,
  chart,
  headers,
  rows,
  horizontal,
  valueSuffix,
}: {
  title: string;
  hint: string;
  report: "throughput" | "sla" | "volume-by-role";
  exporting: string | null;
  onExport: (report: "throughput" | "sla" | "volume-by-role", format: ReportFormat) => void;
  loading: boolean;
  empty: boolean;
  chart: ChartDatum[];
  headers: string[];
  rows: { key: string; cells: string[] }[];
  horizontal?: boolean;
  valueSuffix?: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-muted">{hint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {(["csv", "pdf"] as const).map((format) => (
            <button
              key={format}
              onClick={() => onExport(report, format)}
              disabled={exporting === `${report}-${format}`}
              className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-muted disabled:opacity-50"
            >
              <DownloadSimpleIcon size={14} />
              {exporting === `${report}-${format}` ? "Baixando…" : format.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {loading && <p className="px-4 py-6 text-sm text-muted">Carregando…</p>}

      {!loading && empty && (
        <p className="px-4 py-6 text-sm text-muted">Nenhum dado no período selecionado.</p>
      )}

      {!loading && !empty && (
        <div className="flex flex-col gap-4 p-4">
          <ReportChart data={chart} horizontal={horizontal} valueSuffix={valueSuffix} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line">
                  {headers.map((header) => (
                    <th key={header} className="px-3 py-2 text-left text-xs font-semibold text-muted">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-b border-line">
                    {row.cells.map((cell, index) => (
                      <td key={index} className={index === 0 ? "px-3 py-2.5 font-medium" : "px-3 py-2.5 text-muted"}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
