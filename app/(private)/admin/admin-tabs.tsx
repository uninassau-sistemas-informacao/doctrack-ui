"use client";

import { useState } from "react";

import PageHeader from "../../components/page-header";
import TypeList from "../../components/admin/type-list";
import UserTable from "../../components/admin/user-table";

type Tab = "usuarios" | "tipos";

const TABS: { key: Tab; label: string }[] = [
  { key: "usuarios", label: "Usuários" },
  { key: "tipos", label: "Tipos de Documento" },
];

/**
 * Duas abas, estado local — a escolha não precisa sobreviver a um reload nem ser
 * compartilhável por link, ao contrário da seleção de documento no quadro de provas
 * (que mora na URL justamente porque é compartilhável).
 */
export default function AdminTabs({ currentUserId }: { currentUserId: number }) {
  const [tab, setTab] = useState<Tab>("usuarios");

  return (
    <>
      <PageHeader title="Administração" subtitle="Gerenciamento de usuários, tipos e fluxos" />

      <div className="flex gap-1 border-b border-line-soft bg-white px-6">
        {TABS.map((item) => (
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
        {tab === "usuarios" ? <UserTable currentUserId={currentUserId} /> : <TypeList />}
      </div>
    </>
  );
}
