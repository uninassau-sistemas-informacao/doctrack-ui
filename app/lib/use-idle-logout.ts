"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthApi } from "../../lib/api/auth";

const IDLE_MS = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES ?? "30") * 60_000;
const WARNING_MS = Math.min(60_000, IDLE_MS / 2);
const STORAGE_KEY = "doctrack:last-activity";
const WRITE_THROTTLE_MS = 5_000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart", "wheel"] as const;
// `scroll` não borbulha e o app rola dentro de containers internos (`overflow-y-auto`), nunca na
// window — por isso o listener precisa de `capture: true` para pegar o evento na fase de
// captura, antes dele parar no container. `wheel` cobre o gesto de trackpad/mouse (que também
// não gera `scroll` quando o container ainda não tem o que rolar). `passive: true` porque nunca
// chamamos `preventDefault` aqui.
const ACTIVITY_LISTENER_OPTIONS: AddEventListenerOptions = { capture: true, passive: true };

/**
 * Expiração por inatividade (E9.4 / RNF01.5). Só o cliente sabe se há gente na tela: o polling do
 * badge mantém requests vivas, então a API sozinha nunca veria a sessão parada (ela só tem a
 * trava grossa no refresh). Atividade em qualquer aba conta para todas via `localStorage` +
 * evento `storage`; sem storage (aba privada, bloqueio), cai para a memória desta aba.
 */
export function useIdleLogout(): { secondsLeft: number | null; stayConnected: () => void } {
  const router = useRouter();
  const lastActivity = useRef(0);
  const lastWrite = useRef(0);
  const loggedOut = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const triggerIdleLogout = useCallback(() => {
    if (loggedOut.current) {
      return;
    }
    loggedOut.current = true;
    AuthApi.logout().catch(() => {});
    router.replace("/login?motivo=inatividade");
  }, [router]);

  const markActivity = useCallback(() => {
    const now = Date.now();
    // Notebook suspenso ou aba em segundo plano atrasa o setInterval (throttle de ate ~1/min do
    // navegador): um evento de atividade (mousemove, volta de visibilitychange, storage de outra
    // aba) pode chegar depois que a sessao ja deveria ter expirado. Sem essa checagem aqui, ele
    // "ressuscitaria" a sessao antes do proximo tick perceber o atraso.
    if (now - lastActivity.current >= IDLE_MS) {
      triggerIdleLogout();
      return;
    }
    lastActivity.current = now;
    if (now - lastWrite.current >= WRITE_THROTTLE_MS) {
      lastWrite.current = now;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // Sem storage (aba privada, bloqueio): fica só na memória desta aba.
      }
    }
  }, [triggerIdleLogout]);

  useEffect(() => {
    lastActivity.current = Date.now();

    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }
      // Mesma corrida do markActivity: o valor que chegou de outra aba pode ser antigo demais
      // para esta aba, que ja deveria ter expirado enquanto ambas estavam suspensas.
      const now = Date.now();
      if (now - lastActivity.current >= IDLE_MS) {
        triggerIdleLogout();
        return;
      }
      const value = Number(event.newValue);
      if (value > lastActivity.current) {
        lastActivity.current = value;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        markActivity();
      }
    }

    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, markActivity, ACTIVITY_LISTENER_OPTIONS)
    );
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    const intervalId = window.setInterval(() => {
      const remaining = IDLE_MS - (Date.now() - lastActivity.current);
      if (remaining <= 0) {
        triggerIdleLogout();
        return;
      }
      if (remaining <= WARNING_MS) {
        setSecondsLeft(Math.ceil(remaining / 1000));
      } else {
        setSecondsLeft((current) => (current === null ? current : null));
      }
    }, 1_000);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, markActivity, ACTIVITY_LISTENER_OPTIONS)
      );
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [markActivity, triggerIdleLogout]);

  return { secondsLeft, stayConnected: markActivity };
}
