import { z } from "zod";
import { userSummarySchema } from "./documentSchema";
import { workflowStatusSchema } from "./workflowSchema";

/**
 * Espelha `DocumentHistoryRowResponse` (E8.2). É quase o `documentMovementSchema`, mas com
 * `actorIp` — e essa é a razão de existir separado dos dois lados: o DTO do painel de detalhe
 * omite o IP de propósito, porque o professor dono também abre aquela tela. Só o histórico,
 * restrito a coordenador e admin, carrega o IP.
 */
export const documentHistoryRowSchema = z.object({
  id: z.number(),
  transitionKey: z.string().nullable(),
  transitionLabel: z.string().nullable(),
  fromStatus: workflowStatusSchema.nullable(),
  toStatus: workflowStatusSchema,
  actor: userSummarySchema.nullable(),
  actorIp: z.string().nullable(),
  comment: z.string().nullable(),
  createdAt: z.string(),
  detailsJson: z.string().nullable(),
});

export type DocumentHistoryRow = z.infer<typeof documentHistoryRowSchema>;
