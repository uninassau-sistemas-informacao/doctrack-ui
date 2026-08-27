"use client";

import { WarningIcon } from "@phosphor-icons/react";
import type { PanelItemView, PanelView } from "../lib/dashboard-view";

function PanelItem({ item }: { item: PanelItemView }) {
  return (
    <div
      className="flex w-full cursor-pointer gap-3 rounded-xl border text-left"
      style={{
        alignItems: item.align,
        padding: item.padding,
        background: item.bg,
        borderColor: item.border,
      }}
    >
      {item.icon && (
        <span
          className="flex shrink-0 items-center justify-center rounded-[10px]"
          style={{ width: item.iconBox, height: item.iconBox, background: item.iconBg }}
        >
          <item.icon size={item.iconSize} color={item.iconColor} />
        </span>
      )}
      {item.dot && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: item.dot }} />
      )}
      <div className="min-w-0 flex-1">
        <p
          className="m-0 leading-[1.45]"
          style={{ fontSize: item.titleSize, fontWeight: item.titleWeight }}
        >
          {item.title}
        </p>
        {item.sub && <p className="mt-0.5 text-xs text-muted">{item.sub}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.prioColor && (
          <span className="size-2 rounded-full" style={{ background: item.prioColor }} />
        )}
        {item.badge && (
          <span
            className="whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-semibold"
            style={{ background: item.badge.bg, color: item.badge.color }}
          >
            {item.badge.label}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PanelCard({ panel }: { panel: PanelView }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white p-5 ${panel.fullWidth ? "col-span-full" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{panel.title}</h2>
        {panel.linkLabel && (
          <button className="cursor-pointer p-0 text-xs text-primary">{panel.linkLabel}</button>
        )}
        {panel.warn && <WarningIcon size={16} color="#BA7517" />}
      </div>

      {panel.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <div className="mb-3 rounded-xl bg-primary-soft p-4">
            <panel.empty.icon size={28} className="block text-primary" />
          </div>
          <p className="mb-1 text-sm font-semibold">{panel.empty.title}</p>
          <p className="max-w-[200px] text-xs text-muted">{panel.empty.desc}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {panel.items.map((item) => (
            <PanelItem key={item.key} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
