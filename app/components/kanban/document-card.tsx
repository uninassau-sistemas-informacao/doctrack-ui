"use client";

import type { Document } from "../../../lib/api/dto/documentSchema";
import { PRIORITY_CONFIG, formatDate } from "../../lib/data";

/**
 * Card do quadro genérico: só campos do núcleo. Tipos com satélite (prova, ata) têm cards
 * próprios porque mostram disciplina, turma e afins — aqui não há satélite para mostrar.
 */
export default function DocumentKanbanCard({ document }: { document: Document }) {
  const priority = PRIORITY_CONFIG[document.priority];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{document.title}</p>
      {document.description && (
        <p className="line-clamp-2 text-xs text-muted">{document.description}</p>
      )}
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2 py-[3px] text-[11px] font-semibold"
          style={{ background: priority.bg, color: priority.color }}
        >
          {priority.label}
        </span>
        {document.deadline && (
          <span className="text-[11px] text-muted">Prazo {formatDate(document.deadline)}</span>
        )}
      </div>
      <p className="text-[11px] text-muted">{document.requester?.name ?? "—"}</p>
    </div>
  );
}
