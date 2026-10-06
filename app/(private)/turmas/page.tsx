import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchMe } from "../../../lib/api/auth-server";
import { canSeeClassGroups } from "../../../lib/api/dto/authSchema";
import ClassGroupManager from "../../components/class-group-manager";
import PageHeader from "../../components/page-header";

/**
 * Gestão de turmas, só do professor. A guarda no servidor repete a da sidebar
 * (`canSeeClassGroups`), e a API recusa de novo com 403.
 */
export default async function TurmasPage() {
  const cookieStore = await cookies();
  const me = await fetchMe(cookieStore.toString());

  if (!me) {
    redirect("/login");
  }
  if (canSeeClassGroups(me.role) === false) {
    redirect("/");
  }

  return (
    <>
      <PageHeader title="Turmas" subtitle={me.role === "professor" ? "Suas turmas, alunos e supervisor" : "Visão geral das turmas"} />
      <div className="flex-1 overflow-y-auto p-6">
        <ClassGroupManager currentUserId={me.id} readOnly={me.role !== "professor"} />
      </div>
    </>
  );
}
