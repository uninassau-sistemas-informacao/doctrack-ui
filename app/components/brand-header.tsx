"use client";

import { GraduationCapIcon } from "@phosphor-icons/react";

/**
 * Cabeçalho de marca (logo + nome) das telas públicas. `@phosphor-icons/react` usa contexto
 * internamente e por isso só roda em Client Component — extraído para cá porque
 * `/aceite-termos` precisa continuar Server Component (usa `cookies()`/`redirect()`).
 */
export default function BrandHeader() {
  return (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary">
        <GraduationCapIcon size={26} color="#fff" />
      </div>
      <div>
        <h1 className="text-xl font-bold">AcadêmicaFlow</h1>
        <p className="mt-0.5 text-sm text-muted">Gestão Documental</p>
      </div>
    </div>
  );
}
