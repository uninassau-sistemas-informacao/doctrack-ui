import { z } from "zod";
import { workflowStatusSchema } from "./workflowSchema";

/** `UserSummary` aninhado: só (id, name); a UI deriva iniciais/cor do avatar. */
export const userSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const prioritySchema = z.enum(["alta", "media", "baixa"]);

export const documentSchema = z.object({
  id: z.number(),
  typeKey: z.string(),
  status: workflowStatusSchema,
  protocolNumber: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  priority: prioritySchema,
  deadline: z.string().nullable(),
  requester: userSummarySchema.nullable(),
  assignee: userSummarySchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** `transitionKey`/`fromStatus` nulos = movimento de criação do documento. */
export const documentMovementSchema = z.object({
  id: z.number(),
  transitionKey: z.string().nullable(),
  transitionLabel: z.string().nullable(),
  fromStatus: workflowStatusSchema.nullable(),
  toStatus: workflowStatusSchema,
  actor: userSummarySchema.nullable(),
  comment: z.string().nullable(),
  createdAt: z.string(),
});

export const documentDetailSchema = documentSchema.extend({
  movements: z.array(documentMovementSchema),
});

export type UserSummary = z.infer<typeof userSummarySchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentMovement = z.infer<typeof documentMovementSchema>;
export type DocumentDetail = z.infer<typeof documentDetailSchema>;

/** Query de `GET /documents`. `mine=true` sobrepõe `requesterId` no backend. */
export interface DocumentFilter {
  type?: string;
  status?: string;
  priority?: Priority;
  requesterId?: number;
  assigneeId?: number;
  mine?: boolean;
}
