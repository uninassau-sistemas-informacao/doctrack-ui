"use client";

import { ArrowRightIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { AdminApi } from "../../../lib/api/admin";
import { ApiError } from "../../../lib/api/client";
import type { DocumentType, WorkflowStatus, WorkflowTransition } from "../../../lib/api/dto/workflowSchema";
import { WorkflowApi } from "../../../lib/api/workflow";
import { badgeFromStatus, ROLE_LABELS, type Role } from "../../lib/data";
import StatusModal from "./status-modal";
import TransitionModal from "./transition-modal";
import TypeModal from "./type-modal";

/**
 * Tipos de documento e o fluxo de cada um (E4.4).
 *
 * Duas chamadas por natureza da API, não por escolha: `GET /document-types` devolve os tipos
 * com `statuses`/`transitions` vazios, e só `GET /document-types/{key}` traz o detalhe. Então a
 * lista carrega os tipos e o tipo selecionado recarrega o detalhe.
 *
 * `listTypes` só devolve ativos — um tipo desativado sai desta tela junto com o menu. Para
 * reativar, é pelo banco; cobrir isso exigiria um `?includeInactive` na API (fora do E4.4).
 */
export default function TypeList() {
  const queryClient = useQueryClient();
  // `null` = ainda não escolheu nada nesta sessão; a seleção efetiva cai no primeiro tipo.
  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [creatingType, setCreatingType] = useState(false);
  const [editingStatus, setEditingStatus] = useState<WorkflowStatus | null>(null);
  const [creatingStatus, setCreatingStatus] = useState(false);
  const [editingTransition, setEditingTransition] = useState<WorkflowTransition | null>(null);
  const [creatingTransition, setCreatingTransition] = useState(false);

  const router = useRouter();

  /**
   * Recarrega esta tela e o menu. O `router.refresh()` reexecuta o layout privado (Server
   * Component), que é quem busca os tipos da sidebar — sem ele, um tipo criado aqui só
   * apareceria no menu no próximo carregamento de página.
   *
   * Não é um F5: o Next mescla o payload novo do servidor preservando o estado do client
   * (aba, tipo selecionado, scroll). Fica dentro do `reload` porque toda mutação de tipo
   * mexe no menu — criar, renomear, desativar e remover.
   */
  const reload = useCallback(() => {
    setError(null);
    void queryClient.invalidateQueries({ queryKey: ["document-types"] });
    router.refresh();
  }, [queryClient, router]);

  const typesQuery = useQuery({
    queryKey: ["document-types", "list"] as const,
    queryFn: () => WorkflowApi.listTypes(),
  });

  const types: DocumentType[] = typesQuery.data ?? [];

  // Derivada em vez de guardada por efeito: a escolha vale enquanto o tipo existir, e cai no
  // primeiro da lista na primeira carga ou quando o selecionado é apagado/desativado agora.
  const selectedKey =
    chosenKey && types.some((type) => type.key === chosenKey) ? chosenKey : (types[0]?.key ?? null);

  const detailQuery = useQuery({
    queryKey: ["document-types", "detail", selectedKey] as const,
    queryFn: () => WorkflowApi.getType(selectedKey as string),
    enabled: selectedKey !== null,
  });

  // Enquanto o detalhe do tipo recém-selecionado não chega, o cache ainda pode devolver o do
  // tipo anterior — mostrá-lo exibiria o fluxo errado sob o nome certo.
  const detail = detailQuery.data?.key === selectedKey ? detailQuery.data : null;

  const loaded = !typesQuery.isPending;
  const failure = error ?? typesQuery.error ?? detailQuery.error;

  async function handleRemoveType(type: DocumentType) {
    // A API desativa em vez de apagar quando há documentos — o texto cobre os dois casos.
    if (!confirm(`Remover o tipo "${type.name}"? Se houver documentos, ele será apenas desativado.`)) {
      return;
    }
    try {
      await AdminApi.removeType(type.id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel remover o tipo");
    }
  }

  async function handleDeleteStatus(status: WorkflowStatus) {
    if (!detail || !confirm(`Remover o status "${status.label}"?`)) return;
    try {
      await AdminApi.deleteStatus(detail.id, status.id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel remover o status");
    }
  }

  async function handleDeleteTransition(transition: WorkflowTransition) {
    if (!detail || !confirm(`Remover a transição "${transition.label}"?`)) return;
    try {
      await AdminApi.deleteTransition(detail.id, transition.id);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel remover a transicao");
    }
  }

  const statusByKey = (key: string): WorkflowStatus | undefined =>
    detail?.statuses.find((status) => status.key === key);

  function roleList(roles: string[]): string {
    if (roles.length === 0) return "—";
    return roles.map((role) => ROLE_LABELS[role as Role] ?? role).join(", ");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Tipos ativos e o fluxo de cada um. Um tipo novo aparece no menu sem deploy.
        </p>
        <button
          onClick={() => setCreatingType(true)}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
        >
          <PlusIcon size={15} /> Novo Tipo
        </button>
      </div>

      {failure && (
        <p role="alert" className="text-sm text-[#993C1D]">
          {typeof failure === "string"
            ? failure
            : failure instanceof ApiError
              ? failure.message
              : "Nao foi possivel carregar os tipos"}
        </p>
      )}

      {!loaded && <p className="text-sm text-muted">Carregando…</p>}

      {loaded && types.length === 0 && (
        <p className="rounded-2xl border border-line bg-white px-4 py-6 text-sm text-muted">
          Nenhum tipo de documento cadastrado.
        </p>
      )}

      {types.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <button
              key={type.key}
              onClick={() => setChosenKey(type.key)}
              className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium ${
                type.key === selectedKey
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-white text-muted"
              }`}
            >
              {type.name}
              <span className="ml-2 text-xs opacity-70">{type.abbreviation}</span>
            </button>
          ))}
        </div>
      )}

      {detail && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{detail.name}</p>
              <p className="text-xs text-muted">
                chave <code>{detail.key}</code> · sigla {detail.abbreviation} ·{" "}
                {detail.defaultDeadlineDays != null
                  ? `prazo padrão de ${detail.defaultDeadlineDays} dia(s)`
                  : "sem prazo padrão"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setEditingType(detail)}
                title="Editar tipo"
                className="cursor-pointer rounded-lg p-1.5 text-muted"
              >
                <PencilSimpleIcon size={15} />
              </button>
              <button
                onClick={() => handleRemoveType(detail)}
                title="Remover tipo"
                className="cursor-pointer rounded-lg p-1.5 text-muted"
              >
                <TrashIcon size={15} />
              </button>
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-line bg-white">
            <header className="flex items-center justify-between border-b border-line bg-canvas px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Status</h3>
              <button
                onClick={() => setCreatingStatus(true)}
                className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary"
              >
                <PlusIcon size={13} /> Adicionar
              </button>
            </header>

            {detail.statuses.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted">
                Nenhum status. O fluxo precisa de ao menos um status inicial.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {detail.statuses.map((status) => {
                  const badge = badgeFromStatus(status);
                  return (
                    <li key={status.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-8 shrink-0 text-xs text-muted">{status.position}</span>
                      <span
                        className="rounded-full px-2 py-[3px] text-[11px] font-semibold"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                      <code className="text-xs text-muted">{status.key}</code>
                      {status.initial && (
                        <span className="rounded-full bg-canvas px-2 py-[2px] text-[10px] font-semibold text-muted">
                          inicial
                        </span>
                      )}
                      {status.finalStatus && (
                        <span className="rounded-full bg-canvas px-2 py-[2px] text-[10px] font-semibold text-muted">
                          final
                        </span>
                      )}
                      <div className="ml-auto flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => setEditingStatus(status)}
                          title="Editar status"
                          className="cursor-pointer rounded-lg p-1.5 text-muted"
                        >
                          <PencilSimpleIcon size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteStatus(status)}
                          title="Remover status"
                          className="cursor-pointer rounded-lg p-1.5 text-muted"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-white">
            <header className="flex items-center justify-between border-b border-line bg-canvas px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Transições</h3>
              <button
                onClick={() => setCreatingTransition(true)}
                disabled={detail.statuses.length === 0}
                title={detail.statuses.length === 0 ? "Cadastre os status antes" : undefined}
                className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary disabled:cursor-default disabled:opacity-40"
              >
                <PlusIcon size={13} /> Adicionar
              </button>
            </header>

            {detail.transitions.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted">Nenhuma transição — o documento não sai do lugar.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {["Ação", "De → Para", "Quem executa", "Notifica", "Comentário", ""].map((header) => (
                      <th key={header} className="px-4 py-2 text-left text-xs font-semibold text-muted">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.transitions.map((transition) => (
                    <tr key={transition.id} className="border-t border-line">
                      <td className="px-4 py-2.5 font-medium">{transition.label}</td>
                      <td className="px-4 py-2.5 text-muted">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          {statusByKey(transition.fromStatusKey)?.label ?? transition.fromStatusKey}
                          <ArrowRightIcon size={12} />
                          {statusByKey(transition.toStatusKey)?.label ?? transition.toStatusKey}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{roleList(transition.allowedRoles)}</td>
                      <td className="px-4 py-2.5 text-muted">{roleList(transition.notifyRoles)}</td>
                      <td className="px-4 py-2.5 text-muted">{transition.requiresComment ? "Exige" : "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingTransition(transition)}
                            title="Editar transição"
                            className="cursor-pointer rounded-lg p-1.5 text-muted"
                          >
                            <PencilSimpleIcon size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTransition(transition)}
                            title="Remover transição"
                            className="cursor-pointer rounded-lg p-1.5 text-muted"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {(creatingType || editingType) && (
        <TypeModal
          type={editingType}
          onClose={() => {
            setCreatingType(false);
            setEditingType(null);
          }}
          onSaved={(saved) => {
            // Tipo novo passa a ser o selecionado — senão o admin cria e não vê o fluxo vazio
            // que precisa preencher em seguida.
            setCreatingType(false);
            setEditingType(null);
            setChosenKey(saved.key);
            reload();
          }}
        />
      )}

      {detail && (creatingStatus || editingStatus) && (
        <StatusModal
          typeId={detail.id}
          status={editingStatus}
          nextPosition={detail.statuses.length}
          onClose={() => {
            setCreatingStatus(false);
            setEditingStatus(null);
          }}
          onSaved={() => {
            setCreatingStatus(false);
            setEditingStatus(null);
            reload();
          }}
        />
      )}

      {detail && (creatingTransition || editingTransition) && (
        <TransitionModal
          typeId={detail.id}
          statuses={detail.statuses}
          transition={editingTransition}
          onClose={() => {
            setCreatingTransition(false);
            setEditingTransition(null);
          }}
          onSaved={() => {
            setCreatingTransition(false);
            setEditingTransition(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
