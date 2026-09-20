import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchMe } from "../../../lib/api/auth-server";
import AdminTabs from "./admin-tabs";

/**
 * Administração (E4.3 e E4.4). Entra quem gerencia alguém — `manageableRoles` vazio fica de fora;
 * a aba de tipos de documento é que continua só do `admin`.
 *
 * A guarda roda no servidor e redireciona, em vez de confiar no item de menu escondido:
 * esconder link não é controle de acesso — quem digitar /admin na barra chegaria aqui.
 * Mesma defesa em profundidade do `(private)/layout.tsx`, e a API recusa de novo com 403.
 *
 * `role` e `manageableRoles` descem por prop: o servidor já tem o `me`, e buscar `/auth/me` de
 * novo no cliente criaria uma segunda fonte de verdade para a mesma decisão.
 */
export default async function AdminPage() {
  const cookieStore = await cookies();
  const me = await fetchMe(cookieStore.toString());

  if (!me) {
    redirect("/login");
  }
  if (me.manageableRoles.length === 0) {
    redirect("/");
  }

  return <AdminTabs currentUserId={me.id} role={me.role} manageableRoles={me.manageableRoles} />;
}
