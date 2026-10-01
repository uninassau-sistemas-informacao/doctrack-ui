"use client";

import { FunnelIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

/** Classe dos <select> da linha de filtros, igual à do protótipo. */
export const FILTER_SELECT =
  "cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-primary";

/**
 * Cabeçalho das telas de gestão (KanbanBoard.tsx do protótipo): título e contagem à esquerda;
 * busca, botão Filtros e ação principal à direita; filtros numa linha que abre e fecha.
 */
export default function BoardHeader({
  title,
  subtitle,
  search,
  onSearch,
  searchPlaceholder,
  activeFilters,
  onClearFilters,
  filters,
  action,
}: {
  title: string;
  subtitle: string;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  /** Filtros ligados na linha recolhível (a busca não conta: ela fica sempre visível). */
  activeFilters: number;
  onClearFilters: () => void;
  filters: React.ReactNode;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const highlighted = activeFilters > 0;

  return (
    <div className="shrink-0 border-b border-line bg-surface px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-52 rounded-lg border border-line bg-surface-2 py-2 pl-9 pr-8 text-sm outline-none focus:border-primary [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearch("")}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-ink"
              >
                <XIcon size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-surface-2 ${
              highlighted ? "border-info text-info" : "border-line"
            }`}
          >
            <FunnelIcon size={14} />
            Filtros
            {highlighted && (
              <span className="flex size-4 items-center justify-center rounded-full bg-info text-[10px] text-white">
                {activeFilters}
              </span>
            )}
          </button>

          {action}
        </div>
      </div>

      {open && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
          {filters}
          {highlighted && (
            <button
              type="button"
              onClick={onClearFilters}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-danger hover:bg-surface-2"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Botão primário "Nova …" do cabeçalho — Link estilizado como no protótipo. */
export const BOARD_ACTION =
  "flex items-center gap-1.5 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white no-underline hover:text-white hover:no-underline hover:opacity-90";
