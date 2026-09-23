/**
 * Client HTTP central. Toda chamada à API passa por `apiFetch`.
 *
 * - baseURL: `NEXT_PUBLIC_API_URL` ou `/api/v1` (proxy same-origin via
 *   `next.config.ts` em dev, para os cookies HttpOnly/SameSite=Lax funcionarem).
 * - `credentials: "include"` sempre, para enviar/receber os cookies de sessão.
 * - 401 fora de `/auth/*`: tenta UM `/auth/refresh` e refaz a request original
 *   uma única vez (guard anti-loop). Se o refresh falhar, dispara o evento
 *   `session:expired` na window para a UI redirecionar ao login.
 * - Erros do backend (`{message, code, status}`) viram `ApiError`.
 * - Respostas 204 resolvem para `undefined`.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

const AUTH_PATH_PREFIX = "/auth/";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

interface BackendErrorBody {
  message: string;
  code: string;
  status: number;
}

function isAuthPath(path: string): boolean {
  return path.startsWith(AUTH_PATH_PREFIX);
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as BackendErrorBody | null;
  if (body?.message && body?.code) {
    return new ApiError(body.message, body.code, response.status);
  }
  return new ApiError(response.statusText || "Erro inesperado", "UNKNOWN", response.status);
}

async function rawFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

// Single-flight: concorrentes que caem em 401 ao mesmo tempo compartilham UMA
// chamada de /auth/refresh em vez de uma por request. Necessário porque o
// backend rotaciona o refresh token a cada uso e trata reuso como replay
// attack (revogando todas as sessões) — dois refreshes paralelos com o mesmo
// token derrubariam a sessão em vez de renová-la.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = rawFetch("/auth/refresh", { method: "POST" })
      .then((response) => response.ok)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function dispatchSessionExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("session:expired"));
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/**
 * Baixa um arquivo da API (CSV/PDF dos relatórios e do histórico — E8.4).
 *
 * Fica ao lado do `apiFetch` e não dentro dele porque o `apiFetch` força
 * `Content-Type: application/json` e sempre chama `response.json()`: um CSV ou
 * um PDF quebrariam ali. Aqui a resposta é lida como `blob()`.
 *
 * Sem o retry de sessão do `apiFetch` nesta primeira versão: exportar é uma ação
 * explícita do usuário, que pode repetir o clique se a sessão tiver expirado.
 *
 * O `revokeObjectURL` não é zelo: sem ele o blob fica retido na memória da aba
 * até o reload, e um relatório grande baixado algumas vezes já pesa.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const response = await fetch(`${BASE_URL}${path}`, { credentials: "include" });

  if (!response.ok) {
    throw await toApiError(response);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await rawFetch(path, init);

  if (response.ok) {
    return parseResponse<T>(response);
  }

  if (response.status === 401 && !isAuthPath(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const retryResponse = await rawFetch(path, init);
      if (retryResponse.ok) {
        return parseResponse<T>(retryResponse);
      }
      throw await toApiError(retryResponse);
    }
    dispatchSessionExpired();
  }

  throw await toApiError(response);
}
