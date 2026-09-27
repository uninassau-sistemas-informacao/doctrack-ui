"use client";

import type { WorkflowStatus } from "../../lib/api/dto/workflowSchema";

/**
 * Timeline de movimentações, usada pela aba Histórico do painel de detalhe (E2.5) e pela tela
 * de histórico completo (E8.2).
 *
 * Extraída do `document-detail.tsx` quando a segunda tela apareceu: duas cópias do mesmo
 * desenho divergiriam no primeiro ajuste visual, e a linha do tempo é o que o usuário
 * reconhece como "o histórico".
 *
 * O IP entra por `showIp` e não por presença do campo: o DTO do painel não traz IP nenhum
 * (decisão do E8.2 — o professor dono abre aquela tela), então o flag deixa explícito nos dois
 * pontos de uso quem está mostrando dado de auditoria.
 */
export interface TimelineRow {
  id: number;
  transitionKey: string | null;
  transitionLabel: string | null;
  toStatus: WorkflowStatus;
  actor: { id: number; name: string } | null;
  actorIp?: string | null;
  comment: string | null;
  createdAt: string;
  detailsJson: string | null;
}

/**
 * Movimento de reatribuição (E7.4): `transitionKey` nulo também marca a criação do documento,
 * então o discriminador tem que ser `detailsJson` — e o parse é defensivo porque o conteúdo é
 * texto livre no banco, não um contrato tipado.
 */
function parseReassignDetails(
  detailsJson: string | null
): { fromAssigneeName: string | null; toAssigneeName: string | null } | null {
  if (!detailsJson) return null;
  try {
    const parsed: unknown = JSON.parse(detailsJson);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as Record<string, unknown>).event === "reassign"
    ) {
      const p = parsed as Record<string, unknown>;
      return {
        fromAssigneeName: typeof p.fromAssigneeName === "string" ? p.fromAssigneeName : null,
        toAssigneeName: typeof p.toAssigneeName === "string" ? p.toAssigneeName : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function DocumentTimeline({
  movements,
  showIp = false,
}: {
  movements: TimelineRow[];
  showIp?: boolean;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {movements.map((m) => {
        const reassign = m.transitionKey === null ? parseReassignDetails(m.detailsJson) : null;
        return (
          <li key={m.id} className="flex gap-3">
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full"
              style={{ background: m.toStatus.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {reassign
                  ? `Responsável alterado: ${reassign.fromAssigneeName ?? "—"} → ${reassign.toAssigneeName ?? "—"}`
                  : (
                    <>
                      {m.transitionLabel ?? "Documento criado"}
                      <span className="ml-1.5 font-normal text-muted">→ {m.toStatus.label}</span>
                    </>
                  )}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {m.actor?.name ?? "—"} ·{" "}
                {new Date(m.createdAt).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
                {showIp && (
                  <>
                    {" · "}
                    <span className="font-mono">{m.actorIp ?? "—"}</span>
                  </>
                )}
              </p>
              {m.comment && (
                <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-line bg-canvas p-2.5 text-xs">
                  {m.comment}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
