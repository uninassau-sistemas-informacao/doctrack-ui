import type { Icon } from "@phosphor-icons/react";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from "@phosphor-icons/react/dist/ssr";

import type { Priority } from "../../lib/api/dto/documentSchema";
import type { WorkflowStatus } from "../../lib/api/dto/workflowSchema";
import { PRIORITY_CONFIG, soft } from "../lib/data";

/** Pílula de status do protótipo (StatusBadge.tsx): cor do banco, fundo e borda derivados. */
export function StatusPill({ status }: { status: Pick<WorkflowStatus, "label" | "color"> }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full border px-2 py-[2px] text-[11px] font-semibold tracking-[.01em]"
      style={{ color: status.color, background: soft(status.color), borderColor: soft(status.color, 45) }}
    >
      {status.label}
    </span>
  );
}

const PRIORITY_ICONS: Record<Priority, Icon> = {
  alta: ArrowUpIcon,
  media: ArrowRightIcon,
  baixa: ArrowDownIcon,
};

/** Prioridade com seta (PriorityBadge.tsx); `showLabel=false` é o ícone redondo dos cards. */
export function PriorityPill({ priority, showLabel = true }: { priority: Priority; showLabel?: boolean }) {
  const cfg = PRIORITY_CONFIG[priority];
  const ArrowIcon = PRIORITY_ICONS[priority];
  return (
    <span
      title={`Prioridade ${cfg.label}`}
      className={`inline-flex shrink-0 items-center gap-[3px] whitespace-nowrap rounded-full text-[11px] font-semibold ${
        showLabel ? "px-2 py-[2px]" : "p-[3px]"
      }`}
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <ArrowIcon size={10} weight="bold" />
      {showLabel && cfg.label}
    </span>
  );
}

const AVATAR_SIZES = { xs: "size-[22px] text-[9px]", sm: "size-7 text-[11px]" } as const;

/** Avatar tingido do protótipo: iniciais na cor, fundo e borda translúcidos. */
export function Avatar({
  name,
  color = "var(--info)",
  size = "sm",
}: {
  name: string;
  color?: string;
  size?: keyof typeof AVATAR_SIZES;
}) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";
  return (
    <span
      title={name}
      className={`flex shrink-0 items-center justify-center rounded-full border-[1.5px] font-bold tracking-[.03em] ${AVATAR_SIZES[size]}`}
      style={{ color, background: soft(color), borderColor: soft(color, 30) }}
    >
      {initials}
    </span>
  );
}
