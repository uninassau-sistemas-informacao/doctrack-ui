import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchMe } from "../../lib/api/auth-server";
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

  return <Shell me={me}>{children}</Shell>;
}
