"use client";

import { type FormEvent, useState } from "react";

import { AdminApi } from "../../../lib/api/admin";
import { ApiError } from "../../../lib/api/client";
import { workflowStatusInputSchema } from "../../../lib/api/dto/adminSchema";
import type { WorkflowStatus } from "../../../lib/api/dto/workflowSchema";

const FIELD = "w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Status do fluxo (E4.4). `position` define a ordem das colunas do Kanban e `color` o badge —
 * o banco guarda só a cor do texto, e `badgeFromStatus` monta o fundo a 12%.
 *
 * "Inicial" é exclusivo por tipo: a API responde 409 quando já existe outro. Não bloqueio o
 * checkbox aqui porque o editor não sabe, no momento da digitação, se o inicial atual é este
 * mesmo — deixo a API decidir e mostro a mensagem dela.
 */
export default function StatusModal({
  typeId,
  status,
  nextPosition,
  onClose,
  onSaved,
}: {
  typeId: number;
  status: WorkflowStatus | null;
  nextPosition: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [key, setKey] = useState(status?.key ?? "");
  const [label, setLabel] = useState(status?.label ?? "");
  const [position, setPosition] = useState((status?.position ?? nextPosition).toString());
  const [color, setColor] = useState(status?.color ?? "#185FA5");
  const [initial, setInitial] = useState(status?.initial ?? false);
  const [finalStatus, setFinalStatus] = useState(status?.finalStatus ?? false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsed = workflowStatusInputSchema.safeParse({
      key,
      label,
      position: Number(position),
      color,
      initial,
      finalStatus,
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
      if (status) {
        await AdminApi.updateStatus(typeId, status.id, parsed.data);
      } else {
        await AdminApi.addStatus(typeId, parsed.data);
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
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-lg">
        <h2 className="mb-4 text-base font-semibold">{status ? "Editar status" : "Novo status"}</h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Chave</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={status != null}
              placeholder="em_analise"
              className={`${FIELD} disabled:opacity-60`}
            />
            {fieldErrors.key && <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.key}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Rótulo</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Em análise"
              className={FIELD}
            />
            {fieldErrors.label && <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.label}</p>}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">Posição</label>
              <input
                type="number"
                min={0}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className={FIELD}
              />
              {fieldErrors.position && (
                <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.position}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Cor</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-[42px] w-16 cursor-pointer rounded-xl border border-line bg-canvas p-1"
              />
              {fieldErrors.color && <p role="alert" className="mt-1 text-xs text-danger">{fieldErrors.color}</p>}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={initial} onChange={(e) => setInitial(e.target.checked)} />
            Status inicial (onde o documento nasce)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={finalStatus} onChange={(e) => setFinalStatus(e.target.checked)} />
            Status final (encerra a tramitação)
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
