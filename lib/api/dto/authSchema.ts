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

/** Contrato de `MeResponse` retornado por login/refresh/me. */
export const meResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  /** Papéis que este usuário pode criar/editar — a hierarquia vem da API, nunca duplicada aqui. */
  manageableRoles: z.array(roleSchema),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export interface LoginInput {
  email: string;
  password: string;
}
