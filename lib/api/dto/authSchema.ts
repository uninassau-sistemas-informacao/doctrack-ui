import { z } from "zod";

/**
 * Contrato de `MeResponse` retornado por register/login/refresh/me.
 * Os valores de `role` espelham o tipo `Role` de `app/lib/data.ts`.
 */
export const meResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["professor", "supervisor", "secretaria", "coordenador"]),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
