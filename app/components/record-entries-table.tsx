"use client";

import { useState } from "react";

import type {
  EvaluationRecord,
  Presence,
  RecordEntriesInput,
} from "../../lib/api/dto/recordSchema";

const FIELD = "rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-primary";

const PRESENCE_LABELS: Record<Presence, string> = {
  presente: "Presente",
  ausente: "Ausente",
  ausente_justificado: "Ausente justificado",
};

/** Badge de presença — mesmas cores do restante da UI, `style` inline como em `badgeFromStatus`. */
const PRESENCE_BADGE: Record<Presence, { color: string; bg: string }> = {
  presente: { color: "#0F6E56", bg: "#E6F4F0" },
  ausente: { color: "#993C1D", bg: "#FCEAE4" },
  ausente_justificado: { color: "#BA7517", bg: "#FEF3DC" },
};

const SITUATION_LABELS: Record<string, string> = {
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  ausente: "Ausente",
};

const HEADERS = ["Aluno", "Presença", "Nota", "Observação", "Situação"];

/** Linha em edição: a nota vive como texto para o campo aceitar vazio enquanto se digita. */
interface Draft {
  presence: Presence;
  grade: string;
  observation: string;
}

interface RecordEntriesTableProps {
  record: EvaluationRecord;
  editable: boolean;
  onSave: (input: RecordEntriesInput) => Promise<void>;
  onRetake?: (entryId: number) => Promise<void>;
}

/**
 * Lançamento de notas da ata (E5.4). A lista de alunos nasce da turma no backend (UC11),
 * então a tabela só edita as linhas que já existem — não há adicionar nem remover aluno.
 *
 * Ausente não tem nota: o campo fica desabilitado e o valor vai `null` para a API, que é a
 * mesma regra do `@AssertTrue` do backend. `situation` nunca é editável — é derivada da nota
 * e da média mínima no response.
 */
export default function RecordEntriesTable({
  record,
  editable,
  onSave,
  onRetake,
}: RecordEntriesTableProps) {
  const [drafts, setDrafts] = useState<Record<number, Draft>>(() =>
    Object.fromEntries(
      record.entries.map((e) => [
        e.id,
        {
          presence: e.presence,
          grade: e.grade === null ? "" : String(e.grade),
          observation: e.observation ?? "",
        },
      ])
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retakingId, setRetakingId] = useState<number | null>(null);

  function patch(entryId: number, change: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [entryId]: { ...current[entryId], ...change } }));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await onSave({
        entries: record.entries.map((entry) => {
          const draft = drafts[entry.id];
          // Ausente nao tem nota, e campo vazio e "sem nota ainda", nao zero: o rascunho
          // aceita a ata incompleta. As duas viram `null`, como o backend espera.
          const grade = Number(draft.grade);
          const hasGrade = draft.presence === "presente" && draft.grade.trim() !== "";
          return {
            studentId: entry.studentId,
            presence: draft.presence,
            grade: hasGrade && Number.isNaN(grade) === false ? grade : null,
            observation: draft.observation.trim() || null,
          };
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o lançamento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRetake(entryId: number) {
    if (!onRetake) return;
    setError(null);
    setRetakingId(entryId);
    try {
      await onRetake(entryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a segunda chamada.");
    } finally {
      setRetakingId(null);
    }
  }

  const progress =
    record.totalStudents === 0 ? 0 : Math.round((record.gradedCount / record.totalStudents) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total de Alunos" value={String(record.totalStudents)} />
        <Stat label="Notas Lançadas" value={`${record.gradedCount}/${record.totalStudents}`} />
        <Stat
          label="Média da Turma"
          value={record.average === null ? "—" : record.average.toFixed(1)}
        />
      </div>

      {editable && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>Progresso do lançamento</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              {HEADERS.map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {record.entries.map((entry, index) => {
              const draft = drafts[entry.id];
              const presence = editable ? draft.presence : entry.presence;
              const badge = PRESENCE_BADGE[presence];

              return (
                <tr key={entry.id} className="border-b border-line">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">
                      <span className="mr-2 text-muted">{index + 1}.</span>
                      {entry.studentName}
                    </p>
                    <p className="text-xs text-muted">{entry.registration}</p>
                  </td>

                  <td className="px-3 py-2.5">
                    {editable ? (
                      <select
                        className={FIELD}
                        aria-label={`Presença de ${entry.studentName}`}
                        value={draft.presence}
                        onChange={(e) =>
                          patch(entry.id, { presence: e.target.value as Presence })
                        }
                      >
                        {Object.entries(PRESENCE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-semibold"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {PRESENCE_LABELS[presence]}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    {editable ? (
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        aria-label={`Nota de ${entry.studentName}`}
                        disabled={draft.presence !== "presente"}
                        className={`${FIELD} w-24 disabled:cursor-default disabled:opacity-60`}
                        value={draft.grade}
                        onChange={(e) => patch(entry.id, { grade: e.target.value })}
                      />
                    ) : (
                      <span className="text-muted">
                        {entry.grade === null ? "—" : entry.grade.toFixed(1)}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    {editable ? (
                      <input
                        type="text"
                        aria-label={`Observação de ${entry.studentName}`}
                        className={`${FIELD} w-full min-w-[140px]`}
                        value={draft.observation}
                        onChange={(e) => patch(entry.id, { observation: e.target.value })}
                      />
                    ) : (
                      <span className="text-muted">{entry.observation ?? "—"}</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    <span className="text-muted">
                      {entry.situation ? SITUATION_LABELS[entry.situation] : "—"}
                    </span>
                    {onRetake && entry.presence === "ausente_justificado" && (
                      <button
                        type="button"
                        disabled={retakingId !== null}
                        onClick={() => handleRetake(entry.id)}
                        className="mt-1 block cursor-pointer rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-primary disabled:cursor-default disabled:opacity-60"
                      >
                        {retakingId === entry.id ? "Criando…" : "Segunda chamada"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {record.entries.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">Nenhum aluno nesta ata.</p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-[#993C1D]">
          {error}
        </p>
      )}

      {editable && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.06)] disabled:cursor-default disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar lançamento"}
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
