"use client";

import { PaperclipIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type FormEvent, use, useState } from "react";
import { z } from "zod";

import { ApiError } from "../../../../../lib/api/client";
import { DocumentsApi } from "../../../../../lib/api/documents";
import { WorkflowApi } from "../../../../../lib/api/workflow";
import { prioritySchema, type Priority } from "../../../../../lib/api/dto/documentSchema";
import PageHeader from "../../../../components/page-header";
import { PRIORITY_CONFIG } from "../../../../lib/data";

const FIELD = "rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";

const documentInputSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(255),
  description: z.string().optional(),
  priority: prioritySchema,
  deadline: z.string().nullish(),
});

/**
 * Formulário genérico (E7.3): serve qualquer tipo sem tela própria. `POST /documents` recusa
 * tipos com satélite (409, `prova`/`ata`) e tipo inexistente/inativo (404) — a UI só repassa
 * a mensagem do backend, que é quem valida.
 */
export default function NovoDocumentoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = use(params);
  const router = useRouter();

  const typeQuery = useQuery({
    queryKey: ["document-types", "detail", tipo] as const,
    queryFn: () => WorkflowApi.getType(tipo),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [deadline, setDeadline] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = documentInputSchema.safeParse({
      title,
      description: description || undefined,
      priority,
      deadline: deadline || null,
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
      const saved = await DocumentsApi.create({ typeKey: tipo, ...parsed.data });
      router.push(`/documentos/${tipo}?documento=${saved.id}`);
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Não foi possível salvar o documento."
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={`Novo ${typeQuery.data?.name ?? "documento"}`}
        subtitle="O documento nasce no status inicial do fluxo."
        backHref={`/documentos/${tipo}`}
      />
      <div className="p-6">
        <div className="mx-auto max-w-3xl">
          {typeQuery.error && (
            <p role="alert" className="mb-4 text-sm text-[#993C1D]">
              {typeQuery.error.message}
            </p>
          )}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="mb-4 text-base font-semibold">Dados do documento</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Título" error={fieldErrors.title} className="col-span-2">
                  <input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
                <Field label="Descrição" error={fieldErrors.description} className="col-span-2">
                  <textarea
                    rows={3}
                    className={`${FIELD} resize-y`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                <Field label="Prazo" error={fieldErrors.deadline}>
                  <input
                    type="date"
                    className={FIELD}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </Field>
              </div>
            </section>

            {/* Mesmo aviso de `exam-form.tsx`: o anexo exige o documento já criado (FK), então
                a criação só orienta — o envio acontece na aba Anexos do detalhe. */}
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="mb-3 text-base font-semibold">Anexos</h2>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line py-8 text-center">
                <PaperclipIcon size={22} className="text-muted" />
                <p className="text-sm text-muted">
                  Salve o documento para anexar o arquivo na aba Anexos.
                </p>
                <p className="text-xs text-muted">O anexo é obrigatório para sair do status inicial.</p>
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
                disabled={submitting}
                className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.06)] disabled:cursor-default disabled:opacity-60"
              >
                {submitting ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
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
