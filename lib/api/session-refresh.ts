const API_URL = process.env.API_URL ?? "http://localhost:8080/api/v1";

/** Nome do cookie de refresh emitido por `AuthCookieFactory` na API — precisa bater exatamente. */
export const REFRESH_COOKIE_NAME = "X-DOCTRACK-REFRESH";

export type RefreshResult =
  | { outcome: "refreshed"; setCookieHeaders: string[]; cookieHeader: string }
  | { outcome: "unauthenticated" };

/**
 * Reconstrói o header `Cookie` da requisição original substituindo (ou acrescentando) os pares
 * nome=valor renovados pelo `/auth/refresh` — a partir dos próprios `Set-Cookie` que a API
 * devolveu, ignorando atributos (`Path`, `HttpOnly`, `Max-Age` etc.). Necessário porque um
 * `Set-Cookie` de resposta só é aplicado pelo browser na PRÓXIMA requisição: para o Server
 * Component que roda depois do proxy, na MESMA requisição, enxergar a sessão como válida, o
 * cookie novo precisa já estar no header `cookie` que ele lê via `next/headers`.
 */
function mergeCookieHeader(originalCookieHeader: string, setCookieHeaders: string[]): string {
  const cookies = new Map<string, string>();
  for (const pair of originalCookieHeader.split(";")) {
    const trimmed = pair.trim();
    if (trimmed === "") continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    cookies.set(trimmed.slice(0, separatorIndex), trimmed.slice(separatorIndex + 1));
  }

  for (const setCookie of setCookieHeaders) {
    const firstPair = setCookie.split(";")[0]?.trim() ?? "";
    const separatorIndex = firstPair.indexOf("=");
    if (separatorIndex === -1) continue;
    cookies.set(firstPair.slice(0, separatorIndex), firstPair.slice(separatorIndex + 1));
  }

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

/**
 * Renova a sessão chamando `POST /auth/refresh` no backend, repassando o cookie de refresh
 * recebido pelo caller. Usado por `proxy.ts` (Next 16 renomeou `middleware.ts` para `proxy.ts`)
 * para sobreviver à expiração do access token sem derrubar o usuário: Server Components não
 * podem setar cookies (`next/headers`), então a renovação só pode acontecer aqui, antes da
 * página renderizar — o caller repassa os `Set-Cookie` retornados para a resposta ao browser.
 *
 * Não chama a API se não há cookie de refresh: sem ele o backend responde 401 de qualquer
 * forma, mas evitar a chamada deixa o caminho "sessão nunca existiu" explícito e sem round-trip
 * de rede desnecessário.
 */
export async function refreshSession(cookieHeader: string): Promise<RefreshResult> {
  if (cookieHeader.includes(`${REFRESH_COOKIE_NAME}=`) === false) {
    return { outcome: "unauthenticated" };
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!response.ok) {
    return { outcome: "unauthenticated" };
  }

  const setCookieHeaders = response.headers.getSetCookie();
  return {
    outcome: "refreshed",
    setCookieHeaders,
    cookieHeader: mergeCookieHeader(cookieHeader, setCookieHeaders),
  };
}
