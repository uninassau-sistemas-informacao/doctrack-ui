import { z } from "zod";

import { meResponseSchema, type MeResponse } from "./dto/authSchema";
import { documentTypeSchema, type DocumentType } from "./dto/workflowSchema";

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

/**
 * Tipos ativos para o menu dinâmico (E4.5). Server-side pelo mesmo motivo de `fetchMe`:
 * o layout privado já é dinâmico (lê `cookies()`) e já busca o usuário, então a sidebar
 * chega renderizada em vez de piscar sem itens num `useEffect`.
 *
 * `GET /document-types` já devolve só os ativos, ordenados por nome
 * (`findAllByActiveTrueOrderByName`) — não há o que filtrar aqui.
 *
 * Lista vazia em falha: o menu perde os tipos, mas o resto das telas privadas continua de pé.
 * Derrubar o layout inteiro porque a API de tipos piscou seria pior que um menu curto.
 */
export async function fetchDocumentTypes(cookieHeader: string): Promise<DocumentType[]> {
  const response = await fetch(`${API_URL}/document-types`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const body: unknown = await response.json().catch(() => null);
  const result = z.array(documentTypeSchema).safeParse(body);
  return result.success ? result.data : [];
}
