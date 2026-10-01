import Link from "next/link";

import BrandHeader from "../../components/brand-header";
import TermsText from "../../components/terms-text";

/** Termos de Uso e Política de Privacidade — público, sem sessão (E9/U3). */
export default function TermosPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16 text-ink">
      <section className="w-full max-w-lg">
        <BrandHeader />

        <div className="rounded-2xl border border-line-soft bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
          <h2 className="text-base font-semibold">Termos de uso e privacidade</h2>

          <div className="mt-5">
            <TermsText />
          </div>

          <p className="mt-5 text-center text-sm">
            <Link href="/login">Voltar</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
