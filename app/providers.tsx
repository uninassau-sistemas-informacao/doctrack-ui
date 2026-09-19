"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Provider raiz: listener do evento `session:expired` disparado por
 * `lib/api/client.ts` quando o refresh automático falha — redireciona
 * para o login; e o `QueryClientProvider` do TanStack Query (E10.5).
 *
 * O `QueryClient` nasce dentro de `useState` e não em módulo: em módulo ele seria
 * compartilhado entre requisições no servidor, vazando cache de um usuário para outro.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // `retry: false` porque `lib/api/client` já reenvia a requisição uma vez após
        // renovar a sessão; repetir de novo aqui só atrasaria o erro na tela.
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
      })
  );

  useEffect(() => {
    function handleSessionExpired() {
      router.push("/login");
    }
    window.addEventListener("session:expired", handleSessionExpired);
    return () => window.removeEventListener("session:expired", handleSessionExpired);
  }, [router]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
