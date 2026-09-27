import { z } from "zod";

/**
 * Espelha `AuditLogRowResponse` (E8.1). Um DTO para duas fontes: a revisão do Envers (mexeu
 * numa entidade, com de/para por campo) e o log de acesso (entrou, saiu, tentou entrar).
 *
 * O que vem nulo é informação, não lacuna: login falho não tem ator, e revisão escrita pelo
 * seeder ou pelo job noturno não tem ator nem IP.
 */
export const auditChangeSchema = z.object({
  field: z.string(),
  from: z.string().nullable(),
  to: z.string().nullable(),
});

export const auditActorSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
});

export const auditLogRowSchema = z.object({
  id: z.string(),
  occurredAt: z.string(),
  actor: auditActorSchema.nullable(),
  action: z.string(),
  module: z.string(),
  entity: z.string().nullable(),
  entityId: z.string().nullable(),
  ip: z.string().nullable(),
  /** Sempre presente, vazia quando não há diff — a tela itera sem guarda de nulo. */
  changes: z.array(auditChangeSchema),
});

export const auditLogPageSchema = z.object({
  content: z.array(auditLogRowSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
});

export type AuditChange = z.infer<typeof auditChangeSchema>;
export type AuditLogRow = z.infer<typeof auditLogRowSchema>;
export type AuditLogPage = z.infer<typeof auditLogPageSchema>;

export interface AuditFilter {
  user?: string;
  module?: string;
  from?: string;
  to?: string;
  page?: number;
}
