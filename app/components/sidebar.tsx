"use client";

import type { Icon } from "@phosphor-icons/react";
import {
  BellIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ColumnsIcon,
  FileTextIcon,
  GearIcon,
  GraduationCapIcon,
  SignOutIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AuthApi } from "../../lib/api/auth";
import { ROLE_LABELS, User } from "../lib/data";

interface NavItem {
  key: string;
  icon: Icon;
  label: string;
  href: string;
  badge?: number;
}

/** "/" só casa exato; as demais casam a própria rota e as filhas (ex.: /provas/nova). */
function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

interface SidebarProps {
  user: User;
  collapsed: boolean;
  unreadCount: number;
  hasAdmin: boolean;
  onToggle: () => void;
}

export default function Sidebar({ user, collapsed, unreadCount, hasAdmin, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const expanded = !collapsed;
  const CaretIcon = collapsed ? CaretRightIcon : CaretLeftIcon;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await AuthApi.logout();
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  // Atas (E5) ainda não tem rota; fica apontando para o dashboard até o épico chegar,
  // em vez de virar link quebrado.
  const navItems: NavItem[] = [
    { key: "dashboard", icon: SquaresFourIcon, label: "Dashboard", href: "/" },
    { key: "provas", icon: ColumnsIcon, label: "Gestão de Provas", href: "/provas" },
    { key: "atas", icon: FileTextIcon, label: "Gestão de Atas", href: "/" },
    { key: "notificacoes", icon: BellIcon, label: "Notificações", href: "/notificacoes", badge: unreadCount },
  ];

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col border-r border-line-soft bg-white transition-[width] duration-300"
      style={{ width: collapsed ? 56 : 200 }}
    >
      <div className="flex items-center gap-3 overflow-hidden border-b border-line-soft px-4 py-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]">
          <GraduationCapIcon size={18} color="#fff" />
        </div>
        {expanded && (
          <div className="overflow-hidden">
            <p className="whitespace-nowrap text-sm font-semibold leading-tight">AcadêmicaFlow</p>
            <p className="whitespace-nowrap text-xs text-muted">Gestão Documental</p>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-[52px] z-10 flex size-6 cursor-pointer items-center justify-center rounded-full border border-line bg-white p-0 text-muted shadow-[0_1px_2px_rgba(0,0,0,.06)]"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <CaretIcon size={13} />
      </button>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
        {expanded && (
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Menu</p>
        )}
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              title={item.label}
              className={`relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left no-underline ${
                isActive(pathname, item.href)
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-muted"
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              {expanded && (
                <span className="truncate text-sm">{item.label}</span>
              )}
              {item.badge != null && item.badge > 0 && (
                <span
                  className={`flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#993C1D] px-1 text-[10px] font-bold text-white ${
                    collapsed ? "absolute right-1 top-1" : "ml-auto"
                  }`}
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {hasAdmin && (
          <div>
            {expanded && (
              <p className="mb-2 mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Admin</p>
            )}
            <Link
              href="/admin"
              title="Administração"
              className={`mt-2 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left no-underline ${
                isActive(pathname, "/admin")
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-muted"
              }`}
            >
              <GearIcon size={18} className="shrink-0" />
              {expanded && <span className="whitespace-nowrap text-sm">Administração</span>}
            </Link>
          </div>
        )}
      </nav>

      <div className="border-t border-line-soft p-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: user.avatarColor }}
          >
            {user.initials}
          </span>
          {expanded && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{user.name}</p>
              <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>
            </div>
          )}
        </div>
        {expanded && (
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted disabled:cursor-default disabled:opacity-60"
          >
            <SignOutIcon size={13} /> {isSigningOut ? "Saindo…" : "Sair"}
          </button>
        )}
      </div>
    </aside>
  );
}
