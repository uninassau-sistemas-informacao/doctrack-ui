"use client";

import type { KpiView } from "../lib/dashboard-view";

export default function KpiCard({ kpi }: { kpi: KpiView }) {
  return (
    <div className="w-full cursor-pointer rounded-xl border border-line bg-surface p-6 text-left shadow-[0_1px_3px_rgba(0,0,0,.04),0_1px_2px_rgba(0,0,0,.02)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-xs font-medium tracking-[.02em] text-muted">{kpi.label}</p>
          <p className="text-3xl font-bold leading-tight" style={{ color: kpi.color }}>
            {kpi.value}
          </p>
        </div>
        <div className="shrink-0 rounded-xl p-3" style={{ background: kpi.bg }}>
          <kpi.icon size={22} color={kpi.color} className="block" />
        </div>
      </div>
    </div>
  );
}
