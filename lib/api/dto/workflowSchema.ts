import { z } from "zod";

/**
 * Espelha `WorkflowStatusResponse`, `WorkflowTransitionResponse` e `DocumentTypeResponse`.
 * `finalStatus` vem com esse nome do Java (`final` é palavra reservada lá).
 * Cor e rótulo do status vêm daqui — a UI não mantém mais tabela de status.
 */
export const workflowStatusSchema = z.object({
  id: z.number(),
  key: z.string(),
  label: z.string(),
  position: z.number(),
  color: z.string(),
  initial: z.boolean(),
  finalStatus: z.boolean(),
});

export const workflowTransitionSchema = z.object({
  id: z.number(),
  key: z.string(),
  label: z.string(),
  fromStatusKey: z.string(),
  toStatusKey: z.string(),
  allowedRoles: z.array(z.string()),
  notifyRoles: z.array(z.string()),
  requiresComment: z.boolean(),
});

/** Na listagem `statuses`/`transitions` vêm vazios; só o detalhe (`/document-types/{key}`) os preenche. */
export const documentTypeSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  defaultDeadlineDays: z.number().nullable(),
  active: z.boolean(),
  statuses: z.array(workflowStatusSchema),
  transitions: z.array(workflowTransitionSchema),
});

export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;
export type WorkflowTransition = z.infer<typeof workflowTransitionSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
