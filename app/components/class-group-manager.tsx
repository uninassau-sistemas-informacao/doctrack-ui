"use client";

import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { z } from "zod";

import { ClassGroupsApi } from "../../lib/api/classGroups";
import {
  classGroupInputSchema,
  studentInputSchema,
} from "../../lib/api/dto/classGroupSchema";

const FIELD =
  "rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-primary";
const BUTTON =
  "flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-60";

/**
 * Turmas. O professor vê e gerencia só as dele (cadastrar turma e aluno, vincular alunos e o
 * supervisor); `readOnly` é a visão geral de coordenador e admin, com todas as turmas. A lista de
 * chamada de uma ata é copiada da turma quando a ata é criada — mexer aqui não altera ata que já
 * existe.
 */
export default function ClassGroupManager({
  currentUserId,
  readOnly,
}: {
  currentUserId: number;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupsQuery = useQuery({
    queryKey: ["class-groups", "list"] as const,
    queryFn: () => ClassGroupsApi.list(),
  });
  const allStudentsQuery = useQuery({
    queryKey: ["students", "all"] as const,
    queryFn: () => ClassGroupsApi.allStudents(),
    enabled: !readOnly,
  });
  const supervisorsQuery = useQuery({
    queryKey: ["class-groups", "supervisors"] as const,
    queryFn: () => ClassGroupsApi.supervisors(),
    enabled: !readOnly,
  });
  const enrolledQuery = useQuery({
    queryKey: ["class-groups", selectedId, "students"] as const,
    queryFn: () => ClassGroupsApi.students(selectedId!),
    enabled: selectedId !== null,
  });

  const allGroups = groupsQuery.data ?? [];
  const groups = readOnly
    ? allGroups
    : allGroups.filter((g) => g.professorId === currentUserId);
  // Supervisor é de uma turma só: quem já está em outra aparece desabilitado com o código dela.
  const takenBy = new Map(
    allGroups
      .filter((g) => g.supervisorId !== null)
      .map((g) => [g.supervisorId, g.code]),
  );
  const enrolled = enrolledQuery.data ?? [];
  const enrolledIds = new Set(enrolled.map((s) => s.id));
  const available = (allStudentsQuery.data ?? []).filter(
    (s) => !enrolledIds.has(s.id),
  );
  const selected = groups.find((g) => g.id === selectedId) ?? null;

  const onError = (err: Error) => setError(err.message);
  const reloadEnrolled = () =>
    queryClient.invalidateQueries({
      queryKey: ["class-groups", selectedId, "students"],
    });

  const createGroup = useMutation({
    mutationFn: ClassGroupsApi.create,
    onSuccess: (group) => {
      setError(null);
      setSelectedId(group.id);
      void queryClient.invalidateQueries({
        queryKey: ["class-groups", "list"],
      });
    },
    onError,
  });
  const enroll = useMutation({
    mutationFn: (studentId: number) =>
      ClassGroupsApi.enroll(selectedId!, studentId),
    onSuccess: () => {
      setError(null);
      void reloadEnrolled();
    },
    onError,
  });
  const unenroll = useMutation({
    mutationFn: (studentId: number) =>
      ClassGroupsApi.unenroll(selectedId!, studentId),
    onSuccess: () => void reloadEnrolled(),
    onError,
  });
  const assignSupervisor = useMutation({
    mutationFn: (supervisorId: number | null) =>
      ClassGroupsApi.assignSupervisor(selectedId!, supervisorId),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: ["class-groups", "list"],
      });
    },
    onError,
  });
  const createStudent = useMutation({
    mutationFn: ClassGroupsApi.createStudent,
    onSuccess: (student) => {
      void queryClient.invalidateQueries({ queryKey: ["students", "all"] });
      enroll.mutate(student.id);
    },
    onError,
  });

  function submit<T>(
    event: FormEvent<HTMLFormElement>,
    schema: z.ZodType<T>,
    run: (data: T) => void,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    run(parsed.data);
    form.reset();
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <h2 className="text-sm font-semibold">Turmas</h2>
          {!readOnly && (
            <form
              onSubmit={(e) =>
                submit(e, classGroupInputSchema, (data) =>
                  createGroup.mutate(data),
                )
              }
              className="grid grid-cols-2 gap-2"
            >
              <input
                name="code"
                placeholder="Código (ex.: 2026.2-A)"
                className={`${FIELD} col-span-2`}
              />
              <input
                name="discipline"
                placeholder="Disciplina"
                className={FIELD}
              />
              <input name="period" placeholder="Período" className={FIELD} />
              <button
                type="submit"
                disabled={createGroup.isPending}
                className={`${BUTTON} col-span-2`}
              >
                <PlusIcon size={14} /> Nova turma
              </button>
            </form>
          )}

          <ul className="flex flex-col gap-1">
            {groups.map((group) => (
              <li key={group.id}>
                <button
                  onClick={() => setSelectedId(group.id)}
                  className={`w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm ${
                    group.id === selectedId
                      ? "bg-canvas font-semibold text-primary"
                      : "text-ink"
                  }`}
                >
                  {group.code}
                  <span className="block text-xs font-normal text-muted">
                    {[group.discipline, group.period]
                      .filter(Boolean)
                      .join(" · ") || "Sem disciplina"}
                    {readOnly && ` · Prof. ${group.professorName ?? "—"}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {groupsQuery.isPending && (
            <p className="text-sm text-muted">Carregando…</p>
          )}
          {!groupsQuery.isPending && groups.length === 0 && (
            <p className="text-sm text-muted">Nenhuma turma ainda.</p>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          {!selected ? (
            <p className="text-sm text-muted">
              Selecione uma turma para ver os alunos.
            </p>
          ) : (
            <>
              <h2 className="text-sm font-semibold">
                Alunos de {selected.code}{" "}
                <span className="font-normal text-muted">
                  ({enrolled.length})
                </span>
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted">Supervisor:</span>
                {readOnly ? (
                  <span className="font-medium">
                    {selected.supervisorName ?? "—"}
                  </span>
                ) : (
                  <select
                    value={selected.supervisorId ?? ""}
                    onChange={(e) =>
                      assignSupervisor.mutate(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={`${FIELD} min-w-60`}
                  >
                    <option value="">Sem supervisor</option>
                    {(supervisorsQuery.data ?? []).map((sup) => {
                      const other = takenBy.get(sup.id);
                      const busy =
                        other !== undefined && sup.id !== selected.supervisorId;
                      return (
                        <option key={sup.id} value={sup.id} disabled={busy}>
                          {sup.name}
                          {busy ? ` (turma ${other})` : ""}
                        </option>
                      );
                    })}
                  </select>
                )}
                {readOnly && (
                  <>
                    <span className="ml-4 text-muted">Professor:</span>
                    <span className="font-medium">
                      {selected.professorName ?? "—"}
                    </span>
                  </>
                )}
              </div>

              {!readOnly && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value=""
                      onChange={(e) =>
                        e.target.value && enroll.mutate(Number(e.target.value))
                      }
                      className={`${FIELD} min-w-60 flex-1`}
                    >
                      <option value="">Vincular aluno existente…</option>
                      {available.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} — {student.registration}
                        </option>
                      ))}
                    </select>
                  </div>

                  <form
                    onSubmit={(e) =>
                      submit(e, studentInputSchema, (data) =>
                        createStudent.mutate(data),
                      )
                    }
                    className="flex flex-wrap gap-2"
                  >
                    <input
                      name="name"
                      placeholder="Nome do aluno novo"
                      className={`${FIELD} min-w-48 flex-1`}
                    />
                    <input
                      name="registration"
                      placeholder="Matrícula"
                      className={`${FIELD} w-36`}
                    />
                    <button
                      type="submit"
                      disabled={createStudent.isPending}
                      className={BUTTON}
                    >
                      <PlusIcon size={14} /> Cadastrar e vincular
                    </button>
                  </form>
                </>
              )}

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-canvas">
                    {["Aluno", "Matrícula", ""].map((header) => (
                      <th
                        key={header}
                        className="px-3 py-2 text-left text-xs font-semibold text-muted"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrolled.map((student) => (
                    <tr key={student.id} className="border-t border-line">
                      <td className="px-3 py-2 font-medium">{student.name}</td>
                      <td className="px-3 py-2 text-muted">
                        {student.registration}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {!readOnly && (
                          <button
                            onClick={() => unenroll.mutate(student.id)}
                            title="Desvincular"
                            className="cursor-pointer rounded-lg p-1.5 text-muted"
                          >
                            <XIcon size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!enrolledQuery.isPending && enrolled.length === 0 && (
                <p className="text-sm text-muted">Nenhum aluno vinculado.</p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
