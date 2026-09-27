"use client";

import { GraduationCapIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, use, useState } from "react";

import { AuthApi } from "../../../lib/api/auth";

const MIN_PASSWORD_LENGTH = 8;

interface RedefinirSenhaPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default function RedefinirSenhaPage({ searchParams }: RedefinirSenhaPageProps) {
  const router = useRouter();
  const { token } = use(searchParams);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Validação local (senha curta, confirmação diferente) não invalida o link — sem o
  // convite para pedir outro. Erro da API (token invalido/expirado) sim.
  const [localError, setLocalError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    setApiError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setLocalError(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("As senhas não conferem.");
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthApi.resetPassword(token!, newPassword);
      router.replace("/login?motivo=senha-redefinida");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Não foi possível redefinir a senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16 text-ink">
      <section className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#3B82F6]">
            <GraduationCapIcon size={26} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AcadêmicaFlow</h1>
            <p className="mt-0.5 text-sm text-muted">Gestão Documental</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line-soft bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
          <h2 className="text-base font-semibold">Redefinir senha</h2>

          {!token ? (
            <>
              <p role="alert" className="mt-3 text-sm text-[#993C1D]">
                Link inválido.
              </p>
              <p className="mt-5 text-center text-sm">
                <Link href="/recuperar-senha">Pedir um novo link</Link>
              </p>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-sm text-muted">Escolha uma nova senha para entrar.</p>

              <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    Nova senha
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirmar nova senha
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>

                {localError && (
                  <p role="alert" className="text-sm text-[#993C1D]">
                    {localError}
                  </p>
                )}

                {apiError && (
                  <div role="alert">
                    <p className="text-sm text-[#993C1D]">{apiError}</p>
                    <p className="mt-1 text-sm">
                      <Link href="/recuperar-senha">Pedir um novo link</Link>
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.06)] disabled:cursor-default disabled:opacity-60"
                >
                  {isSubmitting ? "Salvando…" : "Redefinir senha"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
