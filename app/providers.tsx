"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Provider raiz: listener do evento `session:expired` disparado por
 * `lib/api/client.ts` quando o refresh automático falha — redireciona
 * para o login.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function handleSessionExpired() {
      router.push("/login");
    }
    window.addEventListener("session:expired", handleSessionExpired);
    return () => window.removeEventListener("session:expired", handleSessionExpired);
  }, [router]);

  return children;
}
