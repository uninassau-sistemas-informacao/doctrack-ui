"use client";

import { GraduationCapIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { ApiError } from "../../../lib/api/client";
import { AuthApi } from "../../../lib/api/auth";

const GENERIC_MESSAGE =
  "Se o e-mail estiver cadastrado, um link de redefinição foi gerado. Procure o administrador do sistema para recebê-lo.";
const RATE_LIMIT_MESSAGE = "Muitas tentativas. Aguarde um minuto.";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimited, setRateLimited] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRateLimited(null);
    setIsSubmitting(true);
    try {
      await AuthApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      // Enumeração de e-mail: qualquer erro que não seja 429 mostra a mesma
      // mensagem genérica do sucesso, para não revelar se o e-mail existe.
      if (err instanceof ApiError && err.status === 429) {
        setRateLimited(RATE_LIMIT_MESSAGE);
      } else {
        setSent(true);
      }
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
          <h2 className="text-base font-semibold">Recuperar senha</h2>
          <p className="mt-0.5 text-sm text-muted">
            Informe seu e-mail para gerar um link de redefinição.
          </p>

          {sent ? (
            <p className="mt-5 rounded-xl bg-primary-soft px-3 py-2.5 text-sm text-ink">
              {GENERIC_MESSAGE}
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              {rateLimited && (
                <p role="alert" className="text-sm text-[#993C1D]">
                  {rateLimited}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.06)] disabled:cursor-default disabled:opacity-60"
              >
                {isSubmitting ? "Enviando…" : "Enviar link"}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm">
            <Link href="/login">Voltar para o login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
