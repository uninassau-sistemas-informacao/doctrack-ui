"use client";

import { useCallback, useEffect, useState } from "react";

import { NotificationsApi } from "../../lib/api/notifications";

const POLL_INTERVAL_MS = 30_000;

const CHANGED_EVENT = "notifications:changed";

/**
 * Avisa o badge que a caixa mudou. Evento na window pelo mesmo motivo de `session:expired`
 * no client HTTP: sidebar e tela de notificações são irmãs em árvores diferentes, e um
 * contexto só para propagar um número seria mais encanamento do que o problema pede.
 */
export function notifyUnreadChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGED_EVENT));
  }
}

/**
 * Contagem de não lidas para o badge da sidebar (E3.3). Polling de 30 s: o backend não tem
 * push (SSE/WebSocket fica para depois) e `unread-count` é um COUNT indexado.
 */
export function useUnreadCount(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    NotificationsApi.unreadCount()
      .then(setCount)
      .catch(() => {
        // Badge é informativo: falha de rede não deve estourar erro na tela toda.
      });
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener(CHANGED_EVENT, refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener(CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  return count;
}
