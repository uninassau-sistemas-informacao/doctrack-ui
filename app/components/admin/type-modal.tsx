"use client";

import { type FormEvent, useState } from "react";

import { AdminApi } from "../../../lib/api/admin";
import { ApiError } from "../../../lib/api/client";
import { documentTypeInputSchema } from "../../../lib/api/dto/adminSchema";
import type { DocumentType } from "../../../lib/api/dto/workflowSchema";

const FIELD = "w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Criar ou editar o tipo de documento (E4.4) — só os campos do próprio tipo; status e
 * transições têm editor separado, porque exigem o tipo já salvo (as rotas são
 * `/admin/document-types/{typeId}/...`).
 *
 * A chave é imutável na edição: `AdminDocumentTypeService.update` ignora `key` de propósito
 * (o Kanban e os seeds a usam como identidade estável), então o campo fica travado em vez de
 * aceitar um valor que a API descarta em silêncio.
 */
export default function TypeModal({
  type,
  onClose,
  onSaved,
}: {
  type: DocumentType | null;
  onClose: () => void;
  onSaved: (saved: DocumentType) => void;
}) {
  const [key, setKey] = useState(type?.key ?? "");
  const [name, setName] = useState(type?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(type?.abbreviation ?? "");
  const [deadline, setDeadline] = useState(type?.defaultDeadlineDays?.toString() ?? "");
  const [active, setActive] = useState(type?.active ?? true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    // Prazo vazio é "sem prazo padrão" (coluna nulável), não zero.
    const trimmedDeadline = deadline.trim();
    const parsed = documentTypeInputSchema.safeParse({
      key,
      name,
      abbreviation,
      defaultDeadlineDays: trimmedDeadline === "" ? null : Number(trimmedDeadline),
      active,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const saved = type
        ? await AdminApi.updateType(type.id, parsed.data)
        : await AdminApi.createType(parsed.data);
      onSaved(saved);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Nao foi possivel salvar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-lg">
        <h2 className="mb-4 text-base font-semibold">{type ? "Editar tipo" : "Novo tipo de documento"}</h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Chave</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={type != null}
              placeholder="requerimento"
              className={`${FIELD} disabled:opacity-60`}
            />
            {type ? (
              <p className="mt-1 text-xs text-muted">A chave não muda depois de criada.</p>
            ) : (
              <p className="mt-1 text-xs text-muted">Minúsculas, números, hífen ou underline.</p>
            )}
            {fieldErrors.key && <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.key}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Requerimento"
              className={FIELD}
            />
            {fieldErrors.name && <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Sigla</label>
            <input
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              placeholder="REQ"
              className={FIELD}
            />
            {fieldErrors.abbreviation && (
              <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.abbreviation}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Prazo padrão (dias)</label>
            <input
              type="number"
              min={1}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="Sem prazo"
              className={FIELD}
            />
            {fieldErrors.defaultDeadlineDays && (
              <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.defaultDeadlineDays}</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Ativo (aparece no menu)
          </label>

          {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
