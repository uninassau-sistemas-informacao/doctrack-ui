import type { Icon } from "@phosphor-icons/react";
import {
  ArchiveIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  ClockIcon,
  ColumnsIcon,
  FileTextIcon,
  PlusIcon,
  PrinterIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import type { Priority } from "../../lib/api/dto/documentSchema";
import type { Dashboard, DashboardKpi } from "../../lib/api/dto/dashboardSchema";
import type { ExamCard } from "../../lib/api/dto/examSchema";
import type { Notification } from "../../lib/api/dto/notificationSchema";
import type { RecordCard } from "../../lib/api/dto/recordSchema";
import { NOTIF_DOT, badgeFromStatus, formatDate, formatDateTime, soft } from "./data";

export interface KpiView {
  /** Identificador estável vindo da API — é ele que chaveia a lista, não o rótulo. */
  key: string;
  label: string;
  value: number;
  icon: Icon;
  color: string;
  bg: string;
}

export interface BadgeView {
  label: string;
  bg: string;
  color: string;
}

export interface PanelItemView {
  key: string;
  align: "center" | "flex-start";
  padding: number;
  bg: string;
  border: string;
  icon?: Icon;
  iconColor?: string;
  iconBg?: string;
  iconBox?: number;
  iconSize?: number;
  dot?: string;
  title: string;
  titleSize: number;
  titleWeight: number;
  sub?: string;
  prio?: Priority;
  badge?: BadgeView;
}

export interface PanelView {
  key: string;
  title: string;
  warn?: boolean;
  linkLabel?: string;
  /** Destino do link do cabeçalho e dos itens do painel (no protótipo, ambos navegam). */
  href: string;
  fullWidth?: boolean;
  empty: { icon: Icon; title: string; desc: string };
  items: PanelItemView[];
}

export interface ExamRowView {
  key: string;
  title: string;
  discipline: string;
  class: string;
  date: string;
  status: BadgeView;
  priority: Priority;
}

export interface DashboardView {
  headerButton: { label: string; icon: Icon } | null;
  kpis: KpiView[];
  panels: PanelView[];
  examRows: ExamRowView[] | null;
}

const ITEM_DEFAULTS = {
  align: "center" as const,
  padding: 12,
  // Sem fundo inline: deixa o hover:bg-surface-2 do item agir.
  bg: "",
  border: "var(--line)",
  titleSize: 14,
  titleWeight: 500,
};

/**
 * Ícone e cor de cada indicador. A API manda `key`, `label` e `value`; a aparência é decisão
 * da UI e mora só aqui. Chave desconhecida (indicador novo na API) cai no estilo neutro em vez
 * de quebrar a tela.
 */
const KPI_STYLE: Record<string, { icon: Icon; color: string; bg: string }> = {
  rascunhos: { icon: FileTextIcon, color: "var(--neutral)", bg: soft("var(--neutral)") },
  aguardando_revisao: { icon: ClockIcon, color: "var(--warning)", bg: soft("var(--warning)") },
  aprovadas: { icon: CheckCircleIcon, color: "var(--success)", bg: soft("var(--success)") },
  reprovadas: { icon: XCircleIcon, color: "var(--danger)", bg: soft("var(--danger)") },
  para_revisar: { icon: ClockIcon, color: "var(--warning)", bg: soft("var(--warning)") },
  em_revisao: { icon: FileTextIcon, color: "var(--info)", bg: soft("var(--info)") },
  atas_para_validar: { icon: ClipboardTextIcon, color: "var(--violet)", bg: soft("var(--violet)") },
  fila_impressao: { icon: PrinterIcon, color: "var(--info)", bg: soft("var(--info)") },
  imprimindo: { icon: ClockIcon, color: "var(--violet)", bg: soft("var(--violet)") },
  para_arquivar: { icon: ArchiveIcon, color: "var(--warning)", bg: soft("var(--warning)") },
  concluidas: { icon: CheckCircleIcon, color: "var(--success)", bg: soft("var(--success)") },
  atas_para_homologar: { icon: ClipboardTextIcon, color: "var(--warning)", bg: soft("var(--warning)") },
  homologadas: { icon: CheckCircleIcon, color: "var(--success)", bg: soft("var(--success)") },
  arquivadas: { icon: ArchiveIcon, color: "var(--neutral)", bg: soft("var(--neutral)") },
  total_provas: { icon: BookOpenIcon, color: "var(--info)", bg: soft("var(--info)") },
};

const NEUTRAL_KPI = { icon: FileTextIcon, color: "var(--neutral)", bg: soft("var(--neutral)") };

function kpiView(kpi: DashboardKpi): KpiView {
  const style = KPI_STYLE[kpi.key] ?? NEUTRAL_KPI;
  return { key: kpi.key, label: kpi.label, value: kpi.value, ...style };
}

/** O tipo da API é semântico; a cor é decisão visual e fica deste lado. */
const NOTIF_SEVERITY: Record<Notification["type"], keyof typeof NOTIF_DOT> = {
  MOVEMENT: "info",
  DEADLINE: "warning",
  STALLED: "error",
};

function examItem(exam: ExamCard, overrides: Partial<PanelItemView> = {}): PanelItemView {
  const s = badgeFromStatus(exam.document.status);
  return {
    ...ITEM_DEFAULTS,
    key: String(exam.id),
    title: exam.document.title,
    badge: { label: s.label, bg: s.bg, color: s.color },
    ...overrides,
  };
}

function recordItem(record: RecordCard, overrides: Partial<PanelItemView> = {}): PanelItemView {
  const s = badgeFromStatus(record.document.status);
  return {
    ...ITEM_DEFAULTS,
    key: String(record.id),
    title: `${record.discipline} — Turma ${record.classGroupCode}`,
    sub: `${record.document.requester?.name ?? "—"} · ${formatDate(record.date)}`,
    badge: { label: s.label, bg: s.bg, color: s.color },
    ...overrides,
  };
}

export function buildDashboardView(data: Dashboard, notifications: Notification[]): DashboardView {
  const kpis = data.kpis.map(kpiView);
  const p = data.panels;

  if (data.role === "professor") {
    const unread = notifications.filter((n) => n.readAt === null);
    return {
      headerButton: { label: "Nova Prova", icon: PlusIcon },
      kpis,
      panels: [
        {
          key: "pending-actions", href: "/provas",
          title: "Ações Pendentes",
          warn: true,
          empty: { icon: CheckCircleIcon, title: "Tudo em dia!", desc: "Não há provas aguardando sua atenção." },
          items: p.pendingActions.map((exam) =>
            examItem(exam, {
              align: "flex-start",
              bg: soft("var(--danger)", 10),
              border: soft("var(--danger)", 40),
              icon: XCircleIcon,
              iconColor: "var(--danger)",
              iconBg: "transparent",
              iconBox: 16,
              iconSize: 16,
              sub: `${exam.discipline} · Turma ${exam.classGroup}`,
            })
          ),
        },
        {
          key: "recent-notifications", href: "/notificacoes",
          title: "Notificações Recentes",
          linkLabel: "Ver todas",
          empty: {
            icon: CheckCircleIcon,
            title: "Sem notificações novas",
            desc: "Você está em dia com todas as notificações.",
          },
          items: unread.slice(0, 5).map((n) => ({
            ...ITEM_DEFAULTS,
            key: String(n.id),
            align: "flex-start" as const,
            border: "transparent",
            dot: NOTIF_DOT[NOTIF_SEVERITY[n.type]],
            titleSize: 12,
            titleWeight: 400,
            title: n.message,
            sub: formatDateTime(n.createdAt),
          })),
        },
      ],
      examRows: p.myExams.map((exam) => {
        const s = badgeFromStatus(exam.document.status);
        return {
          key: String(exam.id),
          title: exam.document.title,
          discipline: exam.discipline,
          class: exam.classGroup,
          date: formatDate(exam.applicationDate),
          status: { label: s.label, bg: s.bg, color: s.color },
          priority: exam.document.priority,
        };
      }),
    };
  }

  if (data.role === "supervisor") {
    return {
      headerButton: { label: "Quadro Kanban", icon: ColumnsIcon },
      kpis,
      panels: [
        {
          key: "review-queue", href: "/provas",
          title: "Fila de Revisão — Provas",
          empty: { icon: CheckCircleIcon, title: "Nenhuma prova pendente", desc: "Tudo revisado!" },
          items: p.reviewQueue.map((exam) =>
            examItem(exam, {
              sub: `${exam.discipline} · ${(exam.document.requester?.name ?? "—").split(" ")[0]}`,
              prio: exam.document.priority,
            })
          ),
        },
        {
          key: "records-to-validate", href: "/atas",
          title: "Atas Aguardando Validação",
          empty: { icon: CheckCircleIcon, title: "Nenhuma ata pendente", desc: "Todas as atas foram validadas." },
          items: p.recordsToValidate.map((record) => recordItem(record)),
        },
      ],
      examRows: null,
    };
  }

  if (data.role === "secretaria") {
    return {
      headerButton: null,
      kpis,
      panels: [
        {
          key: "print-queue", href: "/provas",
          title: "Fila de Impressão",
          linkLabel: "Ver quadro",
          empty: { icon: PrinterIcon, title: "Fila vazia", desc: "Nenhuma prova aguardando impressão." },
          items: p.printQueue.map((exam) =>
            examItem(exam, {
              icon: PrinterIcon,
              iconColor: "var(--info)",
              iconBg: soft("var(--info)"),
              iconBox: 32,
              iconSize: 16,
              sub: `${exam.discipline} · Turma ${exam.classGroup}`,
              badge: undefined,
              prio: exam.document.priority,
            })
          ),
        },
        {
          key: "to-archive", href: "/atas",
          title: "Documentos para Arquivar",
          linkLabel: "Ver atas",
          empty: { icon: ArchiveIcon, title: "Nada para arquivar", desc: "Todos os documentos estão arquivados." },
          items: p.toArchive.map((record) => recordItem(record)),
        },
      ],
      examRows: null,
    };
  }

  // Coordenador e admin compartilham a visão de gestão (decisão do E6). Este ramo é também o
  // fallback: um papel novo em `roleSchema` cai aqui em vez de renderizar tela vazia. Os KPIs
  // continuam certos de qualquer forma — quem decide quais são é a API, por papel — mas os
  // painéis abaixo assumem gestão, então um papel novo precisa ganhar o seu `if` acima.
  return {
    headerButton: null,
    kpis,
    panels: [
      {
        key: "records-to-homologate", href: "/atas",
        title: "Atas Aguardando Homologação",
        linkLabel: "Ver módulo de atas",
        fullWidth: true,
        empty: { icon: CheckCircleIcon, title: "Nenhuma ata pendente", desc: "Todas as atas foram homologadas." },
        items: p.recordsToHomologate.map((record) =>
          recordItem(record, {
            padding: 16,
            icon: FileTextIcon,
            iconColor: "var(--info)",
            iconBg: soft("var(--info)"),
            iconBox: 40,
            iconSize: 18,
            titleWeight: 600,
            sub: `${record.document.requester?.name ?? "—"} · Avaliação ${formatDate(record.date)}`,
          })
        ),
      },
    ],
    examRows: null,
  };
}
