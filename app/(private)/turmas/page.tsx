import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchMe } from "../../../lib/api/auth-server";
import { canManageClassGroups } from "../../../lib/api/dto/authSchema";
import ClassGroupManager from "../../components/class-group-manager";
import PageHeader from "../../components/page-header";

/**
 * Gestão de turmas, só do professor. A guarda no servidor repete a da sidebar
 * (`canManageClassGroups`), e a API recusa de novo com 403.
 */
export default async function TurmasPage() {
  const cookieStore = await cookies();
  const me = await fetchMe(cookieStore.toString());

  if (!me) {
    redirect("/login");
  }
  if (canManageClassGroups(me.role) === false) {
    redirect("/");
  }

  return (
    <>
      <PageHeader title="Turmas" subtitle="Cadastro de turmas e vínculo de alunos" />
      <div className="flex-1 overflow-y-auto p-6">
        <ClassGroupManager />
      </div>
    </>
  );
}
