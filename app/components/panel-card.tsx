"use client";

import { WarningIcon } from "@phosphor-icons/react";
import Link from "next/link";
import type { PanelItemView, PanelView } from "../lib/dashboard-view";
import { PriorityPill, StatusPill } from "./badges";

function PanelItem({ item, href }: { item: PanelItemView; href: string }) {
  return (
    <Link
      href={href}
      className="flex w-full cursor-pointer gap-3 rounded-xl border text-left text-ink no-underline hover:bg-surface-2 hover:text-ink hover:no-underline"
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
        {item.prio && <PriorityPill priority={item.prio} showLabel={false} />}
        {item.badge && <StatusPill status={item.badge} />}
      </div>
    </Link>
  );
}

export default function PanelCard({ panel }: { panel: PanelView }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-5 ${panel.fullWidth ? "col-span-full" : ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{panel.title}</h2>
        {panel.linkLabel && (
          <Link href={panel.href} className="text-xs text-primary">
            {panel.linkLabel}
          </Link>
        )}
        {panel.warn && <WarningIcon size={16} className="text-warning" />}
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
            <PanelItem key={item.key} item={item} href={panel.href} />
          ))}
        </div>
      )}
    </div>
  );
}
