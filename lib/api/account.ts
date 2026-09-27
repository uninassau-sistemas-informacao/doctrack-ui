import { apiFetch } from "./client";
import { meResponseSchema, type MeResponse } from "./dto/authSchema";

/** Funções de conta do usuário logado (E9) — única porta de entrada para `/me*`. */
export const AccountApi = {
  async updateName(name: string): Promise<MeResponse> {
    const data = await apiFetch<unknown>("/me", {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    return meResponseSchema.parse(data);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiFetch<void>("/me/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async acceptTerms(): Promise<MeResponse> {
    const data = await apiFetch<unknown>("/me/terms-acceptance", { method: "POST" });
    return meResponseSchema.parse(data);
  },
};
