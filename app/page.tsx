"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import ExamTable from "./components/exam-table";
import KpiCard from "./components/kpi-card";
import PanelCard from "./components/panel-card";
import Sidebar from "./components/sidebar";
import { ROLES, ROLE_LABELS, Role } from "./lib/data";
import { buildDashboardView } from "./lib/dashboard-view";

const emptySubscribe = () => () => {};

export default function DashboardPage() {
  const [role, setRole] = useState<Role>("professor");
  const [collapsed, setCollapsed] = useState(false);

  // Date is browser-local; only render it after hydration to avoid a server/client mismatch.
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const now = hydrated ? new Date() : null;

  const view = useMemo(() => buildDashboardView(role), [role]);

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
    : " ";

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink">
      <Sidebar
        user={view.user}
        collapsed={collapsed}
        unreadCount={view.unreadCount}
        hasAdmin={view.hasAdmin}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-line bg-white px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold">
                  {greetingWord}, {view.user.name.split(" ")[0]}! 👋
                </h1>
                <p className="mt-0.5 text-sm text-muted">{todayLabel}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-0.5 rounded-[10px] border border-line-soft bg-canvas p-[3px]">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        r === role ? "bg-white text-primary" : "text-muted"
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
                {view.headerButton && (
                  <button className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                    <view.headerButton.icon size={16} />
                    {view.headerButton.label}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <div className="grid grid-cols-4 gap-4">
              {view.kpis.map((kpi) => (
                <KpiCard key={kpi.label} kpi={kpi} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {view.panels.map((panel) => (
                <PanelCard key={panel.key} panel={panel} />
              ))}
            </div>

            {view.examRows && <ExamTable rows={view.examRows} />}
          </div>
        </div>
      </main>
    </div>
  );
}
