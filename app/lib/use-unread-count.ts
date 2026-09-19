"use client";

import { useQuery } from "@tanstack/react-query";

import { NotificationsApi } from "../../lib/api/notifications";

const POLL_INTERVAL_MS = 30_000;

/** Chave compartilhada: quem marca notificação como lida invalida esta query. */
export const unreadCountKey = ["notifications", "unread-count"] as const;

/**
 * Contagem de não lidas para o badge da sidebar (E3.3). Polling de 30 s: o backend não tem
 * push (SSE/WebSocket fica para depois) e `unread-count` é um COUNT indexado.
 *
 * A tela de notificações fura a árvore irmã por `invalidateQueries(unreadCountKey)` — antes
 * era um evento de `window`, que o cache do TanStack Query dispensa (E10.5).
 */
export function useUnreadCount(): number {
  const { data } = useQuery({
    queryKey: unreadCountKey,
    queryFn: () => NotificationsApi.unreadCount(),
    refetchInterval: POLL_INTERVAL_MS,
    // Badge é informativo: falha de rede mantém o último valor em vez de estourar na tela.
    placeholderData: (previous) => previous,
  });

  return data ?? 0;
}
