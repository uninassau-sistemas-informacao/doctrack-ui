"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AccountApi } from "../../../lib/api/account";
import type { MeResponse } from "../../../lib/api/dto/authSchema";
import { ROLE_LABELS } from "../../lib/data";

const FIELD =
  "w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";
const FIELD_READONLY = "w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-muted";
const BUTTON =
  "self-start cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-60";

const MIN_PASSWORD_LENGTH = 8;

export default function ProfileForms({ me }: { me: MeResponse }) {
  return (
    <div className="flex max-w-lg flex-col gap-6">
      <DataCard me={me} />
      <PasswordCard />
    </div>
  );
}

/** Card "Dados": e-mail e papel só leitura (vem da API, não há o que editar aqui); só o nome muda. */
function DataCard({ me }: { me: MeResponse }) {
  const router = useRouter();
  const [name, setName] = useState(me.name);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (value: string) => AccountApi.updateName(value),
    onSuccess: () => {
      setSuccess(true);
      // A sidebar lê o nome do layout (Server Component) — refresh() é o jeito de atualizá-la
      // sem duplicar o `me` num estado de cliente.
      router.refresh();
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSuccess(false);
    mutation.mutate(name);
  }

  return (
    <div className="rounded-2xl border border-line-soft bg-surface p-6">
      <h2 className="text-base font-semibold">Dados</h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">E-mail</label>
          <p className={FIELD_READONLY}>{me.email}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Papel</label>
          <p className={FIELD_READONLY}>{ROLE_LABELS[me.role]}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nome
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSuccess(false);
            }}
            className={FIELD}
          />
        </div>

        {mutation.isError && (
          <p role="alert" className="text-sm text-danger">
            {mutation.error instanceof Error ? mutation.error.message : "Não foi possível salvar."}
          </p>
        )}
        {success && <p className="text-sm text-success">Nome atualizado.</p>}

        <button type="submit" disabled={mutation.isPending || name.trim().length === 0} className={BUTTON}>
          {mutation.isPending ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </div>
  );
}

/**
 * Card "Senha": validação local (tamanho e confirmação) antes de chamar a API — poupa uma volta
 * ao servidor por um erro que dá pra pegar aqui. A API ainda valida de novo do seu lado.
 */
function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => AccountApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSuccess(false);
    setValidationError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setValidationError(`A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("As senhas não coincidem.");
      return;
    }
    mutation.mutate();
  }

  const failure = validationError ?? (mutation.error instanceof Error ? mutation.error.message : null);

  return (
    <div className="rounded-2xl border border-line-soft bg-surface p-6">
      <h2 className="text-base font-semibold">Senha</h2>

      <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            Senha atual
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setSuccess(false);
            }}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className="text-sm font-medium">
            Nova senha
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setSuccess(false);
            }}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirmar nova senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setSuccess(false);
            }}
            className={FIELD}
          />
        </div>

        {failure && (
          <p role="alert" className="text-sm text-danger">
            {failure}
          </p>
        )}
        {success && (
          <p className="text-sm text-success">Senha alterada. As outras sessões foram encerradas.</p>
        )}

        <button type="submit" disabled={mutation.isPending} className={BUTTON}>
          {mutation.isPending ? "Salvando…" : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
