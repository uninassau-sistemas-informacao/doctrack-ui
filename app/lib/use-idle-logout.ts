"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthApi } from "../../lib/api/auth";

const IDLE_MS = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES ?? "30") * 60_000;
const WARNING_MS = Math.min(60_000, IDLE_MS / 2);
const STORAGE_KEY = "doctrack:last-activity";
const WRITE_THROTTLE_MS = 5_000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

/**
 * Expiracao por inatividade (E9.4 / RNF01.5). So o cliente sabe se ha gente na tela: o polling do
 * badge mantem requests vivas, entao a API sozinha nunca veria a sessao parada (ela so tem a
 * trava grossa no refresh). Atividade em qualquer aba conta para todas via `localStorage` +
 * evento `storage`; sem storage (aba privada, bloqueio), cai para a memoria desta aba.
 */
export function useIdleLogout(): { secondsLeft: number | null; stayConnected: () => void } {
  const router = useRouter();
  const lastActivity = useRef(0);
  const lastWrite = useRef(0);
  const loggedOut = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const markActivity = useCallback(() => {
    const now = Date.now();
    lastActivity.current = now;
    if (now - lastWrite.current >= WRITE_THROTTLE_MS) {
      lastWrite.current = now;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // Sem storage (aba privada, bloqueio): fica so na memoria desta aba.
      }
    }
  }, []);

  useEffect(() => {
    lastActivity.current = Date.now();

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY && event.newValue) {
        const value = Number(event.newValue);
        if (value > lastActivity.current) {
          lastActivity.current = value;
        }
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        markActivity();
      }
    }

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, markActivity));
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    const intervalId = window.setInterval(() => {
      const remaining = IDLE_MS - (Date.now() - lastActivity.current);
      if (remaining <= 0) {
        if (!loggedOut.current) {
          loggedOut.current = true;
          AuthApi.logout().catch(() => {});
          router.replace("/login?motivo=inatividade");
        }
        return;
      }
      if (remaining <= WARNING_MS) {
        setSecondsLeft(Math.ceil(remaining / 1000));
      } else {
        setSecondsLeft((current) => (current === null ? current : null));
      }
    }, 1_000);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [markActivity, router]);

  return { secondsLeft, stayConnected: markActivity };
}
