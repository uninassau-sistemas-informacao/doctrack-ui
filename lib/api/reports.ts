import { apiFetch, downloadFile } from "./client";
import {
  slaReportSchema,
  throughputReportSchema,
  volumeByRoleReportSchema,
  type ReportFilter,
  type SlaReport,
  type ThroughputReport,
  type VolumeByRoleReport,
} from "./dto/reportSchema";

/** Chaves de exportação aceitas pela API (`?format=`). */
export type ReportFormat = "csv" | "pdf";

function query(filter: ReportFilter = {}, format?: ReportFormat): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  if (format) {
    params.set("format", format);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Relatórios gerenciais (E8.3/E8.4). Coordenador e admin; a API recusa os demais com 403.
 *
 * A exportação passa pelo `downloadFile` e não pelo `apiFetch`: este último força JSON e
 * quebraria com CSV/PDF. O formato vai por query (`?format=`) e não por `Accept`, então o
 * link é copiável e testável direto no browser.
 */
export const ReportsApi = {
  async throughput(filter: ReportFilter = {}): Promise<ThroughputReport> {
    return throughputReportSchema.parse(await apiFetch<unknown>(`/reports/throughput${query(filter)}`));
  },

  async sla(filter: ReportFilter = {}): Promise<SlaReport> {
    return slaReportSchema.parse(await apiFetch<unknown>(`/reports/sla${query(filter)}`));
  },

  async volumeByRole(filter: ReportFilter = {}): Promise<VolumeByRoleReport> {
    return volumeByRoleReportSchema.parse(await apiFetch<unknown>(`/reports/volume-by-role${query(filter)}`));
  },

  async export(report: "throughput" | "sla" | "volume-by-role", format: ReportFormat, filter: ReportFilter = {}) {
    return downloadFile(`/reports/${report}${query(filter, format)}`, `${report}.${format}`);
  },
};
