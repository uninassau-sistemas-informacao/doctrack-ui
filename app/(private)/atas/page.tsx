"use client";

import { CaretRightIcon, ClipboardTextIcon, PlusIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

import { AuthApi } from "../../../lib/api/auth";
import { RecordsApi } from "../../../lib/api/records";
import { WorkflowApi } from "../../../lib/api/workflow";
import type { Priority } from "../../../lib/api/dto/documentSchema";
import type { RecordCard, RecordEntriesInput } from "../../../lib/api/dto/recordSchema";
import { StatusPill } from "../../components/badges";
import BoardHeader, { BOARD_ACTION, FILTER_SELECT } from "../../components/board-header";
import DocumentDetailPanel from "../../components/document-detail";
import RecordEntriesTable from "../../components/record-entries-table";
import { PRIORITY_CONFIG, formatDate, soft } from "../../lib/data";

/**
 * Gestão de atas (E5.4): lista de atas por status, como o protótipo (GradeManagement.tsx) e
 * o E5.4 descrevem — não Kanban. A ordem segue a posição do status no fluxo (`GET
 * /document-types/ata`), então status novo do E4 entra no lugar certo sem código.
 *
 * As transições acontecem no painel de detalhe, que só oferece o que
 * `GET /documents/{id}/transitions` devolve. Ao lado dele, a tabela de lançamento de notas:
 * edita só em rascunho e para o solicitante, a mesma regra do `PUT /records/{id}/entries`.
 */
export default function AtasPage() {
  return (
    <Suspense>
      <AtasList />
    </Suspense>
  );
}

function AtasList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("documento");

  const queryClient = useQueryClient();

  const [discipline, setDiscipline] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState("");

  const typeQuery = useQuery({
    // Mesma chave que o detalhe em `admin/type-list`: é a mesma chamada, um cache só.
    queryKey: ["document-types", "detail", "ata"] as const,
    queryFn: () => WorkflowApi.getType("ata"),
  });

  const recordsQuery = useQuery({
    queryKey: ["records", { priority: priority || null, mine }] as const,
    queryFn: () => RecordsApi.list({ priority: priority || undefined, mine: mine || undefined }),
  });

  /** Refaz a listagem depois de uma transição ou lançamento no painel. */
  const reload = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["records"] });
  }, [queryClient]);

  const records: RecordCard[] = useMemo(() => recordsQuery.data ?? [], [recordsQuery.data]);
  const error = typeQuery.error ?? recordsQuery.error;

  // Disciplina vem da turma e não tem filtro na API; o recorte é no cliente, sobre o que a
  // listagem já trouxe — mesmo critério do quadro de provas.
  const disciplines = useMemo(
    () => [...new Set(records.map((r) => r.discipline))].sort(),
    [records]
  );

  const visible = useMemo(() => {
    const position = new Map((typeQuery.data?.statuses ?? []).map((st) => [st.key, st.position]));
    const term = search.trim().toLowerCase();
    return records
      .filter(
        (r) =>
          (!discipline || r.discipline === discipline) &&
          (!term ||
            `${r.document.title} ${r.discipline} ${r.classGroupCode}`.toLowerCase().includes(term))
      )
      .sort(
        (a, b) =>
          (position.get(a.document.status.key) ?? 99) - (position.get(b.document.status.key) ?? 99) ||
          b.date.localeCompare(a.date)
      );
  }, [records, discipline, search, typeQuery.data]);
  const activeFilters = [discipline, priority, mine].filter(Boolean).length;

  function select(id: number | null) {
    router.replace(id === null ? "/atas" : `/atas?documento=${id}`, { scroll: false });
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Ata aberta ocupa a tela no lugar da lista, como no protótipo; o X do painel volta. */}
      <div className={`min-w-0 flex-1 flex-col overflow-hidden ${selectedId ? "hidden" : "flex"}`}>
        <BoardHeader
          title="Gestão de Atas"
          subtitle="Lançamento de notas, validação e homologação de atas"
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Buscar ata..."
          activeFilters={activeFilters}
          onClearFilters={() => {
            setDiscipline("");
            setPriority("");
            setMine(false);
          }}
          action={
            <Link href="/atas/nova" className={BOARD_ACTION}>
              <PlusIcon size={15} /> Nova Ata
            </Link>
          }
          filters={
            <>
              <select className={FILTER_SELECT} value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                <option value="">Todas as disciplinas</option>
                {disciplines.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                className={FILTER_SELECT}
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
            </>
          }
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {error && (
            <p role="alert" className="mb-3 text-sm text-danger">
              {error.message}
            </p>
          )}

          {!recordsQuery.isPending && visible.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface px-4 py-16 text-center">
              <div className="mb-3 rounded-xl bg-primary-soft p-4">
                <ClipboardTextIcon size={28} className="block text-primary" />
              </div>
              <p className="mb-1 text-sm font-semibold">Nenhuma ata encontrada</p>
              <p className="max-w-[240px] text-xs text-muted">
                {records.length === 0 ? "Clique em Nova Ata para começar." : "Ajuste a busca ou os filtros."}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {visible.map((record) => (
              <RecordRow
                key={record.document.id}
                record={record}
                selected={String(record.document.id) === selectedId}
                onClick={() => select(record.document.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedId && (
        <RecordDetail key={selectedId} documentId={Number(selectedId)} onClose={() => select(null)} onChanged={reload} />
      )}
    </div>
  );
}

/**
 * Linha da lista (protótipo). Alunos e média ficam de fora: a listagem (`RecordCardResponse`)
 * não traz as entradas, e buscá-las por ata seria uma consulta por linha.
 */
function RecordRow({
  record,
  selected,
  onClick,
}: {
  record: RecordCard;
  selected: boolean;
  onClick: () => void;
}) {
  const { document } = record;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full cursor-pointer rounded-2xl border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-primary" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">
              {record.discipline} — Turma {record.classGroupCode}
            </h3>
            <StatusPill status={document.status} />
            {document.protocolNumber && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-success"
                style={{ background: soft("var(--success)") }}
              >
                {document.protocolNumber}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted">
            <span>{document.requester?.name ?? "—"}</span>
            <span>{record.evaluationType}</span>
            <span>{formatDate(record.date)}</span>
            {document.title !== `${record.discipline} — Turma ${record.classGroupCode}` && (
              <span className="truncate">{document.title}</span>
            )}
          </div>
        </div>
        <CaretRightIcon size={18} className="shrink-0 text-muted" />
      </div>
    </button>
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
    <div className="flex h-full min-h-0 min-w-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-canvas px-6 py-5">
        <h2 className="mb-3 text-base font-semibold">Lançamento de notas</h2>
        {recordQuery.error && (
          <p role="alert" className="text-sm text-danger">
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
