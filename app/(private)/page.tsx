"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import ExamTable from "../components/exam-table";
import KpiCard from "../components/kpi-card";
import PanelCard from "../components/panel-card";
import { AuthApi } from "../../lib/api/auth";
import { DashboardApi } from "../../lib/api/dashboard";
import { NotificationsApi } from "../../lib/api/notifications";
import { buildDashboardView } from "../lib/dashboard-view";

const emptySubscribe = () => () => {};

export default function DashboardPage() {
  // Date is browser-local; only render it after hydration to avoid a server/client mismatch.
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const now = hydrated ? new Date() : null;

  const { data: me } = useQuery({ queryKey: ["auth", "me"] as const, queryFn: () => AuthApi.me() });
  const {
    data: dashboard,
    isPending,
    error,
  } = useQuery({ queryKey: ["dashboard"] as const, queryFn: () => DashboardApi.get() });
  // As notificações do painel são as mesmas da caixa de entrada — mesma queryKey da tela
  // /notificacoes, então marcar como lida lá atualiza o painel aqui sem refetch extra.
  const { data: notifications } = useQuery({
    queryKey: ["notifications", "list", false] as const,
    queryFn: () => NotificationsApi.list(false),
  });

  const greetingWord = now
    ? now.getHours() < 12
      ? "Bom dia"
      : now.getHours() < 18
        ? "Boa tarde"
        : "Boa noite"
    : "Olá";
  const todayLabel = now
    ? now.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : " ";

  const view = dashboard ? buildDashboardView(dashboard, notifications ?? []) : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-line bg-white px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">
              {greetingWord}
              {me ? `, ${me.name.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="mt-0.5 text-sm text-muted">{todayLabel}</p>
          </div>
          {view?.headerButton && (
            <Link
              href={view.headerButton.label === "Nova Prova" ? "/provas/nova" : "/provas"}
              className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-[0_1px_2px_rgba(0,0,0,.06)]"
            >
              <view.headerButton.icon size={16} />
              {view.headerButton.label}
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {isPending && <p className="text-sm text-muted">Carregando indicadores…</p>}
        {error && (
          <p role="alert" className="text-sm text-[#993C1D]">
            Não foi possível carregar os indicadores.
          </p>
        )}

        {view && (
          <>
            <div className="grid grid-cols-4 gap-4">
              {view.kpis.map((kpi) => (
                <KpiCard key={kpi.key} kpi={kpi} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {view.panels.map((panel) => (
                <PanelCard key={panel.key} panel={panel} />
              ))}
            </div>

            {view.examRows && <ExamTable rows={view.examRows} />}
          </>
        )}
      </div>
    </div>
  );
}
