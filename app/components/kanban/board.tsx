"use client";

import { useState } from "react";

import type { Document } from "../../../lib/api/dto/documentSchema";
import type { WorkflowStatus } from "../../../lib/api/dto/workflowSchema";

/**
 * Kanban genérico: colunas vêm de `workflow_statuses` do tipo (API), nunca de constante,
 * então um status novo cadastrado no E4 aparece sozinho. Serve provas e, no E6, atas —
 * o que muda é só o `renderCard`.
 *
 * O arrasto (E2.6) usa o drag-and-drop nativo do HTML5: `draggable` + dataTransfer bastam
 * para arrastar um card entre colunas, sem dependência de biblioteca. Quem decide se o
 * destino é válido é `onDropCard`, que consulta as transições disponíveis na API.
 */
export interface KanbanProps<T extends { id: number; status: WorkflowStatus }> {
  statuses: WorkflowStatus[];
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  onCardClick?: (item: T) => void;
  /** Recebe o card e o status de destino; devolve erro (string) ou null se moveu. */
  onDropCard?: (item: T, target: WorkflowStatus) => Promise<string | null>;
}

export default function KanbanBoard<T extends Document>({
  statuses,
  items,
  renderCard,
  onCardClick,
  onDropCard,
}: KanbanProps<T>) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overStatusId, setOverStatusId] = useState<number | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);

  const columns = [...statuses].sort((a, b) => a.position - b.position);

  async function handleDrop(target: WorkflowStatus) {
    const item = items.find((i) => i.id === draggingId);
    setDraggingId(null);
    setOverStatusId(null);
    if (!item || !onDropCard || item.status.id === target.id) return;

    setDropError(null);
    const error = await onDropCard(item, target);
    // Card inválido volta sozinho: a lista só muda quando o pai recarrega após sucesso.
    if (error) setDropError(error);
  }

  return (
    <div className="flex flex-col gap-3">
      {dropError && (
        <p role="alert" className="text-sm text-[#993C1D]">
          {dropError}
        </p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((status) => {
          const columnItems = items.filter((i) => i.status.key === status.key);
          const isOver = overStatusId === status.id && draggingId !== null;

          return (
            <section
              key={status.id}
              onDragOver={(e) => {
                if (!onDropCard || draggingId === null) return;
                e.preventDefault();
                setOverStatusId(status.id);
              }}
              onDragLeave={() => setOverStatusId((id) => (id === status.id ? null : id))}
              onDrop={(e) => {
                e.preventDefault();
                void handleDrop(status);
              }}
              className={`flex w-[280px] shrink-0 flex-col rounded-2xl border bg-canvas p-3 ${
                isOver ? "border-primary bg-primary-soft" : "border-line"
              }`}
            >
              <header className="mb-3 flex items-center gap-2 px-1">
                <span className="size-2 shrink-0 rounded-full" style={{ background: status.color }} />
                <h2 className="truncate text-sm font-semibold">{status.label}</h2>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-muted">
                  {columnItems.length}
                </span>
              </header>

              <div className="flex min-h-[80px] flex-col gap-2">
                {columnItems.map((item) => (
                  <div
                    key={item.id}
                    draggable={onDropCard !== undefined}
                    onDragStart={() => setDraggingId(item.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverStatusId(null);
                    }}
                    onClick={() => onCardClick?.(item)}
                    className={`cursor-pointer rounded-xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.04)] ${
                      draggingId === item.id ? "opacity-50" : ""
                    }`}
                  >
                    {renderCard(item)}
                  </div>
                ))}

                {columnItems.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted">Vazio</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
