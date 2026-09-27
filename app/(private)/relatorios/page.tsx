import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchDocumentTypes, fetchMe } from "../../../lib/api/auth-server";
import { canSeeReports } from "../../../lib/api/dto/authSchema";
import ReportsView from "./reports-view";

/**
 * Relatórios (E8.3). Entram coordenador e admin — a regra mora em `canSeeReports`, a mesma
 * função que a sidebar usa para mostrar o item, então menu e rota não têm como discordar.
 *
 * A guarda roda no servidor e redireciona em vez de confiar no item escondido: esconder link
 * não é controle de acesso, quem digitar /relatorios na barra chegaria aqui. Mesma defesa em
 * profundidade do `/admin`, e a API recusa de novo com 403.
 *
 * Os tipos descem por prop porque o servidor já os busca para a sidebar; pedir de novo no
 * cliente criaria uma segunda fonte para a mesma lista.
 */
export default async function RelatoriosPage() {
  const cookieStore = await cookies();
  const me = await fetchMe(cookieStore.toString());

  if (!me) {
    redirect("/login");
  }
  if (canSeeReports(me.role) === false) {
    redirect("/");
  }

  const documentTypes = await fetchDocumentTypes(cookieStore.toString());

  return <ReportsView documentTypes={documentTypes} />;
}
