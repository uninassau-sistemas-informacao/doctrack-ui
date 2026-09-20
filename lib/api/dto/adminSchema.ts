import { z } from "zod";

import { roleSchema } from "./authSchema";

/** Espelha `AdminUserResponse` — difere de `MeResponse` por carregar o status ativo. */
export const adminUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  active: z.boolean(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

/**
 * Entrada de criação. A senha só existe aqui: `PUT /users/{id}` não troca senha nem
 * e-mail — mexer no e-mail mudaria a identidade de login, fora do escopo do E4.
 */
export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(1, "Nome e obrigatorio"),
  email: z.string().trim().email("Email invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
  role: roleSchema,
});

export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;

export const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(1, "Nome e obrigatorio"),
  role: roleSchema,
  active: z.boolean(),
});

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

/** A chave é imutável depois de criada (é o que a URL do Kanban usa), daí o regex de slug. */
export const documentTypeInputSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9_-]{2,50}$/, "Use de 2 a 50 caracteres minusculos, numeros, hifen ou underline"),
  name: z.string().trim().min(1, "Nome e obrigatorio").max(120),
  abbreviation: z.string().trim().min(1, "Sigla e obrigatoria").max(10),
  defaultDeadlineDays: z.number().int().positive("Prazo deve ser maior que zero").nullable(),
  active: z.boolean(),
});

export type DocumentTypeInput = z.infer<typeof documentTypeInputSchema>;

export const workflowStatusInputSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9_-]{2,50}$/, "Use de 2 a 50 caracteres minusculos, numeros, hifen ou underline"),
  label: z.string().trim().min(1, "Rotulo e obrigatorio").max(80),
  position: z.number().int().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser hexadecimal, ex. #185FA5"),
  initial: z.boolean(),
  finalStatus: z.boolean(),
});

export type WorkflowStatusInput = z.infer<typeof workflowStatusInputSchema>;

export const workflowTransitionInputSchema = z.object({
  fromStatusId: z.number(),
  toStatusId: z.number(),
  key: z.string().trim().regex(/^[a-z0-9_-]{2,50}$/, "Use de 2 a 50 caracteres minusculos, numeros, hifen ou underline"),
  label: z.string().trim().min(1, "Rotulo e obrigatorio").max(80),
  allowedRoles: z.array(roleSchema).min(1, "Informe ao menos um papel"),
  notifyRoles: z.array(roleSchema),
  requiresComment: z.boolean(),
});

export type WorkflowTransitionInput = z.infer<typeof workflowTransitionInputSchema>;
