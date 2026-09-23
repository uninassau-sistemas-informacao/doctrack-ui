"use client";

import { XIcon, PencilSimpleIcon, UserSwitchIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { AuthApi } from "../../lib/api/auth";
import { DocumentsApi } from "../../lib/api/documents";
import { ExamsApi } from "../../lib/api/exams";
import type { DocumentDetail } from "../../lib/api/dto/documentSchema";
import type { Exam } from "../../lib/api/dto/examSchema";
import type { WorkflowTransition } from "../../lib/api/dto/workflowSchema";
import { PRIORITY_CONFIG, badgeFromStatus, formatDate } from "../lib/data";
import AttachmentList from "./attachment-list";
import ReassignModal from "./reassign-modal";

type Tab = "conteudo" | "anexos" | "historico";

/**
 * Painel lateral de detalhe do documento (E2.5).
 *
 * Os botões de ação são renderizados a partir de `GET /documents/{id}/transitions`, que já
 * devolve só o que o usuário logado pode executar — a UI não repete a tabela de papéis. A
 * transição com `requiresComment` abre o modal de justificativa obrigatória (reprovar,
 * devolver); as demais abrem uma confirmação simples.
 *
 * A aba de comentários do enunciado do E2.5 virou parte do histórico: comentário só existe
 * preso a um movimento (não há API de comentário solto), e duas abas mostrando a mesma
 * lista seria a mesma informação dividida em dois lugares.
 */
export default function DocumentDetailPanel({
  documentId,
  onClose,
  onChanged,
}: {
  documentId: number;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("conteudo");
  const [pending, setPending] = useState<WorkflowTransition | null>(null);
  const [reassigning, setReassigning] = useState(false);

  const { data: me } = useQuery({ queryKey: ["auth", "me"], queryFn: () => AuthApi.me() });

  // Detalhe, ações disponíveis e satélite vêm juntos: as três chamadas descrevem o mesmo
  // documento no mesmo instante, e separá-las deixaria os botões um passo atrás do status.
  const { data, error } = useQuery({
    queryKey: ["documents", documentId, "detail"] as const,
    queryFn: async (): Promise<{
      doc: DocumentDetail;
      transitions: WorkflowTransition[];
      exam: Exam | null;
    }> => {
      const [detail, transitions] = await Promise.all([
        DocumentsApi.get(documentId),
        DocumentsApi.availableTransitions(documentId),
      ]);
      const exam = detail.typeKey === "prova" ? await ExamsApi.get(documentId) : null;
      return { doc: detail, transitions, exam };
    },
  });

  const doc = data?.doc ?? null;
  const exam = data?.exam ?? null;
  const transitions = data?.transitions ?? [];

  async function runTransition(transition: WorkflowTransition, comment?: string) {
    await DocumentsApi.transition(documentId, transition.id, comment);
    await queryClient.invalidateQueries({ queryKey: ["documents", documentId] });
    setPending(null);
    onChanged?.();
  }

  const badge = doc ? badgeFromStatus(doc.status) : null;

  return (
    <aside className="flex h-full w-[440px] shrink-0 flex-col border-l border-line bg-white">
      <header className="flex items-start gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{doc?.title ?? "Carregando…"}</p>
          {doc && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {badge && (
                <span
                  className="rounded-full px-2 py-[3px] text-[11px] font-semibold"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
              )}
              <span
                className="rounded-full px-2 py-[3px] text-[11px] font-semibold"
                style={{
                  background: PRIORITY_CONFIG[doc.priority].bg,
                  color: PRIORITY_CONFIG[doc.priority].color,
                }}
              >
                {PRIORITY_CONFIG[doc.priority].label}
              </span>
              {doc.protocolNumber && (
                <span className="text-xs text-muted">{doc.protocolNumber}</span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar detalhe"
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line text-muted"
        >
          <XIcon size={14} />
        </button>
      </header>

      <nav className="flex gap-1 border-b border-line px-5 pt-3">
        {(["conteudo", "anexos", "historico"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-t-lg px-3 py-2 text-sm font-medium ${
              tab === t ? "border-b-2 border-primary text-primary" : "text-muted"
            }`}
          >
            {t === "conteudo" ? "Conteúdo" : t === "anexos" ? "Anexos" : `Histórico (${doc?.movements.length ?? 0})`}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {error && (
          <p role="alert" className="text-sm text-[#993C1D]">
            {error instanceof Error ? error.message : "Não foi possível carregar o documento."}
          </p>
        )}

        {doc && tab === "conteudo" && (
          <div className="flex flex-col gap-4">
            {/* Solicitante e prazo são do documento e valem para qualquer tipo; os campos de
                prova só aparecem quando o satélite foi carregado (`typeKey === "prova"`). */}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {exam && (
                <>
                  <Info label="Disciplina" value={exam.discipline} />
                  <Info label="Turma" value={exam.classGroup} />
                  <Info label="Aplicação" value={formatDate(exam.applicationDate)} />
                  <Info label="Duração" value={`${exam.durationMinutes} min`} />
                </>
              )}
              <Info label="Solicitante" value={doc.requester?.name ?? "—"} />
              <Info label="Prazo" value={doc.deadline ? formatDate(doc.deadline) : "—"} />
            </dl>

            {doc.description && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  Descrição
                </p>
                <p className="whitespace-pre-wrap text-sm">{doc.description}</p>
              </div>
            )}

            {exam?.notes && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  Observações
                </p>
                <p className="whitespace-pre-wrap text-sm">{exam.notes}</p>
              </div>
            )}

            {exam && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Questões ({exam.questions.length})
                </p>
                {exam.questions.length === 0 ? (
                  <p className="text-sm text-muted">Nenhuma questão cadastrada.</p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {exam.questions.map((q) => (
                      <li
                        key={q.id}
                        className="flex gap-2 rounded-xl border border-line bg-canvas p-3 text-sm"
                      >
                        <span className="shrink-0 font-semibold text-muted">{q.position}.</span>
                        <span className="whitespace-pre-wrap">{q.content}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        )}

        {doc && tab === "anexos" && (
          <AttachmentList documentId={documentId} canEdit={doc.status.finalStatus === false} />
        )}

        {doc && tab === "historico" && (
          <ol className="flex flex-col gap-3">
            {doc.movements.map((m) => {
              const to = badgeFromStatus(m.toStatus);
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
                            <span className="ml-1.5 font-normal text-muted">→ {to.label}</span>
                          </>
                        )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {m.actor?.name ?? "—"} ·{" "}
                      {new Date(m.createdAt).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
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
        )}
      </div>

      {doc && (
        <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4">
          {["rascunho", "reprovado"].includes(doc.status.key) && doc.typeKey === "prova" && (
            <Link
              href={`/provas/${doc.id}/editar`}
              className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-primary no-underline"
            >
              <PencilSimpleIcon size={14} /> Editar
            </Link>
          )}
          {transitions.map((t) => (
            <button
              key={t.id}
              onClick={() => setPending(t)}
              className="cursor-pointer rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.06)]"
            >
              {t.label}
            </button>
          ))}
          {transitions.length === 0 && (
            <p className="text-xs text-muted">Nenhuma ação disponível para você neste status.</p>
          )}
          {(me?.role === "coordenador" || me?.role === "admin") && (
            <button
              onClick={() => setReassigning(true)}
              className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-primary"
            >
              <UserSwitchIcon size={14} /> Reatribuir
            </button>
          )}
        </footer>
      )}

      {pending && (
        <TransitionModal
          transition={pending}
          onCancel={() => setPending(null)}
          onConfirm={(comment) => runTransition(pending, comment)}
        />
      )}

      {reassigning && doc && (
        <ReassignModal
          documentId={documentId}
          currentAssigneeId={doc.assignee?.id ?? null}
          onCancel={() => setReassigning(false)}
          onDone={() => {
            setReassigning(false);
            onChanged?.();
          }}
        />
      )}
    </aside>
  );
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

/** Confirmação simples ou, quando `requiresComment`, justificativa obrigatória. */
function TransitionModal({
  transition,
  onCancel,
  onConfirm,
}: {
  transition: WorkflowTransition;
  onCancel: () => void;
  onConfirm: (comment?: string) => Promise<void>;
}) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (transition.requiresComment && comment.trim() === "") {
      setError("A justificativa é obrigatória para esta ação.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(comment.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível executar a ação.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold">{transition.label}</h2>
        <p className="mt-1 text-sm text-muted">
          {transition.requiresComment
            ? "Descreva o motivo — o autor verá esta justificativa no histórico."
            : "Confirma esta ação? O movimento ficará registrado no histórico."}
        </p>

        <textarea
          rows={4}
          autoFocus
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={transition.requiresComment ? "Justificativa (obrigatória)" : "Comentário (opcional)"}
          className="mt-4 w-full resize-y rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        {error && (
          <p role="alert" className="mt-2 text-sm text-[#993C1D]">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="cursor-pointer rounded-xl border border-line px-4 py-2 text-sm font-semibold text-muted"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-60"
          >
            {submitting ? "Executando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
