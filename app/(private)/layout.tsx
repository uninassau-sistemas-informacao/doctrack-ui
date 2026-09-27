import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchDocumentTypes, fetchMe } from "../../lib/api/auth-server";
import Shell from "../components/shell";

/**
 * Guarda todas as rotas privadas: confirma a sessão via `lib/api/auth-server`
 * (que chama `/auth/me` no servidor, repassando o cookie HttpOnly recebido na
 * requisição, e valida o corpo com `meResponseSchema`). Segunda camada do
 * guard — o `proxy.ts` já roda antes, mas Server Components não devem confiar
 * só nele (defesa em profundidade). Sem sessão válida, redireciona para
 * `/login` antes de renderizar.
 *
 * O `me` daqui também alimenta a sidebar: o usuário logado é o mesmo em todas
 * as telas privadas, então o shell mora no layout e cada página só renderiza
 * o próprio conteúdo.
 */
export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const me = await fetchMe(cookieStore.toString());

  if (!me) {
    redirect("/login");
  }

  // Aceite de termos pendente (E9/U3): manda para `/aceite-termos`, que fica FORA deste grupo
  // `(private)` — se estivesse dentro, este mesmo guard voltaria a redirecionar para lá de novo.
  if (me.termsPending) {
    redirect("/aceite-termos");
  }

  // Só depois de confirmar a sessão: sem cookie válido a chamada voltaria 401 de graça.
  const documentTypes = await fetchDocumentTypes(cookieStore.toString());

  return (
    <Shell me={me} documentTypes={documentTypes}>
      {children}
    </Shell>
  );
}
