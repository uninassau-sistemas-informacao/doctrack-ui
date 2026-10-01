"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminApi } from "../../lib/api/admin";
import { DocumentsApi } from "../../lib/api/documents";

const FIELD = "rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Reatribuição (E7.4, RF02.21). A lista de candidatos vem de `GET /users`, que é a lista de
 * gestão de usuários (hierarquia de `Role.manages()`) e não a de possíveis responsáveis — por
 * isso um coordenador não vê aqui outros coordenadores nem a si mesmo, embora a API aceite
 * qualquer usuário ativo que enxergue o documento. Um endpoint próprio de candidatos a
 * responsável fica para depois. Quem decide de fato é a API — 403 e 422 são a fonte da
 * verdade, e aparecem aqui como erro inline.
 */
export default function ReassignModal({
  documentId,
  currentAssigneeId,
  onCancel,
  onDone,
}: {
  documentId: number;
  currentAssigneeId: number | null;
  onCancel: () => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", ""] as const,
    queryFn: () => AdminApi.listUsers(""),
  });

  const mutation = useMutation({
    mutationFn: (id: number) => DocumentsApi.reassign(documentId, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents", documentId] });
      onDone();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Não foi possível reatribuir o documento."),
  });

  const candidates = (usersQuery.data ?? []).filter(
    (user) => user.active && user.id !== currentAssigneeId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-lg">
        <h2 className="mb-3 text-base font-semibold">Reatribuir responsável</h2>

        <label htmlFor="assignee" className="mb-1 block text-sm text-muted">
          Novo responsável
        </label>
        <select
          id="assignee"
          className={`${FIELD} w-full`}
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          disabled={usersQuery.isPending}
        >
          <option value="">Selecione</option>
          {candidates.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>

        {usersQuery.isPending && (
          <p className="mt-2 text-sm text-muted">Carregando usuários...</p>
        )}

        {usersQuery.error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {usersQuery.error instanceof Error
              ? usersQuery.error.message
              : "Não foi possível carregar a lista de usuários."}
          </p>
        )}

        {!usersQuery.isPending && !usersQuery.error && candidates.length === 0 && (
          <p role="alert" className="mt-2 text-sm text-danger">
            Nenhum responsável disponível para reatribuição.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={mutation.isPending}
            className="cursor-pointer rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted disabled:cursor-default disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={assigneeId === "" || mutation.isPending}
            onClick={() => {
              setError(null);
              mutation.mutate(Number(assigneeId));
            }}
            className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-60"
          >
            {mutation.isPending ? "Reatribuindo..." : "Reatribuir"}
          </button>
        </div>
      </div>
    </div>
  );
}
