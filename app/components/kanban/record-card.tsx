"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react";

import type { RecordCard } from "../../../lib/api/dto/recordSchema";
import { PRIORITY_CONFIG, formatDate } from "../../lib/data";

/** Conteúdo do card de ata no Kanban: título, disciplina/turma, tipo de avaliação, prioridade, professor, prazo. */
export default function RecordKanbanCard({ record }: { record: RecordCard }) {
  const priority = PRIORITY_CONFIG[record.document.priority];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-[1.4]">{record.document.title}</p>
        <span
          className="mt-1 size-2 shrink-0 rounded-full"
          title={`Prioridade ${priority.label}`}
          style={{ background: priority.color }}
        />
      </div>

      <p className="text-xs text-muted">
        {record.discipline} · Turma {record.classGroupCode}
      </p>

      <p className="text-xs text-muted">{record.evaluationType}</p>

      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted">
          {record.document.requester?.name ?? "—"}
        </span>
        {record.document.deadline && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
            <CalendarBlankIcon size={12} />
            {formatDate(record.document.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}
