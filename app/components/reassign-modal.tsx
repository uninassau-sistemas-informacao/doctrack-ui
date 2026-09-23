"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminApi } from "../../lib/api/admin";
import { DocumentsApi } from "../../lib/api/documents";

const FIELD = "rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Reatribuição (E7.4, RF02.21). A lista de candidatos vem de `GET /users`, que já é hierárquico:
 * quem não pode ver um papel não o recebe na lista. Quem decide de fato é a API — 403 e 422 são
 * a fonte da verdade, e aparecem aqui como erro inline.
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
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-lg">
        <h2 className="mb-3 text-base font-semibold">Reatribuir responsável</h2>

        <label htmlFor="assignee" className="mb-1 block text-sm text-muted">
          Novo responsável
        </label>
        <select
          id="assignee"
          className={`${FIELD} w-full`}
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
        >
          <option value="">Selecione</option>
          {candidates.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>

        {error && (
          <p role="alert" className="mt-3 text-sm text-[#993C1D]">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted"
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
