"use client";

import { BellIcon, CheckIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { NotificationsApi } from "../../../lib/api/notifications";
import type { Notification } from "../../../lib/api/dto/notificationSchema";
import PageHeader from "../../components/page-header";
import { unreadCountKey } from "../../lib/use-unread-count";

/** Tipos que ainda não têm tela própria caem no dashboard em vez de virar link quebrado. */
const ROUTE_BY_TYPE_KEY: Record<string, string> = { prova: "/provas", ata: "/atas" };

function documentHref(notification: Notification): string {
  const base = ROUTE_BY_TYPE_KEY[notification.documentTypeKey];
  return base ? `${base}?documento=${notification.documentId}` : "/";
}

function formatMoment(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Caixa de entrada (E3.3, RF03.7). O clique marca como lida e leva ao documento — é a ação
 * que o usuário quer nos dois casos, então não há botão separado de "marcar como lida".
 */
export default function NotificacoesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: items, isPending, error } = useQuery({
    queryKey: ["notifications", "list", unreadOnly] as const,
    queryFn: () => NotificationsApi.list(unreadOnly),
  });

  /** Uma leitura mexe nesta lista e no badge da sidebar; invalidar o prefixo cobre os dois. */
  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const markAll = useMutation({
    mutationFn: () => NotificationsApi.markAllAsRead(),
    onSuccess: invalidate,
  });

  async function open(notification: Notification) {
    if (notification.readAt === null) {
      try {
        await NotificationsApi.markAsRead(notification.id);
        void queryClient.invalidateQueries({ queryKey: unreadCountKey });
      } catch {
        // Navegar importa mais que marcar; o próximo carregamento corrige o estado.
      }
    }
    router.push(documentHref(notification));
  }

  const failure = markAll.error ?? error;
  const loading = isPending;
  const visible = items ?? [];
  const unread = visible.filter((item) => item.readAt === null).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Notificações" subtitle={`${unread} não lida(s)`}>
        <button
          onClick={() => markAll.mutate()}
          disabled={unread === 0 || markAll.isPending}
          className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-muted disabled:opacity-50"
        >
          <CheckIcon size={16} /> Marcar todas como lidas
        </button>
      </PageHeader>

      <div className="flex items-center gap-3 border-b border-line bg-white px-6 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Apenas não lidas
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {failure && (
          <p role="alert" className="mb-3 text-sm text-[#993C1D]">
            {failure instanceof Error ? failure.message : "Não foi possível carregar as notificações."}
          </p>
        )}

        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-muted">
            <BellIcon size={32} />
            <p className="text-sm">Nenhuma notificação por aqui.</p>
          </div>
        )}

        <ul className="flex list-none flex-col gap-2 p-0">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => open(item)}
                className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left ${
                  item.readAt === null
                    ? "border-primary/30 bg-primary-soft"
                    : "border-line bg-white"
                }`}
              >
                <BellIcon
                  size={18}
                  className={`mt-0.5 shrink-0 ${item.readAt === null ? "text-primary" : "text-muted"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.documentTitle}</span>
                  <span className="mt-0.5 block text-sm text-muted">{item.message}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{formatMoment(item.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
