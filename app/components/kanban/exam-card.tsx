"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react";

import type { ExamCard } from "../../../lib/api/dto/examSchema";
import { PRIORITY_CONFIG, formatDate } from "../../lib/data";

/** Conteúdo do card de prova no Kanban: título, disciplina/turma, prioridade, professor, prazo. */
export default function ExamKanbanCard({ exam }: { exam: ExamCard }) {
  const priority = PRIORITY_CONFIG[exam.document.priority];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium leading-[1.4]">{exam.document.title}</p>
        <span
          className="mt-1 size-2 shrink-0 rounded-full"
          title={`Prioridade ${priority.label}`}
          style={{ background: priority.color }}
        />
      </div>

      <p className="text-xs text-muted">
        {exam.discipline} · Turma {exam.classGroup}
      </p>

      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted">
          {exam.document.requester?.name ?? "—"}
        </span>
        {exam.document.deadline && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
            <CalendarBlankIcon size={12} />
            {formatDate(exam.document.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}
