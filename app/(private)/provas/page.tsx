"use client";

import { PlusIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { DocumentsApi } from "../../../lib/api/documents";
import { ExamsApi } from "../../../lib/api/exams";
import { WorkflowApi } from "../../../lib/api/workflow";
import type { Priority } from "../../../lib/api/dto/documentSchema";
import type { ExamCard } from "../../../lib/api/dto/examSchema";
import type { WorkflowStatus } from "../../../lib/api/dto/workflowSchema";
import DocumentDetailPanel from "../../components/document-detail";
import KanbanBoard from "../../components/kanban/board";
import ExamKanbanCard from "../../components/kanban/exam-card";
import PageHeader from "../../components/page-header";
import { PRIORITY_CONFIG } from "../../lib/data";

const FILTER = "rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary";

/**
 * Quadro de provas (E2.4 + E2.6). As colunas vêm de `GET /document-types/prova`, não de
 * constante: status cadastrado no E4 aparece sozinho.
 *
 * O arrasto (E2.6) usa as mesmas regras do painel de detalhe: procura em
 * `GET /documents/{id}/transitions` uma transição que leve ao status de destino. Sem
 * transição disponível, o card volta e a UI mostra o motivo — quem valida é o backend.
 */
export default function ProvasPage() {
  return (
    <Suspense>
      <ProvasBoard />
    </Suspense>
  );
}

function ProvasBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("documento");

  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [exams, setExams] = useState<ExamCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [discipline, setDiscipline] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [mine, setMine] = useState(false);

  // `reloadKey` força o refetch depois de uma transição (arrasto ou painel de detalhe),
  // sem duplicar a chamada da API fora do efeito.
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    WorkflowApi.getType("prova")
      .then((type) => active && setStatuses(type.statuses))
      .catch(
        (err: unknown) =>
          active &&
          setError(err instanceof Error ? err.message : "Não foi possível carregar o fluxo.")
      );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    ExamsApi.list({ priority: priority || undefined, mine: mine || undefined })
      .then((data) => active && setExams(data))
      .catch(
        (err: unknown) =>
          active &&
          setError(err instanceof Error ? err.message : "Não foi possível carregar as provas.")
      );
    return () => {
      active = false;
    };
  }, [priority, mine, reloadKey]);

  // Disciplina é texto livre no satélite e não tem filtro na API; o recorte é no cliente,
  // sobre o que a listagem já trouxe.
  const disciplines = useMemo(
    () => [...new Set(exams.map((e) => e.discipline))].sort(),
    [exams]
  );
  const visible = useMemo(
    () => (discipline ? exams.filter((e) => e.discipline === discipline) : exams),
    [exams, discipline]
  );

  // O Kanban é genérico sobre `Document`; o card de prova casa pelo id do documento.
  const documents = visible.map((e) => e.document);
  const examByDocumentId = new Map(visible.map((e) => [e.document.id, e]));

  function select(id: number | null) {
    router.replace(id === null ? "/provas" : `/provas?documento=${id}`, { scroll: false });
  }

  async function handleDrop(
    document: { id: number },
    target: WorkflowStatus
  ): Promise<string | null> {
    try {
      const available = await DocumentsApi.availableTransitions(document.id);
      const transition = available.find((t) => t.toStatusKey === target.key);

      if (!transition) {
        return `Não é possível mover para "${target.label}" a partir deste status.`;
      }
      if (transition.requiresComment) {
        select(document.id);
        return `"${transition.label}" exige uma justificativa — use o painel de detalhe.`;
      }

      await DocumentsApi.transition(document.id, transition.id);
      reload();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Não foi possível mover o documento.";
    }
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PageHeader title="Gestão de Provas" subtitle={`${visible.length} prova(s) no quadro`}>
          <Link
            href="/provas/nova"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-[0_1px_2px_rgba(0,0,0,.06)]"
          >
            <PlusIcon size={16} /> Nova Prova
          </Link>
        </PageHeader>

        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3">
          <select className={FILTER} value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
            <option value="">Todas as disciplinas</option>
            {disciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className={FILTER}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority | "")}
          >
            <option value="">Todas as prioridades</option>
            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
            Minhas provas
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {error && (
            <p role="alert" className="mb-3 text-sm text-[#993C1D]">
              {error}
            </p>
          )}
          <KanbanBoard
            statuses={statuses}
            items={documents}
            onCardClick={(doc) => select(doc.id)}
            onDropCard={handleDrop}
            renderCard={(doc) => {
              const exam = examByDocumentId.get(doc.id);
              return exam ? <ExamKanbanCard exam={exam} /> : null;
            }}
          />
        </div>
      </div>

      {selectedId && (
        <DocumentDetailPanel
          key={selectedId}
          documentId={Number(selectedId)}
          onClose={() => select(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
