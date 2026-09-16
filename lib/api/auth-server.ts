import { meResponseSchema, type MeResponse } from "./dto/authSchema";

const API_URL = process.env.API_URL ?? "http://localhost:8080/api/v1";

/**
 * Confirma a sessão no servidor chamando `/auth/me` com o cookie repassado
 * pelo caller (via `next/headers` em Server Components). Usado pelo guard de
 * `app/(private)/layout.tsx` — nunca faz `fetch` cru fora de `lib/api`.
 *
 * Retorna `null` tanto para resposta não-ok (401 etc.) quanto para um corpo
 * que não bate com `meResponseSchema`: nos dois casos o caller só precisa
 * decidir entre "sessão válida" e "redirecionar para /login".
 */
export async function fetchMe(cookieHeader: string): Promise<MeResponse | null> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const body: unknown = await response.json();
  const result = meResponseSchema.safeParse(body);
  return result.success ? result.data : null;
}
