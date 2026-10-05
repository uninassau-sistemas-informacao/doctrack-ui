"use client";

import { PaperclipIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { AttachmentsApi } from "../../lib/api/attachments";
import { ApiError } from "../../lib/api/client";
import { ExamsApi } from "../../lib/api/exams";
import { DocumentsApi } from "../../lib/api/documents";
import { examInputSchema, type Exam, type ExamInput } from "../../lib/api/dto/examSchema";
import type { Priority } from "../../lib/api/dto/documentSchema";
import { PRIORITY_CONFIG } from "../lib/data";
import AttachmentList, { ACCEPT, sizeLabel } from "./attachment-list";

const FIELD = "rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Formulário de prova — serve `provas/nova` (sem `exam`) e `provas/[id]/editar` (com `exam`),
 * porque `POST /exams` e `PUT /exams/{id}` compartilham o mesmo corpo (`ExamRequest`).
 *
 * "Salvar e submeter" grava e, em seguida, dispara a transição `submeter` buscada em
 * `GET /documents/{id}/transitions` — a UI não guarda id de transição, quem manda é o motor.
 *
 * Anexo: na edição o documento já existe e a lista de anexos sobe na hora. Na criação o anexo
 * não existe antes do documento (FK), então os arquivos ficam no estado e sobem logo depois do
 * POST. Se um envio falhar, a prova já está salva: `createdId` faz a nova tentativa virar PUT,
 * e só os arquivos que ainda não subiram são reenviados.
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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<null | "draft" | "submit">(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentId = doc?.id ?? createdId;

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

    if (mode === "submit" && !doc && pendingFiles.length === 0) {
      setFormError("Anexe o arquivo da prova para submeter.");
      return;
    }

    setSubmitting(mode);
    try {
      const saved = documentId
        ? await ExamsApi.update(documentId, input)
        : await ExamsApi.create(input);
      setCreatedId(saved.document.id);

      for (const file of pendingFiles) {
        await AttachmentsApi.upload(saved.document.id, file);
        setPendingFiles((files) => files.filter((f) => f !== file));
      }

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
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold">Dados da prova</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Título" error={fieldErrors.title} className="sm:col-span-2">
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
          <Field label="Observações" className="sm:col-span-2">
            <textarea
              rows={3}
              className={`${FIELD} resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-1 text-base font-semibold">Arquivo da prova</h2>
        <p className="mb-3 text-xs text-muted">O anexo é obrigatório para enviar para revisão.</p>
        {documentId ? (
          <AttachmentList documentId={documentId} canEdit />
        ) : (
          <div className="flex flex-col gap-3">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const files = Array.from(event.dataTransfer.files ?? []);
                setPendingFiles((current) => [...current, ...files]);
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border border-dashed py-6 text-center ${
                dragging ? "border-primary bg-primary-soft" : "border-line"
              }`}
            >
              <UploadSimpleIcon size={22} className="text-muted" />
              <p className="text-sm text-muted">Arraste o arquivo aqui ou</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-primary"
              >
                Escolher arquivo
              </button>
              <p className="text-xs text-muted">PDF, DOC, DOCX, JPG ou PNG, até 10 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.currentTarget.value = "";
                  setPendingFiles((current) => [...current, ...files]);
                }}
              />
            </div>
          </div>
        )}
        {/* Fica fora do ternário: se um envio falhar depois do POST, a tela passa para a lista
            real de anexos e o que ainda não subiu precisa continuar visível. */}
        {pendingFiles.length > 0 && (
          <ul className="mt-3 flex list-none flex-col gap-2 p-0">
            {pendingFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2"
              >
                <PaperclipIcon size={16} className="shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted">{sizeLabel(file.size)} · enviado ao salvar</p>
                </div>
                <button
                  type="button"
                  aria-label={`Remover ${file.name}`}
                  onClick={() => setPendingFiles((files) => files.filter((f) => f !== file))}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-line text-muted"
                >
                  <TrashIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

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
          disabled={submitting !== null}
          className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-primary disabled:cursor-default disabled:opacity-60"
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
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
