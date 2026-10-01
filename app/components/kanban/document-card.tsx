"use client";

import { ClockIcon } from "@phosphor-icons/react";

import type { Document } from "../../../lib/api/dto/documentSchema";
import { formatDate } from "../../lib/data";
import { Avatar, PriorityPill, StatusPill } from "../badges";

/**
 * Card do quadro genérico: só campos do núcleo, no mesmo desenho do card de prova. Tipos com
 * satélite (prova) têm card próprio porque mostram disciplina e turma — aqui não há satélite.
 */
export default function DocumentKanbanCard({ document }: { document: Document }) {
  const requester = document.requester?.name;
  return (
    <div>
      <div className="mb-2 flex items-start gap-2">
        <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug">{document.title}</p>
        <PriorityPill priority={document.priority} showLabel={false} />
      </div>
      {document.description && (
        <p className="mb-2.5 line-clamp-2 text-xs text-muted">{document.description}</p>
      )}
      <div className="mb-2.5">
        <StatusPill status={document.status} />
      </div>
      {document.deadline && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-muted">
          <ClockIcon size={11} className="shrink-0" />
          Prazo: {formatDate(document.deadline)}
        </p>
      )}
      {requester && (
        <div className="flex items-center gap-1.5">
          <Avatar name={requester} size="xs" />
          <span className="max-w-[140px] truncate text-xs text-muted">{requester.split(" ")[0]}</span>
        </div>
      )}
    </div>
  );
}
