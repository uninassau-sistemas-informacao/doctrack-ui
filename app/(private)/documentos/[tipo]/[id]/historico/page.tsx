import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchMe } from "../../../../../../lib/api/auth-server";
import { canSeeReports } from "../../../../../../lib/api/dto/authSchema";
import HistoryView from "./history-view";

/**
 * Histórico completo de um documento, com IP do ator (E8.2).
 *
 * Mesmo recorte de papel dos relatórios — coordenador e admin —, por isso reusa
 * `canSeeReports` em vez de repetir a lista: o IP é dado de auditoria e os dois lugares
 * respondem à mesma pergunta ("este usuário audita?"). O professor dono do documento vê o
 * detalhe normalmente, mas não esta tela; a API recusa com 403 de qualquer forma.
 */
export default async function HistoricoPage({ params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  const cookieStore = await cookies();
  const me = await fetchMe(cookieStore.toString());

  if (!me) {
    redirect("/login");
  }
  if (canSeeReports(me.role) === false) {
    redirect("/");
  }

  return <HistoryView documentId={Number(id)} typeKey={tipo} />;
}
