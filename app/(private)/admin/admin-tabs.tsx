"use client";

import { useState } from "react";

import type { Role } from "../../../lib/api/dto/authSchema";
import PageHeader from "../../components/page-header";
import TypeList from "../../components/admin/type-list";
import AuditTable from "../../components/admin/audit-table";
import ClassGroupManager from "../../components/admin/class-group-manager";
import UserTable from "../../components/admin/user-table";

type Tab = "usuarios" | "turmas" | "tipos" | "auditoria";

const TABS: { key: Tab; label: string }[] = [
  { key: "usuarios", label: "Usuários" },
  { key: "turmas", label: "Turmas" },
  { key: "tipos", label: "Tipos de Documento" },
  { key: "auditoria", label: "Auditoria" },
];

/**
 * Duas abas, estado local — a escolha não precisa sobreviver a um reload nem ser
 * compartilhável por link, ao contrário da seleção de documento no quadro de provas
 * (que mora na URL justamente porque é compartilhável).
 *
 * As abas visíveis saem das permissões: usuários para quem gerencia algum papel, tipos só para
 * `admin`. O estado inicial vem da primeira aba visível e não de um literal — um coordenador
 * cairia numa aba escondida e veria a tela vazia.
 */
export default function AdminTabs({
  currentUserId,
  role,
  manageableRoles,
}: {
  currentUserId: number;
  role: Role;
  manageableRoles: Role[];
}) {
  // "usuarios" segue a hierarquia; "tipos" e "auditoria" sao admin-only. O predicado ja tratava
  // qualquer chave que nao fosse "usuarios" como admin, e a aba nova cai nessa regra de
  // proposito: a trilha mostra IP, e-mail tentado em login falho e de/para de dado pessoal.
  const tabs = TABS.filter((item) =>
    // "turmas" segue o mesmo publico de "usuarios": a API libera supervisor, coordenador e admin.
    item.key === "usuarios" || item.key === "turmas" ? manageableRoles.length > 0 : role === "admin",
  );
  const [tab, setTab] = useState<Tab>(tabs[0].key);

  return (
    <>
      <PageHeader title="Administração" subtitle="Gerenciamento de usuários, turmas, tipos, fluxos e auditoria" />

      <div className="flex gap-1 border-b border-line-soft bg-surface px-6">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`-mb-px cursor-pointer border-b-2 px-4 py-3 text-sm font-medium ${
              tab === item.key
                ? "border-primary text-primary"
                : "border-transparent text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === "usuarios" && <UserTable currentUserId={currentUserId} manageableRoles={manageableRoles} />}
        {tab === "turmas" && <ClassGroupManager />}
        {tab === "tipos" && <TypeList />}
        {tab === "auditoria" && <AuditTable />}
      </div>
    </>
  );
}
