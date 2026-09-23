"use client";

import { useState } from "react";

import { canSeeReports } from "../../lib/api/dto/authSchema";
import type { MeResponse } from "../../lib/api/dto/authSchema";
import type { DocumentType } from "../../lib/api/dto/workflowSchema";
import type { User } from "../lib/data";
import { useUnreadCount } from "../lib/use-unread-count";
import Sidebar from "./sidebar";

/** Cores de avatar por posição — o backend não guarda cor de usuário. */
const AVATAR_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

function toUser(me: MeResponse): User {
  const initials = me.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return {
    id: String(me.id),
    name: me.name,
    email: me.email,
    role: me.role,
    initials: initials || me.name.slice(0, 2).toUpperCase(),
    avatarColor: AVATAR_COLORS[me.id % AVATAR_COLORS.length],
  };
}

/** Moldura das telas privadas: sidebar fixa + área de conteúdo rolável. */
export default function Shell({
  me,
  documentTypes,
  children,
}: {
  me: MeResponse;
  documentTypes: DocumentType[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const unreadCount = useUnreadCount();

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink">
      <Sidebar
        user={toUser(me)}
        documentTypes={documentTypes}
        collapsed={collapsed}
        unreadCount={unreadCount}
        canManageUsers={me.manageableRoles.length > 0}
        canSeeReports={canSeeReports(me.role)}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
