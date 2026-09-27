import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchMe } from "../../lib/api/auth-server";
import BrandHeader from "../components/brand-header";
import TermsText from "../components/terms-text";
import AcceptTermsButton from "./accept-terms-button";

/**
 * Bloqueio de aceite obrigatório de termos (E9/U3). Fica FORA de `(private)` de propósito: o
 * guard de `app/(private)/layout.tsx` redireciona para cá quando `termsPending` é `true`, e se
 * esta página também estivesse dentro do grupo privado o mesmo guard voltaria a redirecionar
 * para ela mesma — loop infinito.
 *
 * Guard próprio, no mesmo padrão do layout privado: sem sessão → `/login`; sessão sem termo
 * pendente → `/` (evita reabrir a tela por engano após o aceite ou por navegação direta).
 */
export default async function AceiteTermosPage() {
  const cookieStore = await cookies();
  const me = await fetchMe(cookieStore.toString());

  if (!me) {
    redirect("/login");
  }
  if (!me.termsPending) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16 text-ink">
      <section className="w-full max-w-lg">
        <BrandHeader />

        <div className="rounded-2xl border border-line-soft bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
          <h2 className="text-base font-semibold">Aceite os termos para continuar</h2>
          <p className="mt-0.5 text-sm text-muted">
            Atualizamos os Termos de Uso e a Política de Privacidade. Leia e aceite para acessar o
            sistema.
          </p>

          <div className="mt-5 max-h-96 overflow-y-auto rounded-xl border border-line bg-canvas p-4">
            <TermsText />
          </div>

          <AcceptTermsButton />
        </div>
      </section>
    </main>
  );
}
