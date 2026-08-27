"use client";

import type { BadgeView, ExamRowView } from "../lib/dashboard-view";

function Pill({ badge }: { badge: BadgeView }) {
  return (
    <span
      className="whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-semibold"
      style={{ background: badge.bg, color: badge.color }}
    >
      {badge.label}
    </span>
  );
}

const HEADERS = ["Prova", "Disciplina", "Turma", "Aplicação", "Status", "Prioridade"];

export default function ExamTable({ rows }: { rows: ExamRowView[] }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Minhas Provas</h2>
        <button className="cursor-pointer p-0 text-xs text-primary">Ver quadro Kanban</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              {HEADERS.map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="cursor-pointer border-b border-line">
                <td className="max-w-[200px] truncate px-3 py-2.5 font-medium">{row.title}</td>
                <td className="px-3 py-2.5 text-muted">{row.discipline}</td>
                <td className="px-3 py-2.5 text-muted">{row.class}</td>
                <td className="px-3 py-2.5 text-muted">{row.date}</td>
                <td className="px-3 py-2.5">
                  <Pill badge={row.status} />
                </td>
                <td className="px-3 py-2.5">
                  <Pill badge={row.priority} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
