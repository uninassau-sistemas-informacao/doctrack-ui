"use client";

import { ClipboardTextIcon } from "@phosphor-icons/react";
import { useState } from "react";

import type { Document } from "../../../lib/api/dto/documentSchema";
import type { WorkflowStatus } from "../../../lib/api/dto/workflowSchema";
import { soft } from "../../lib/data";

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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {dropError && (
        <p role="alert" className="text-sm text-danger">
          {dropError}
        </p>
      )}

      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
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
              // Coluna do protótipo (KanbanColumn.tsx): fundo neutro translúcido, borda só ao
              // receber um card arrastado, na cor do status de destino.
              className="flex min-h-[500px] w-[288px] shrink-0 flex-col rounded-2xl border-2 bg-surface-2/50 transition-colors"
              style={
                isOver
                  ? { background: soft(status.color, 10), borderColor: soft(status.color, 50) }
                  : { borderColor: "transparent" }
              }
            >
              <header className="flex items-center justify-between px-4 py-4">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: status.color }} />
                  <h2 className="truncate text-xs font-semibold">{status.label}</h2>
                </div>
                <span
                  className="min-w-[22px] rounded-full px-2 py-0.5 text-center text-xs font-bold"
                  style={{ background: soft(status.color), color: status.color }}
                >
                  {columnItems.length}
                </span>
              </header>

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4">
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
                    className={`cursor-pointer select-none rounded-xl border border-line bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,.04),0_1px_2px_rgba(0,0,0,.02)] transition-shadow hover:shadow-md ${
                      draggingId === item.id ? "opacity-40" : ""
                    }`}
                    // Reprovado ganha a faixa vermelha à esquerda do protótipo.
                    style={
                      item.status.key === "reprovado"
                        ? { borderColor: "var(--danger)", borderLeftWidth: 3 }
                        : undefined
                    }
                  >
                    {renderCard(item)}
                  </div>
                ))}

                {columnItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line px-4 py-10 text-center">
                    <div className="mb-3 rounded-xl bg-primary-soft p-4">
                      <ClipboardTextIcon size={28} className="block text-primary" />
                    </div>
                    <p className="text-sm font-semibold">Nada aqui</p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
