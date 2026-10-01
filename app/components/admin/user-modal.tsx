"use client";

import { type FormEvent, useState } from "react";

import { AdminApi } from "../../../lib/api/admin";
import { ApiError } from "../../../lib/api/client";
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
  type AdminUser,
} from "../../../lib/api/dto/adminSchema";
import type { Role } from "../../../lib/api/dto/authSchema";
import { ROLE_LABELS } from "../../lib/data";

const FIELD = "w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Criar ou editar usuário. O mesmo modal serve aos dois casos, como `exam-form` serve criar e
 * editar prova: a diferença é que a senha só existe na criação e o e-mail não é editável.
 *
 * Papel e status ficam travados quando o admin edita a si mesmo — a API recusa com 409, e
 * oferecer um campo que sempre falha é pior que não oferecer.
 *
 * As opções de papel vêm de `manageableRoles`, que a API calcula. Ao editar, o papel atual do
 * usuário entra na lista mesmo se estiver fora do alcance: um select que abre em outro papel
 * mentiria sobre quem está na tela — e a opção extra fica desabilitada, porque salvá-la levaria
 * 403 (a API é quem decide; isto aqui é só conveniência).
 */
export default function UserModal({
  user,
  isSelf,
  manageableRoles,
  onClose,
  onSaved,
}: {
  user: AdminUser | null;
  isSelf: boolean;
  manageableRoles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(user?.role ?? manageableRoles[0]);
  const roleOptions =
    user && manageableRoles.includes(user.role) === false
      ? [user.role, ...manageableRoles]
      : manageableRoles;
  const [active, setActive] = useState(user?.active ?? true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsed = user
      ? adminUserUpdateSchema.safeParse({ name, role, active })
      : adminUserCreateSchema.safeParse({ name, email, password, role });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      if (user) {
        await AdminApi.updateUser(user.id, parsed.data as never);
      } else {
        await AdminApi.createUser(parsed.data as never);
      }
      onSaved();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Nao foi possivel salvar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-lg">
        <h2 className="mb-4 text-base font-semibold">{user ? "Editar usuário" : "Novo usuário"}</h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
            {fieldErrors.name && <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.name}</p>}
          </div>

          {!user && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">E-mail</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} />
                {fieldErrors.email && <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={FIELD}
                />
                {fieldErrors.password && (
                  <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.password}</p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Perfil</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSelf}
              className={`${FIELD} disabled:opacity-60`}
            >
              {roleOptions.map((item) => (
                <option
                  key={item}
                  value={item}
                  disabled={manageableRoles.includes(item) === false}
                >
                  {ROLE_LABELS[item]}
                </option>
              ))}
            </select>
            {isSelf && <p className="mt-1 text-xs text-muted">Você não pode alterar o próprio perfil.</p>}
          </div>

          {user && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                disabled={isSelf}
                onChange={(e) => setActive(e.target.checked)}
              />
              Ativo
            </label>
          )}

          {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
