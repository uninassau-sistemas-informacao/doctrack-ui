"use client";

import { CaretLeftIcon, CaretRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AuditApi } from "../../../lib/api/audit";
import { ApiError } from "../../../lib/api/client";
import type { AuditLogRow } from "../../../lib/api/dto/auditSchema";
import { soft } from "../../lib/data";

const FILTER = "rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

const HEADERS = ["Quando", "Quem", "Ação", "Módulo", "Registro", "IP", "Mudanças"];

/**
 * Módulos que o feed conhece (E8.1). Lista fixa em vez de derivada das linhas visíveis: um
 * filtro que só oferece o que já está na tela não serve para procurar o que não está nela.
 */
const MODULES = [
  { key: "acesso", label: "Acesso" },
  { key: "user", label: "Usuários" },
  { key: "document", label: "Documentos" },
  { key: "documenttype", label: "Tipos de documento" },
  { key: "workflowstatus", label: "Status do fluxo" },
  { key: "workflowtransition", label: "Transições" },
  { key: "exam", label: "Provas" },
  { key: "evaluationrecord", label: "Atas" },
  { key: "recordentry", label: "Lançamentos" },
  { key: "classgroup", label: "Turmas" },
  { key: "documentattachment", label: "Anexos" },
];

/** `login_failed` é o registro que mais importa aqui, então ganha destaque próprio. */
const ACTION_COLORS: Record<string, string> = {
  ADD: "var(--success)",
  MOD: "var(--info)",
  DEL: "var(--danger)",
  login: "var(--success)",
  logout: "var(--neutral)",
  login_failed: "var(--danger)",
};

function moduleLabel(key: string): string {
  return MODULES.find((item) => item.key === key)?.label ?? key;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Trilha de auditoria (E8.1): revisões de entidade e eventos de acesso na mesma lista,
 * ordenados por data.
 *
 * É a única tela paginada do E8 — relatórios são agregados e o histórico de um documento é
 * curto, mas esta cresce com o uso do sistema inteiro.
 *
 * A busca é debounced no mesmo molde da tabela de usuários: sem isso sai uma requisição por
 * tecla digitada.
 */
export default function AuditTable() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  /**
   * Trocar filtro volta para a primeira página. Fica no handler e não num efeito reagindo à
   * mudança: o efeito renderizaria a página antiga com o filtro novo antes de corrigir, e
   * continuar na página 5 de um resultado novo mostra uma tabela vazia que parece erro.
   */
  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(0);
  }

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isPending, error } = useQuery({
    queryKey: ["audit", { user: debouncedSearch || null, module: module || null, from: from || null, to: to || null, page }] as const,
    queryFn: () =>
      AuditApi.list({
        user: debouncedSearch || undefined,
        module: module || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
      }),
    placeholderData: (previous) => previous,
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const size = data?.size ?? 20;
  const lastPage = Math.max(0, Math.ceil(total / size) - 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <MagnifyingGlassIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => changeFilter(setSearch, event.target.value)}
            placeholder="Buscar por usuário ou e-mail..."
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select className={FILTER} value={module} onChange={(event) => changeFilter(setModule, event.target.value)}>
          <option value="">Todos os módulos</option>
          {MODULES.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          De
          <input type="date" className={FILTER} value={from} onChange={(event) => changeFilter(setFrom, event.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Até
          <input type="date" className={FILTER} value={to} onChange={(event) => changeFilter(setTo, event.target.value)} />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error instanceof ApiError ? error.message : "Nao foi possivel carregar a auditoria"}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-canvas">
                {HEADERS.map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-muted">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <AuditRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>

        {isPending && <p className="px-4 py-6 text-sm text-muted">Carregando…</p>}
        {!isPending && rows.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted">Nenhum evento de auditoria encontrado.</p>
        )}
      </div>

      {total > size && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            {total} evento(s) · página {page + 1} de {lastPage + 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-muted disabled:opacity-40"
              aria-label="Página anterior"
            >
              <CaretLeftIcon size={14} />
            </button>
            <button
              onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
              disabled={page >= lastPage}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-muted disabled:opacity-40"
              aria-label="Próxima página"
            >
              <CaretRightIcon size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditRow({ row }: { row: AuditLogRow }) {
  const color = ACTION_COLORS[row.action] ?? "var(--neutral)";
  return (
    <tr className="border-t border-line align-top">
      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatWhen(row.occurredAt)}</td>
      <td className="px-4 py-3 font-medium">{row.actor?.name ?? "—"}</td>
      <td className="px-4 py-3">
        <span
          className="whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-semibold"
          style={{ background: soft(color), color }}
        >
          {row.action}
        </span>
      </td>
      <td className="px-4 py-3 text-muted">{moduleLabel(row.module)}</td>
      <td className="px-4 py-3 text-muted">{row.entityId ?? "—"}</td>
      <td className="px-4 py-3 font-mono text-xs text-muted">{row.ip ?? "—"}</td>
      <td className="px-4 py-3">
        {row.changes.length === 0 ? (
          <span className="text-muted">—</span>
        ) : (
          <ul className="flex flex-col gap-1">
            {/* Key com índice: uma revisão que reescreve várias linhas (lançamento de notas)
                repete o mesmo campo, e só o nome colidiria. */}
            {row.changes.map((change, index) => (
              <li key={`${change.field}-${index}`} className="text-xs">
                <span className="font-medium">{change.field}</span>{" "}
                <span className="text-muted">
                  {change.from ?? "—"} → {change.to ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  );
}
