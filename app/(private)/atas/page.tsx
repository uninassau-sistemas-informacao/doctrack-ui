"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

import { AuthApi } from "../../../lib/api/auth";
import { DocumentsApi } from "../../../lib/api/documents";
import { RecordsApi } from "../../../lib/api/records";
import { WorkflowApi } from "../../../lib/api/workflow";
import type { Priority } from "../../../lib/api/dto/documentSchema";
import type { RecordCard, RecordEntriesInput } from "../../../lib/api/dto/recordSchema";
import type { WorkflowStatus } from "../../../lib/api/dto/workflowSchema";
import DocumentDetailPanel from "../../components/document-detail";
import KanbanBoard from "../../components/kanban/board";
import RecordKanbanCard from "../../components/kanban/record-card";
import PageHeader from "../../components/page-header";
import RecordEntriesTable from "../../components/record-entries-table";
import { PRIORITY_CONFIG } from "../../lib/data";

const FILTER = "rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary";

/**
 * Quadro de atas (E5.4). Mesma mecânica do quadro de provas: colunas vêm de
 * `GET /document-types/ata`, e o arrasto procura a transição válida em
 * `GET /documents/{id}/transitions` — quem valida é o backend.
 *
 * O que muda é o painel: além do detalhe do documento, a ata mostra a tabela de lançamento
 * de notas. Ela só edita quando a ata está em rascunho e o logado é o solicitante, que é a
 * mesma regra do `PUT /records/{id}/entries`; fora disso a tabela é leitura.
 */
export default function AtasPage() {
  return (
    <Suspense>
      <AtasBoard />
    </Suspense>
  );
}

function AtasBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("documento");

  const queryClient = useQueryClient();

  const [discipline, setDiscipline] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [mine, setMine] = useState(false);

  const typeQuery = useQuery({
    // Mesma chave que o detalhe em `admin/type-list`: é a mesma chamada, um cache só.
    queryKey: ["document-types", "detail", "ata"] as const,
    queryFn: () => WorkflowApi.getType("ata"),
  });

  const recordsQuery = useQuery({
    queryKey: ["records", { priority: priority || null, mine }] as const,
    queryFn: () => RecordsApi.list({ priority: priority || undefined, mine: mine || undefined }),
  });

  /** Refaz a listagem depois de uma transição (arrasto ou painel de detalhe). */
  const reload = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["records"] });
  }, [queryClient]);

  const statuses: WorkflowStatus[] = typeQuery.data?.statuses ?? [];
  const records: RecordCard[] = useMemo(() => recordsQuery.data ?? [], [recordsQuery.data]);
  // Erro de arrasto não entra aqui: o quadro mostra o motivo no próprio card (`dropError`).
  const error = typeQuery.error ?? recordsQuery.error;

  // Disciplina vem da turma e não tem filtro na API; o recorte é no cliente, sobre o que a
  // listagem já trouxe — mesmo critério do quadro de provas.
  const disciplines = useMemo(
    () => [...new Set(records.map((r) => r.discipline))].sort(),
    [records]
  );
  const visible = useMemo(
    () => (discipline ? records.filter((r) => r.discipline === discipline) : records),
    [records, discipline]
  );

  // O Kanban é genérico sobre `Document`; o card de ata casa pelo id do documento.
  const documents = visible.map((r) => r.document);
  const recordByDocumentId = new Map(visible.map((r) => [r.document.id, r]));

  function select(id: number | null) {
    router.replace(id === null ? "/atas" : `/atas?documento=${id}`, { scroll: false });
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
        <PageHeader title="Gestão de Atas" subtitle={`${visible.length} ata(s) no quadro`}>
          <Link
            href="/atas/nova"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-[0_1px_2px_rgba(0,0,0,.06)]"
          >
            <PlusIcon size={16} /> Nova Ata
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
            Minhas atas
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {error && (
            <p role="alert" className="mb-3 text-sm text-[#993C1D]">
              {error.message}
            </p>
          )}
          <KanbanBoard
            statuses={statuses}
            items={documents}
            onCardClick={(doc) => select(doc.id)}
            onDropCard={handleDrop}
            renderCard={(doc) => {
              const record = recordByDocumentId.get(doc.id);
              return record ? <RecordKanbanCard record={record} /> : null;
            }}
          />
        </div>
      </div>

      {selectedId && (
        <RecordDetail key={selectedId} documentId={Number(selectedId)} onClose={() => select(null)} onChanged={reload} />
      )}
    </div>
  );
}

/** Chave do detalhe da ata aberta — declarada uma vez para a query e a invalidação não divergirem. */
const RECORD_DETAIL_KEY = (documentId: number) => ["records", "detail", documentId] as const;

/**
 * Painel da ata: o detalhe genérico (histórico e botões de transição) e, abaixo, o
 * lançamento de notas. As ações não são filtradas por papel aqui — `DocumentDetailPanel`
 * já renderiza só o que `GET /documents/{id}/transitions` devolve.
 */
function RecordDetail({
  documentId,
  onClose,
  onChanged,
}: {
  documentId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"] as const,
    queryFn: () => AuthApi.me(),
  });

  const recordQuery = useQuery({
    queryKey: RECORD_DETAIL_KEY(documentId),
    queryFn: () => RecordsApi.get(documentId),
  });

  const record = recordQuery.data ?? null;

  /**
   * Lançamento e segunda chamada mexem na ata aberta e na listagem. As duas invalidações são
   * explícitas de propósito: `["records"]` já casaria a chave do detalhe por prefixo, mas
   * depender desse casamento deixa a atualização do painel aberto refém do formato da chave
   * da listagem. Nomear as duas mantém o refetch do detalhe explícito para quem for mexer aqui.
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["records"] }),
      queryClient.invalidateQueries({ queryKey: RECORD_DETAIL_KEY(documentId) }),
    ]);
    onChanged();
  }, [queryClient, documentId, onChanged]);

  const editable =
    record !== null &&
    meQuery.data !== undefined &&
    record.document.status.key === "rascunho" &&
    record.document.requester?.id === meQuery.data.id;

  async function handleSave(input: RecordEntriesInput) {
    await RecordsApi.updateEntries(documentId, input);
    await refresh();
  }

  async function handleRetake(entryId: number) {
    await RecordsApi.createRetake(documentId, entryId);
    await refresh();
  }

  // O lançamento fica ao lado do painel, não dentro dele: `DocumentDetailPanel` tem largura
  // e rolagem próprias, e a tabela precisa de mais espaço que os 440px dele.
  return (
    <div className="flex h-full min-h-0 shrink-0">
      <section className="flex w-[520px] shrink-0 flex-col overflow-y-auto border-l border-line bg-canvas px-5 py-4">
        <h2 className="mb-3 text-base font-semibold">Lançamento de notas</h2>
        {recordQuery.error && (
          <p role="alert" className="text-sm text-[#993C1D]">
            {recordQuery.error.message}
          </p>
        )}
        {record && (
          <RecordEntriesTable
            // `dataUpdatedAt` muda a cada resposta do servidor, inclusive quando os valores
            // voltam iguais. O rascunho local da tabela é semeado na montagem, então remontar
            // aqui é o que descarta a edição local depois que a ata foi gravada.
            key={recordQuery.dataUpdatedAt}
            record={record}
            editable={editable}
            onSave={handleSave}
            onRetake={editable ? handleRetake : undefined}
          />
        )}
      </section>

      <DocumentDetailPanel
        documentId={documentId}
        onClose={onClose}
        onChanged={() => void refresh()}
      />
    </div>
  );
}
