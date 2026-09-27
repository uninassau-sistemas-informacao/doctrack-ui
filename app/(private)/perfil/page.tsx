import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchMe } from "../../../lib/api/auth-server";
import PageHeader from "../../components/page-header";
import ProfileForms from "./profile-forms";

/**
 * Tela de perfil (E9/U4): troca de nome e de senha do próprio usuário logado.
 *
 * O layout privado já confirmou a sessão antes de renderizar esta rota, mas o `fetchMe` roda de
 * novo aqui — mesma defesa em profundidade de `admin/page.tsx` — porque `ProfileForms` precisa
 * dos dados atuais (nome, e-mail, papel) para preencher o formulário.
 */
export default async function PerfilPage() {
  const cookieStore = await cookies();
  const me = await fetchMe(cookieStore.toString());

  if (!me) {
    redirect("/login");
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <PageHeader title="Meu perfil" />
      <div className="p-6">
        <ProfileForms me={me} />
      </div>
    </div>
  );
}
