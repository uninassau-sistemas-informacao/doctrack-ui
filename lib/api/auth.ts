import { apiFetch } from "./client";
import {
  meResponseSchema,
  type LoginInput,
  type MeResponse,
} from "./dto/authSchema";

/** Funções de autenticação — única porta de entrada para `/auth/*`. */
export const AuthApi = {
  async login(input: LoginInput): Promise<MeResponse> {
    const data = await apiFetch<unknown>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return meResponseSchema.parse(data);
  },

  async logout(): Promise<void> {
    await apiFetch<void>("/auth/logout", { method: "POST" });
  },

  async refresh(): Promise<MeResponse> {
    const data = await apiFetch<unknown>("/auth/refresh", { method: "POST" });
    return meResponseSchema.parse(data);
  },

  async me(): Promise<MeResponse> {
    const data = await apiFetch<unknown>("/auth/me");
    return meResponseSchema.parse(data);
  },
};
