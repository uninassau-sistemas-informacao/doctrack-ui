import { z } from "zod";

/** Espelha o enum `Role` do backend — `admin` incluso (executa qualquer transição, E4). */
export const roleSchema = z.enum([
  "professor",
  "supervisor",
  "secretaria",
  "coordenador",
  "admin",
]);

export type Role = z.infer<typeof roleSchema>;

/**
 * Quem vê Relatórios (E8.3): coordenador e admin, e mais ninguém.
 *
 * É por papel e **não** derivado de `manageableRoles`, como `canManageUsers` faz: o supervisor
 * gerencia professores e entraria no relatório sem ter direito. Fonte única — a sidebar esconde
 * o item por aqui e a página `/relatorios` guarda a rota pela mesma função, para o menu e a
 * rota nunca discordarem. A API recusa de novo com 403; esconder link não é controle de acesso.
 */
/** Gestão de turmas é só do professor: mesma função na sidebar e na guarda de `/turmas`. */
export function canManageClassGroups(role: Role): boolean {
  return role === "professor";
}

export function canSeeReports(role: Role): boolean {
  return role === "coordenador" || role === "admin";
}

/** Contrato de `MeResponse` retornado por login/refresh/me. */
export const meResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  /** Papéis que este usuário pode criar/editar — a hierarquia vem da API, nunca duplicada aqui. */
  manageableRoles: z.array(roleSchema),
  /** Aceite de termos pendente (E9) — dispara o redirect para `/aceite-termos`. */
  termsPending: z.boolean(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export interface LoginInput {
  email: string;
  password: string;
}
