"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use, useCallback, useMemo, useState } from "react";

import { DocumentsApi } from "../../../../lib/api/documents";
import { WorkflowApi } from "../../../../lib/api/workflow";
import type { Priority } from "../../../../lib/api/dto/documentSchema";
import type { WorkflowStatus } from "../../../../lib/api/dto/workflowSchema";
import DocumentDetailPanel from "../../../components/document-detail";
import KanbanBoard from "../../../components/kanban/board";
import DocumentKanbanCard from "../../../components/kanban/document-card";
import BoardHeader, { BOARD_ACTION, FILTER_SELECT } from "../../../components/board-header";
import { PRIORITY_CONFIG } from "../../../lib/data";

/**
 * Quadro genérico (E7.3): serve qualquer tipo de documento sem satélite próprio. As colunas
 * vêm de `GET /document-types/{tipo}` — um tipo cadastrado pelo admin aparece sozinho, sem
 * deploy. Estrutura idêntica a `provas/page.tsx`, sem filtro de disciplina (não existe fora
 * do satélite de prova) e sem `Map` de satélite: o card mostra só campos do núcleo.
 */
export default function DocumentosTipoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = use(params);
  return (
    <Suspense>
      <DocumentosBoard tipo={tipo} />
    </Suspense>
  );
}

function DocumentosBoard({ tipo }: { tipo: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("documento");

  const queryClient = useQueryClient();

  const [priority, setPriority] = useState<Priority | "">("");
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState("");

  const typeQuery = useQuery({
    // Mesma chave que o detalhe em `admin/type-list`: é a mesma chamada, um cache só.
    queryKey: ["document-types", "detail", tipo] as const,
    queryFn: () => WorkflowApi.getType(tipo),
  });

  const documentsQuery = useQuery({
    queryKey: ["documents", { type: tipo, priority: priority || null, mine }] as const,
    queryFn: () => DocumentsApi.list({ type: tipo, priority: priority || undefined, mine: mine || undefined }),
  });

  /** Refaz a listagem depois de uma transição (arrasto ou painel de detalhe). */
  const reload = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["documents"] });
  }, [queryClient]);

  const statuses: WorkflowStatus[] = typeQuery.data?.statuses ?? [];
  const documents = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = documentsQuery.data ?? [];
    return term ? all.filter((d) => d.title.toLowerCase().includes(term)) : all;
  }, [documentsQuery.data, search]);
  const activeFilters = [priority, mine].filter(Boolean).length;
  const error = typeQuery.error ?? documentsQuery.error;

  function select(id: number | null) {
    router.replace(id === null ? `/documentos/${tipo}` : `/documentos/${tipo}?documento=${id}`, {
      scroll: false,
    });
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
        <BoardHeader
          title={typeQuery.data?.name ?? "Documentos"}
          subtitle={`${documents.length} documento(s) ${activeFilters > 0 || search ? "(filtrados)" : "no total"}`}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Buscar documento..."
          activeFilters={activeFilters}
          onClearFilters={() => {
            setPriority("");
            setMine(false);
          }}
          action={
            <Link href={`/documentos/${tipo}/novo`} className={BOARD_ACTION}>
              <PlusIcon size={15} /> Novo
            </Link>
          }
          filters={
            <>
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
                Meus documentos
              </label>
            </>
          }
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          {error && (
            <p role="alert" className="mb-3 text-sm text-danger">
              {error.message}
            </p>
          )}
          <KanbanBoard
            statuses={statuses}
            items={documents}
            onCardClick={(doc) => select(doc.id)}
            onDropCard={handleDrop}
            renderCard={(doc) => <DocumentKanbanCard document={doc} />}
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
