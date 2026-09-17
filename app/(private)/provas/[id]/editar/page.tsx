"use client";

import { use, useEffect, useState } from "react";

import { ExamsApi } from "../../../../../lib/api/exams";
import type { Exam } from "../../../../../lib/api/dto/examSchema";
import ExamForm from "../../../../components/exam-form";
import PageHeader from "../../../../components/page-header";

/**
 * Edição de prova. Carrega no cliente porque `lib/api/client` depende do cookie de sessão
 * enviado pelo browser (`credentials: "include"`); o guard de sessão é o layout privado.
 * O backend recusa a edição fora de `rascunho`/`reprovado` e por quem não é dono — aqui a
 * tela só antecipa o aviso, o 409/403 continua sendo a fonte da verdade.
 */
export default function EditarProvaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const documentId = Number(id);

  const [exam, setExam] = useState<Exam | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    ExamsApi.get(documentId)
      .then((data) => active && setExam(data))
      .catch((err: unknown) =>
        active && setError(err instanceof Error ? err.message : "Prova não encontrada.")
      );
    return () => {
      active = false;
    };
  }, [documentId]);

  const editable =
    exam !== null && ["rascunho", "reprovado"].includes(exam.document.status.key);

  return (
    <>
      <PageHeader
        title={exam ? exam.document.title : "Editar Prova"}
        subtitle={exam ? `${exam.discipline} · Turma ${exam.classGroup}` : undefined}
        backHref="/provas"
      />
      <div className="p-6">
        <div className="mx-auto max-w-3xl">
          {error && (
            <p role="alert" className="text-sm text-[#993C1D]">
              {error}
            </p>
          )}
          {!error && !exam && <p className="text-sm text-muted">Carregando…</p>}
          {exam && !editable && (
            <p className="rounded-xl border border-line bg-white p-5 text-sm text-muted">
              Esta prova está em <strong>{exam.document.status.label}</strong> e só pode ser
              editada em rascunho ou após reprovação.
            </p>
          )}
          {exam && editable && <ExamForm exam={exam} />}
        </div>
      </div>
    </>
  );
}
