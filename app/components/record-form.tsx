"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ApiError } from "../../lib/api/client";
import { ClassGroupsApi } from "../../lib/api/classGroups";
import { RecordsApi } from "../../lib/api/records";
import { recordInputSchema } from "../../lib/api/dto/recordSchema";
import type { Priority } from "../../lib/api/dto/documentSchema";
import { PRIORITY_CONFIG } from "../lib/data";

const FIELD = "rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Criação de ata (E5.4). Só criação: depois que a ata existe, o que se edita são as notas,
 * na própria tela do quadro — por isso não há variante de edição como em `exam-form`.
 *
 * A turma é texto com sugestões (`<datalist>`): código que bate com uma turma existente manda o
 * id e a ata nasce com a lista de chamada dela (UC11); código novo vai como `classGroupCode` e a
 * API cria a turma, sem alunos — quem vincula alunos é a aba Turmas da administração.
 */
export default function RecordForm() {
  const router = useRouter();

  const classGroupsQuery = useQuery({
    queryKey: ["class-groups", "list"] as const,
    queryFn: () => ClassGroupsApi.list(),
  });
  const classGroups = classGroupsQuery.data ?? [];

  const [title, setTitle] = useState("");
  const [classGroupText, setClassGroupText] = useState("");
  const [evaluationType, setEvaluationType] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const existingGroup = classGroups.find(
      (group) => group.code.toLowerCase() === classGroupText.trim().toLowerCase(),
    );
    if (classGroupText.trim() === "") {
      setFieldErrors({ classGroupCode: "Turma é obrigatória" });
      return;
    }

    const parsed = recordInputSchema.safeParse({
      title,
      description: description || null,
      priority,
      deadline: deadline || null,
      classGroupId: existingGroup?.id ?? null,
      classGroupCode: existingGroup ? null : classGroupText.trim(),
      evaluationType,
      date,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const saved = await RecordsApi.create(parsed.data);
      router.push(`/atas?documento=${saved.document.id}`);
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Não foi possível salvar a ata."
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold">Dados da ata</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Título" error={fieldErrors.title} className="sm:col-span-2">
            <input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Turma" error={fieldErrors.classGroupCode}>
            <input
              className={FIELD}
              list="class-groups"
              placeholder="Escolha ou digite uma turma nova"
              value={classGroupText}
              onChange={(e) => setClassGroupText(e.target.value)}
            />
            <datalist id="class-groups">
              {classGroups.map((group) => (
                <option key={group.id} value={group.code}>
                  {[group.discipline, group.period].filter(Boolean).join(" · ")}
                </option>
              ))}
            </datalist>
          </Field>
          <Field label="Tipo de avaliação" error={fieldErrors.evaluationType}>
            <input
              className={FIELD}
              value={evaluationType}
              onChange={(e) => setEvaluationType(e.target.value)}
            />
          </Field>
          <Field label="Data da avaliação" error={fieldErrors.date}>
            <input
              type="date"
              className={FIELD}
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
          <Field label="Prazo para homologação" error={fieldErrors.deadline}>
            <input
              type="date"
              className={FIELD}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>
          <Field label="Descrição" className="sm:col-span-2">
            <textarea
              rows={3}
              className={`${FIELD} resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
      </section>

      {classGroupsQuery.error && (
        <p role="alert" className="text-sm text-danger">
          {classGroupsQuery.error.message}
        </p>
      )}

      {formError && (
        <p role="alert" className="text-sm text-danger">
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
          disabled={submitting}
          className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.06)] disabled:cursor-default disabled:opacity-60"
        >
          {submitting ? "Criando…" : "Criar ata"}
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
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
