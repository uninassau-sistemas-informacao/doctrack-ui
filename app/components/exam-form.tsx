"use client";

import { PlusIcon, TrashIcon, CaretUpIcon, CaretDownIcon, PaperclipIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ApiError } from "../../lib/api/client";
import { ExamsApi } from "../../lib/api/exams";
import { DocumentsApi } from "../../lib/api/documents";
import { examInputSchema, type Exam, type ExamInput } from "../../lib/api/dto/examSchema";
import type { Priority } from "../../lib/api/dto/documentSchema";
import { PRIORITY_CONFIG } from "../lib/data";

const FIELD = "rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Formulário de prova — serve `provas/nova` (sem `exam`) e `provas/[id]/editar` (com `exam`),
 * porque `POST /exams` e `PUT /exams/{id}` compartilham o mesmo corpo (`ExamRequest`).
 *
 * "Salvar e submeter" grava e, em seguida, dispara a transição `submeter` buscada em
 * `GET /documents/{id}/transitions` — a UI não guarda id de transição, quem manda é o motor.
 */
export default function ExamForm({ exam }: { exam?: Exam }) {
  const router = useRouter();
  const doc = exam?.document;

  const [title, setTitle] = useState(doc?.title ?? "");
  const [discipline, setDiscipline] = useState(exam?.discipline ?? "");
  const [classGroup, setClassGroup] = useState(exam?.classGroup ?? "");
  const [applicationDate, setApplicationDate] = useState(exam?.applicationDate ?? "");
  const [durationMinutes, setDurationMinutes] = useState(String(exam?.durationMinutes ?? 60));
  const [priority, setPriority] = useState<Priority>(doc?.priority ?? "media");
  const [deadline, setDeadline] = useState(doc?.deadline ?? "");
  const [notes, setNotes] = useState(exam?.notes ?? "");
  const [questions, setQuestions] = useState<string[]>(exam?.questions.map((q) => q.content) ?? []);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<null | "draft" | "submit">(null);

  function moveQuestion(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);
  }

  function buildInput(): ExamInput | null {
    const parsed = examInputSchema.safeParse({
      title,
      discipline,
      classGroup,
      applicationDate,
      durationMinutes: Number(durationMinutes),
      priority,
      deadline: deadline || null,
      notes: notes || null,
      // Questões em branco não vão para a API: o rascunho aceita lista vazia, e uma
      // linha vazia esquecida no formulário só viraria um 422 do backend.
      questions: questions.map((q) => q.trim()).filter(Boolean),
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return null;
    }

    setFieldErrors({});
    return parsed.data;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, mode: "draft" | "submit") {
    event.preventDefault();
    setFormError(null);

    const input = buildInput();
    if (!input) return;

    if (mode === "submit" && input.questions?.length === 0) {
      setFormError("Adicione pelo menos uma questão para submeter a prova.");
      return;
    }

    setSubmitting(mode);
    try {
      const saved = doc ? await ExamsApi.update(doc.id, input) : await ExamsApi.create(input);

      if (mode === "submit") {
        const transitions = await DocumentsApi.availableTransitions(saved.document.id);
        const submeter = transitions.find((t) => t.key === "submeter" || t.key === "resubmeter");
        if (!submeter) {
          setFormError("A prova foi salva, mas não está em um estado que permita submissão.");
          setSubmitting(null);
          return;
        }
        await DocumentsApi.transition(saved.document.id, submeter.id);
      }

      router.push(`/provas?documento=${saved.document.id}`);
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Não foi possível salvar a prova."
      );
      setSubmitting(null);
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, "draft")} noValidate className="flex flex-col gap-6">
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="mb-4 text-base font-semibold">Dados da prova</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Título" error={fieldErrors.title} className="col-span-2">
            <input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Disciplina" error={fieldErrors.discipline}>
            <input className={FIELD} value={discipline} onChange={(e) => setDiscipline(e.target.value)} />
          </Field>
          <Field label="Turma" error={fieldErrors.classGroup}>
            <input className={FIELD} value={classGroup} onChange={(e) => setClassGroup(e.target.value)} />
          </Field>
          <Field label="Data de aplicação" error={fieldErrors.applicationDate}>
            <input
              type="date"
              className={FIELD}
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
            />
          </Field>
          <Field label="Duração (minutos)" error={fieldErrors.durationMinutes}>
            <input
              type="number"
              min={1}
              max={600}
              className={FIELD}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </Field>
          <Field label="Prioridade">
            <select
              className={FIELD}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prazo para aprovação" error={fieldErrors.deadline}>
            <input
              type="date"
              className={FIELD}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>
          <Field label="Observações" className="col-span-2">
            <textarea
              rows={3}
              className={`${FIELD} resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Questões <span className="font-normal text-muted">({questions.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => setQuestions((q) => [...q, ""])}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-primary"
          >
            <PlusIcon size={14} /> Adicionar questão
          </button>
        </div>

        {questions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Nenhuma questão. O rascunho pode ser salvo assim, mas a submissão exige ao menos uma.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {questions.map((content, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="mt-2.5 w-6 shrink-0 text-center text-xs font-semibold text-muted">
                  {index + 1}
                </span>
                <textarea
                  rows={2}
                  value={content}
                  onChange={(e) =>
                    setQuestions((qs) => qs.map((q, i) => (i === index ? e.target.value : q)))
                  }
                  className={`${FIELD} min-w-0 flex-1 resize-y`}
                />
                <div className="flex shrink-0 flex-col gap-1">
                  <IconButton label="Mover para cima" onClick={() => moveQuestion(index, -1)}>
                    <CaretUpIcon size={13} />
                  </IconButton>
                  <IconButton label="Mover para baixo" onClick={() => moveQuestion(index, 1)}>
                    <CaretDownIcon size={13} />
                  </IconButton>
                </div>
                <IconButton
                  label="Remover questão"
                  onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== index))}
                >
                  <TrashIcon size={14} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
        {fieldErrors.questions && (
          <p className="mt-2 text-xs text-[#993C1D]">{fieldErrors.questions}</p>
        )}
      </section>

      {/* Anexos chegam no E7; a área fica visível e desabilitada para não sumir do fluxo. */}
      <section className="rounded-2xl border border-line bg-white p-5 opacity-60">
        <h2 className="mb-3 text-base font-semibold">Anexos</h2>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line py-8 text-center">
          <PaperclipIcon size={22} className="text-muted" />
          <p className="text-sm text-muted">Envio de anexos disponível em breve.</p>
        </div>
      </section>

      {formError && (
        <p role="alert" className="text-sm text-[#993C1D]">
          {formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="cursor-pointer rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting !== null}
          className="cursor-pointer rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-primary disabled:cursor-default disabled:opacity-60"
        >
          {submitting === "draft" ? "Salvando…" : "Salvar rascunho"}
        </button>
        <button
          type="button"
          disabled={submitting !== null}
          onClick={(e) =>
            handleSubmit(e as unknown as FormEvent<HTMLFormElement>, "submit")
          }
          className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.06)] disabled:cursor-default disabled:opacity-60"
        >
          {submitting === "submit" ? "Enviando…" : "Salvar e submeter"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-[#993C1D]">{error}</p>}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-6 cursor-pointer items-center justify-center rounded-lg border border-line text-muted"
    >
      {children}
    </button>
  );
}
