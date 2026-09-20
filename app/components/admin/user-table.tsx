"use client";

import { CheckCircleIcon, MagnifyingGlassIcon, PencilSimpleIcon, PlusIcon, XCircleIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AdminApi } from "../../../lib/api/admin";
import { ApiError } from "../../../lib/api/client";
import type { AdminUser } from "../../../lib/api/dto/adminSchema";
import type { Role } from "../../../lib/api/dto/authSchema";
import { ROLE_LABELS } from "../../lib/data";
import UserModal from "./user-modal";

const ROLE_COLORS: Record<string, string> = {
  professor: "#185FA5",
  supervisor: "#BA7517",
  secretaria: "#993C1D",
  coordenador: "#0F6E56",
  admin: "#6D28D9",
};

const HEADERS = ["Usuário", "E-mail", "Perfil", "Status", "Ações"];

/**
 * Tabela de usuários (E4.3). A busca vai ao servidor em vez de filtrar em memória: a lista
 * cresce e o backend já resolve nome e e-mail em uma query indexada.
 *
 * O próprio usuário aparece com as ações de papel/status bloqueadas — a API recusa com 409
 * (um admin que se rebaixasse deixaria o sistema sem administrador), e a UI não deve oferecer
 * um botão que sempre falha. Pela mesma razão, linhas de papel fora de `manageableRoles` vêm sem
 * ações: a lista já chega filtrada pela API, então isso só aparece em quem vê todos os papéis.
 */
export default function UserTable({
  currentUserId,
  manageableRoles,
}: {
  currentUserId: number;
  manageableRoles: Role[];
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);

  // Debounce de verdade: a busca dispara a cada tecla e sem isso sairia uma request por
  // caractere. `useDeferredValue` não serve aqui — ele adia a renderização, não a chamada,
  // e num browser ocioso reenvia a cada letra (medido: 4 letras = 4 requests).
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: users = [], isPending, error } = useQuery({
    queryKey: ["admin", "users", debouncedSearch] as const,
    queryFn: () => AdminApi.listUsers(debouncedSearch),
    // Mantém a lista anterior na tela enquanto a busca nova carrega, em vez de piscar vazio.
    placeholderData: (previous) => previous,
  });

  const reload = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const toggleActive = useMutation({
    mutationFn: async (user: AdminUser) => {
      if (user.active) {
        await AdminApi.deactivateUser(user.id);
      } else {
        await AdminApi.updateUser(user.id, { name: user.name, role: user.role, active: true });
      }
    },
    onSuccess: () => reload(),
  });

  const failure = toggleActive.error ?? error;
  const loading = isPending;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <MagnifyingGlassIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar usuário..."
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
        >
          <PlusIcon size={15} /> Novo Usuário
        </button>
      </div>

      {failure && (
        <p role="alert" className="text-sm text-[#993C1D]">
          {failure instanceof ApiError ? failure.message : "Nao foi possivel carregar os usuarios"}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-canvas">
              {HEADERS.map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-muted">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2 py-[3px] text-[11px] font-semibold"
                    style={{
                      background: `${ROLE_COLORS[user.role]}1F`,
                      color: ROLE_COLORS[user.role],
                    }}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-semibold"
                    style={{
                      background: user.active ? "#E6F4F0" : "#FCEAE4",
                      color: user.active ? "#0F6E56" : "#993C1D",
                    }}
                  >
                    {user.active ? <CheckCircleIcon size={11} /> : <XCircleIcon size={11} />}
                    {user.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {manageableRoles.includes(user.role) === false ? (
                      <span className="text-xs text-muted">—</span>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditing(user)}
                          title="Editar"
                          className="cursor-pointer rounded-lg p-1.5 text-muted"
                        >
                          <PencilSimpleIcon size={15} />
                        </button>
                        <button
                          onClick={() => toggleActive.mutate(user)}
                          disabled={user.id === currentUserId}
                          title={user.id === currentUserId ? "Você não pode desativar a si mesmo" : user.active ? "Desativar" : "Reativar"}
                          className="cursor-pointer rounded-lg p-1.5 text-muted disabled:cursor-default disabled:opacity-40"
                        >
                          {user.active ? <XCircleIcon size={15} /> : <CheckCircleIcon size={15} />}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <p className="px-4 py-6 text-sm text-muted">Carregando…</p>}
        {!loading && users.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted">Nenhum usuário encontrado.</p>
        )}
      </div>

      {(creating || editing) && (
        <UserModal
          user={editing}
          isSelf={editing?.id === currentUserId}
          manageableRoles={manageableRoles}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}
