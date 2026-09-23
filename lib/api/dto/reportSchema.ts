import { z } from "zod";

/**
 * Espelha `ReportResponse` (E8.3). O período volta na resposta porque pode ter sido
 * resolvido pelo servidor — sem `from`/`to` na query são os últimos 30 dias, no fuso da
 * aplicação. A tela rotula o que está mostrando com o que veio, nunca com o que pediu.
 */
const reportEnvelope = <T extends z.ZodTypeAny>(row: T) =>
  z.object({
    from: z.string(),
    to: z.string(),
    rows: z.array(row),
  });

/** Documentos que ENTRARAM no status no período — não os que estão nele agora (isso é o dashboard). */
export const throughputRowSchema = z.object({
  typeKey: z.string(),
  typeName: z.string(),
  statusKey: z.string(),
  statusLabel: z.string(),
  total: z.number(),
});

/** `samples` acompanha a média: média de 2 amostras não vale o mesmo que média de 200. */
export const slaRowSchema = z.object({
  typeKey: z.string(),
  typeName: z.string(),
  transitionKey: z.string(),
  transitionLabel: z.string(),
  avgHours: z.number(),
  medianHours: z.number(),
  samples: z.number(),
});

/** "Volume por setor" do RF04.6 lido como volume por PAPEL — TAREFAS.md vence o PDF. */
export const volumeByRoleRowSchema = z.object({
  role: z.string(),
  roleLabel: z.string(),
  total: z.number(),
});

export const throughputReportSchema = reportEnvelope(throughputRowSchema);
export const slaReportSchema = reportEnvelope(slaRowSchema);
export const volumeByRoleReportSchema = reportEnvelope(volumeByRoleRowSchema);

export type ThroughputRow = z.infer<typeof throughputRowSchema>;
export type SlaRow = z.infer<typeof slaRowSchema>;
export type VolumeByRoleRow = z.infer<typeof volumeByRoleRowSchema>;
export type ThroughputReport = z.infer<typeof throughputReportSchema>;
export type SlaReport = z.infer<typeof slaReportSchema>;
export type VolumeByRoleReport = z.infer<typeof volumeByRoleReportSchema>;

/** Filtro comum das três telas. Datas em `YYYY-MM-DD`, como o backend espera. */
export interface ReportFilter {
  from?: string;
  to?: string;
  typeKey?: string;
}
