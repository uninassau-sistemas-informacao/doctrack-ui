import { apiFetch } from "./client";
import { dashboardSchema, type Dashboard } from "./dto/dashboardSchema";

/** Indicadores do usuário logado (E6.1). Sem parâmetros: o papel vem da sessão. */
export const DashboardApi = {
  async get(): Promise<Dashboard> {
    return dashboardSchema.parse(await apiFetch<unknown>("/dashboard"));
  },
};
