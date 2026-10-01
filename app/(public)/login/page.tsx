"use client";

import { GraduationCapIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, use, useState } from "react";

import { AuthApi } from "../../../lib/api/auth";

const MOTIVO_MESSAGES: Record<string, string> = {
  inatividade: "Sua sessão expirou por inatividade.",
  "senha-redefinida": "Senha redefinida. Entre com a nova senha.",
};

interface LoginPageProps {
  searchParams: Promise<{ motivo?: string }>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const router = useRouter();
  const { motivo } = use(searchParams);
  const notice = motivo ? MOTIVO_MESSAGES[motivo] : undefined;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await AuthApi.login({ email, password });
      router.push("/");
      // refresh() revalida os Server Components (guard do layout privado) com o cookie novo.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16 text-ink">
      <section className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary">
            <GraduationCapIcon size={26} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AcadêmicaFlow</h1>
            <p className="mt-0.5 text-sm text-muted">Gestão Documental</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line-soft bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
          <h2 className="text-base font-semibold">Entrar</h2>
          <p className="mt-0.5 text-sm text-muted">
            Acesse o fluxo de provas e atas de avaliação.
          </p>

          {notice && (
            <p className="mt-4 rounded-xl bg-primary-soft px-3 py-2.5 text-sm text-ink">
              {notice}
            </p>
          )}

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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <p className="text-right text-sm">
                <Link href="/recuperar-senha">Esqueci minha senha</Link>
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.06)] disabled:cursor-default disabled:opacity-60"
            >
              {isSubmitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm">
            <Link href="/termos">Termos de uso e privacidade</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
