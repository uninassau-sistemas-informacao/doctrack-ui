"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccountApi } from "../../lib/api/account";
import { AuthApi } from "../../lib/api/auth";

/** Ações do bloqueio de aceite de termos (E9/U3): aceitar e seguir, ou sair. */
export default function AcceptTermsButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    setIsSubmitting(true);
    try {
      await AccountApi.acceptTerms();
      router.replace("/");
      // refresh() revalida o guard do layout privado com o termsPending novo (false).
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o aceite.");
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await AuthApi.logout();
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isSubmitting || isLoggingOut}
          className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.06)] disabled:cursor-default disabled:opacity-60"
        >
          {isSubmitting ? "Registrando…" : "Li e aceito os termos"}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isSubmitting || isLoggingOut}
          className="cursor-pointer rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-ink disabled:cursor-default disabled:opacity-60"
        >
          {isLoggingOut ? "Saindo…" : "Sair"}
        </button>
      </div>
    </div>
  );
}
