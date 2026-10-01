"use client";

import { CalendarBlankIcon, ClockIcon } from "@phosphor-icons/react";

import type { ExamCard } from "../../../lib/api/dto/examSchema";
import { formatDate } from "../../lib/data";
import { Avatar, PriorityPill, StatusPill } from "../badges";

/** Prazo vencido = antes de hoje no fuso do navegador; o dia do prazo ainda conta como em dia. */
function isOverdue(deadline: string): boolean {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return deadline < iso;
}

/** Card de prova do protótipo (ExamCard.tsx): sem contadores de anexo/comentário, que a listagem não traz. */
export default function ExamKanbanCard({ exam }: { exam: ExamCard }) {
  const { document } = exam;
  const overdue = document.deadline !== null && !document.status.finalStatus && isOverdue(document.deadline);
  const requester = document.requester?.name;

  return (
    <div>
      <div className="mb-2 flex items-start gap-2">
        <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug">{document.title}</p>
        <PriorityPill priority={document.priority} showLabel={false} />
      </div>

      <div className="mb-2.5 flex flex-wrap gap-1">
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
          {exam.discipline}
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
          Turma {exam.classGroup}
        </span>
      </div>

      <div className="mb-2.5">
        <StatusPill status={document.status} />
      </div>

      <div className="mb-3 flex flex-col gap-1 text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          <CalendarBlankIcon size={11} className="shrink-0" />
          Aplicação: {formatDate(exam.applicationDate)}
        </span>
        {document.deadline && (
          <span className={`flex items-center gap-1.5 ${overdue ? "text-danger" : "text-muted"}`}>
            <ClockIcon size={11} className="shrink-0" />
            Prazo: {formatDate(document.deadline)}
            {overdue ? " (vencido)" : ""}
          </span>
        )}
      </div>

      {requester && (
        <div className="flex items-center gap-1.5">
          <Avatar name={requester} size="xs" />
          <span className="max-w-[140px] truncate text-xs text-muted">{requester.split(" ")[0]}</span>
        </div>
      )}
    </div>
  );
}
