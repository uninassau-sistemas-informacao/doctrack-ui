import { apiFetch } from "./client";
import { auditLogPageSchema, type AuditFilter, type AuditLogPage } from "./dto/auditSchema";

/**
 * Feed de auditoria (E8.1). Admin apenas — a rota vive sob `/admin/**`, que a API barra no
 * próprio filtro de segurança, então um papel sem permissão nem chega ao controller.
 */
export const AuditApi = {
  async list(filter: AuditFilter = {}): Promise<AuditLogPage> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    return auditLogPageSchema.parse(await apiFetch<unknown>(`/admin/audit-log${qs ? `?${qs}` : ""}`));
  },
};
