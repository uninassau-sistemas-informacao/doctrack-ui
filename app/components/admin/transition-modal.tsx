"use client";

import { type FormEvent, useState } from "react";

import { AdminApi } from "../../../lib/api/admin";
import { ApiError } from "../../../lib/api/client";
import { workflowTransitionInputSchema } from "../../../lib/api/dto/adminSchema";
import { roleSchema } from "../../../lib/api/dto/authSchema";
import type { WorkflowStatus, WorkflowTransition } from "../../../lib/api/dto/workflowSchema";
import { ROLE_LABELS } from "../../lib/data";

const FIELD = "w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Transição do fluxo (E4.4): de, para, papéis que podem executar, papéis a notificar e se
 * exige comentário.
 *
 * A resposta da API traz `fromStatusKey`/`toStatusKey`, mas a escrita espera
 * `fromStatusId`/`toStatusId` — daí o `statusIdByKey` na edição. Os selects trabalham com id
 * (é o que vai no corpo) e recebem o id inicial traduzido a partir da key.
 */
export default function TransitionModal({
  typeId,
  statuses,
  transition,
  onClose,
  onSaved,
}: {
  typeId: number;
  statuses: WorkflowStatus[];
  transition: WorkflowTransition | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const statusIdByKey = (statusKey: string): string =>
    statuses.find((status) => status.key === statusKey)?.id.toString() ?? "";

  const [fromStatusId, setFromStatusId] = useState(
    transition ? statusIdByKey(transition.fromStatusKey) : (statuses[0]?.id.toString() ?? ""),
  );
  const [toStatusId, setToStatusId] = useState(
    transition ? statusIdByKey(transition.toStatusKey) : (statuses[1]?.id.toString() ?? statuses[0]?.id.toString() ?? ""),
  );
  const [key, setKey] = useState(transition?.key ?? "");
  const [label, setLabel] = useState(transition?.label ?? "");
  const [allowedRoles, setAllowedRoles] = useState<string[]>(transition?.allowedRoles ?? []);
  const [notifyRoles, setNotifyRoles] = useState<string[]>(transition?.notifyRoles ?? []);
  const [requiresComment, setRequiresComment] = useState(transition?.requiresComment ?? false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(list: string[], role: string): string[] {
    return list.includes(role) ? list.filter((item) => item !== role) : [...list, role];
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsed = workflowTransitionInputSchema.safeParse({
      fromStatusId: Number(fromStatusId),
      toStatusId: Number(toStatusId),
      key,
      label,
      allowedRoles,
      notifyRoles,
      requiresComment,
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
      if (transition) {
        await AdminApi.updateTransition(typeId, transition.id, parsed.data);
      } else {
        await AdminApi.addTransition(typeId, parsed.data);
      }
      onSaved();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Nao foi possivel salvar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-lg">
        <h2 className="mb-4 text-base font-semibold">{transition ? "Editar transição" : "Nova transição"}</h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">De</label>
              <select value={fromStatusId} onChange={(e) => setFromStatusId(e.target.value)} className={FIELD}>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">Para</label>
              <select value={toStatusId} onChange={(e) => setToStatusId(e.target.value)} className={FIELD}>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Chave</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="enviar_para_revisao"
              className={FIELD}
            />
            {fieldErrors.key && <p role="alert" className="mt-1 text-xs text-[#993C1D]">{fieldErrors.key}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Rótulo (botão de ação)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enviar para revisão"
              className={FIELD}
            />
            {fieldErrors.label && <p role="alert" className="mt-1 text-xs text-[#993C1D]">{fieldErrors.label}</p>}
          </div>

          <fieldset>
            <legend className="mb-1 text-xs font-semibold text-muted">Quem pode executar</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {roleSchema.options.map((role) => (
                <label key={role} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={allowedRoles.includes(role)}
                    onChange={() => setAllowedRoles((list) => toggle(list, role))}
                  />
                  {ROLE_LABELS[role]}
                </label>
              ))}
            </div>
            {fieldErrors.allowedRoles && (
              <p role="alert" className="mt-1 text-xs text-[#993C1D]">{fieldErrors.allowedRoles}</p>
            )}
          </fieldset>

          <fieldset>
            <legend className="mb-1 text-xs font-semibold text-muted">Quem é notificado</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {roleSchema.options.map((role) => (
                <label key={role} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={notifyRoles.includes(role)}
                    onChange={() => setNotifyRoles((list) => toggle(list, role))}
                  />
                  {ROLE_LABELS[role]}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requiresComment}
              onChange={(e) => setRequiresComment(e.target.checked)}
            />
            Exige comentário
          </label>

          {formError && <p role="alert" className="text-sm text-[#993C1D]">{formError}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-primary"
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
