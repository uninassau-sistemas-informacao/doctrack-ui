import { z } from "zod";
import { roleSchema } from "./authSchema";
import { examCardSchema } from "./examSchema";
import { recordCardSchema } from "./recordSchema";

/**
 * Espelha `DashboardResponse` (E6.1). A API manda número e lista; ícone, cor e ordem visual
 * são decisão da UI e vivem em `app/lib/dashboard-view.ts`.
 */
export const dashboardKpiSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number(),
});

/** Painel que o papel não usa vem como lista vazia — nunca nulo, nunca ausente. */
export const dashboardPanelsSchema = z.object({
  pendingActions: z.array(examCardSchema),
  reviewQueue: z.array(examCardSchema),
  printQueue: z.array(examCardSchema),
  recordsToValidate: z.array(recordCardSchema),
  recordsToHomologate: z.array(recordCardSchema),
  toArchive: z.array(recordCardSchema),
  myExams: z.array(examCardSchema),
});

export const dashboardSchema = z.object({
  role: roleSchema,
  kpis: z.array(dashboardKpiSchema),
  panels: dashboardPanelsSchema,
});

export type DashboardKpi = z.infer<typeof dashboardKpiSchema>;
export type DashboardPanels = z.infer<typeof dashboardPanelsSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
