import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchMe } from "./lib/api/auth-server";
import { refreshSession } from "./lib/api/session-refresh";

const LOGIN_PATH = "/login";

/**
 * Guarda as rotas privadas ANTES do Server Component renderizar (Next 16 renomeou
 * `middleware.ts`/`middleware` para `proxy.ts`/`proxy` — ver `config.matcher` abaixo para o
 * escopo). Existe porque `app/(private)/layout.tsx` é um Server Component e Server Components
 * não podem setar cookies (`next/headers` só lê) — a única forma correta de renovar a sessão
 * e persistir os cookies novos no browser é aqui, na camada de proxy/middleware, que tem acesso
 * a `NextResponse.cookies`/`headers`.
 *
 * Fluxo: tenta `/auth/me` com os cookies recebidos; se falhar (access expirado após ~30min de
 * inatividade) tenta `POST /auth/refresh` com o cookie de refresh (válido por 30 dias) — se
 * renovar, repassa os `Set-Cookie` da API para a resposta ao browser e deixa a requisição
 * original seguir; se falhar (refresh ausente/expirado/revogado), redireciona para `/login`.
 *
 * IMPORTANTE: um `Set-Cookie` de resposta só é aplicado pelo browser no PRÓXIMO request — o
 * Server Component desta MESMA requisição (`app/(private)/layout.tsx`, que roda depois do proxy
 * e reconfirma a sessão via `fetchMe`/`next/headers`) ainda leria o cookie de access antigo e
 * expirado, redirecionando para `/login` mesmo com o refresh bem-sucedido (comportamento
 * confirmado manualmente contra a API real). Por isso o cookie header da requisição repassada
 * é reescrito com `NextResponse.next({ request: { headers } })` usando o `cookieHeader` já
 * mesclado que `refreshSession` devolve.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const cookieHeader = request.headers.get("cookie") ?? "";

  const me = await fetchMe(cookieHeader);
  if (me) {
    return NextResponse.next();
  }

  const refreshResult = await refreshSession(cookieHeader);
  if (refreshResult.outcome === "unauthenticated") {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("cookie", refreshResult.cookieHeader);

  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  for (const setCookie of refreshResult.setCookieHeaders) {
    response.headers.append("set-cookie", setCookie);
  }
  return response;
}

export const config = {
  // Roda em toda rota privada, excluindo as públicas — login, cadastro, recuperar/redefinir
  // senha e termos (E9) —, assets estáticos e o próprio proxy da API (rewrite de /api/v1 em
  // next.config.ts) — esses nunca devem exigir sessão aqui.
  matcher: [
    "/((?!api|login|cadastro|recuperar-senha|redefinir-senha|termos|_next/static|_next/image|favicon.ico).*)",
  ],
};
