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
import {
  EXAMS,
  Exam,
  EvaluationRecord,
  NOTIFICATIONS,
  NOTIF_DOT,
  PRIORITY_CONFIG,
  RECORDS,
  Role,
  USERS,
  User,
  badgeFromStatus,
  formatDate,
} from "./data";

export interface KpiView {
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
  prioColor?: string;
  badge?: BadgeView;
}

export interface PanelView {
  key: string;
  title: string;
  warn?: boolean;
  linkLabel?: string;
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
  priority: BadgeView;
}

export interface DashboardView {
  user: User;
  unreadCount: number;
  hasAdmin: boolean;
  headerButton: { label: string; icon: Icon } | null;
  kpis: KpiView[];
  panels: PanelView[];
  examRows: ExamRowView[] | null;
}

const ITEM_DEFAULTS = {
  align: "center" as const,
  padding: 12,
  bg: "transparent",
  border: "rgba(0,0,0,0.09)",
  titleSize: 14,
  titleWeight: 500,
};

function examItem(e: Exam, overrides: Partial<PanelItemView> = {}): PanelItemView {
  const s = badgeFromStatus(e.status);
  return {
    ...ITEM_DEFAULTS,
    key: e.id,
    title: e.title,
    badge: { label: s.label, bg: s.bg, color: s.color },
    ...overrides,
  };
}

function recordItem(r: EvaluationRecord, overrides: Partial<PanelItemView> = {}): PanelItemView {
  const s = badgeFromStatus(r.status);
  return {
    ...ITEM_DEFAULTS,
    key: r.id,
    title: `${r.discipline} — Turma ${r.class}`,
    sub: `${r.professor} · ${formatDate(r.date)}`,
    badge: { label: s.label, bg: s.bg, color: s.color },
    ...overrides,
  };
}

function kpi(label: string, value: number, icon: Icon, color: string, bg: string): KpiView {
  return { label, value, icon, color, bg };
}

export function buildDashboardView(role: Role): DashboardView {
  const user = USERS.find((u) => u.role === role)!;

  const myExams = EXAMS.filter((e) => e.professorId === user.id);
  const pendingSupervisor = EXAMS.filter(
    (e) => e.status.key === "aguardando_revisao" || e.status.key === "em_revisao"
  );
  const printQueue = EXAMS.filter((e) => e.status.key === "aprovado");
  const printingNow = EXAMS.filter((e) => e.status.key === "em_impressao");
  const pendingRecords = RECORDS.filter((r) => r.status.key === "aguardando_validacao");
  const validatedRecords = RECORDS.filter((r) => r.status.key === "validado");
  const homologated = RECORDS.filter((r) => r.status.key === "homologado");

  const myNotifs = NOTIFICATIONS.filter((n) => n.forRoles.includes(role));
  const unread = myNotifs.filter((n) => !n.read);

  let kpis: KpiView[] = [];
  let panels: PanelView[] = [];
  let headerButton: DashboardView["headerButton"] = null;
  let examRows: ExamRowView[] | null = null;

  if (role === "professor") {
    kpis = [
      kpi("Rascunhos", myExams.filter((e) => e.status.key === "rascunho").length, FileTextIcon, "#717182", "#ececf0"),
      kpi("Aguardando Revisão", myExams.filter((e) => e.status.key === "aguardando_revisao").length, ClockIcon, "#BA7517", "#FEF3DC"),
      kpi("Aprovadas", myExams.filter((e) => ["aprovado", "em_impressao", "concluido"].includes(e.status.key)).length, CheckCircleIcon, "#0F6E56", "#E6F4F0"),
      kpi("Reprovadas", myExams.filter((e) => e.status.key === "reprovado").length, XCircleIcon, "#993C1D", "#FCEAE4"),
    ];
    headerButton = { label: "Nova Prova", icon: PlusIcon };

    const rejected = myExams.filter((e) => e.status.key === "reprovado");
    panels = [
      {
        key: "pending-actions",
        title: "Ações Pendentes",
        warn: true,
        empty: { icon: CheckCircleIcon, title: "Tudo em dia!", desc: "Não há provas aguardando sua atenção." },
        items: rejected.map((e) =>
          examItem(e, {
            align: "flex-start",
            bg: "#FCEAE4",
            border: "#f0a58a",
            icon: XCircleIcon,
            iconColor: "#993C1D",
            iconBg: "transparent",
            iconBox: 16,
            iconSize: 16,
            sub: `${e.discipline} · Turma ${e.class}`,
          })
        ),
      },
      {
        key: "recent-notifications",
        title: "Notificações Recentes",
        linkLabel: "Ver todas",
        empty: { icon: CheckCircleIcon, title: "Sem notificações novas", desc: "Você está em dia com todas as notificações." },
        items: unread.slice(0, 5).map((n) => ({
          ...ITEM_DEFAULTS,
          key: n.id,
          align: "flex-start" as const,
          border: "transparent",
          dot: NOTIF_DOT[n.type],
          titleSize: 12,
          titleWeight: 400,
          title: n.message,
          sub: n.createdAt,
        })),
      },
    ];

    examRows = myExams.map((e) => {
      const s = badgeFromStatus(e.status);
      const p = PRIORITY_CONFIG[e.priority];
      return {
        key: e.id,
        title: e.title,
        discipline: e.discipline,
        class: e.class,
        date: formatDate(e.applicationDate),
        status: { label: s.label, bg: s.bg, color: s.color },
        priority: { label: p.label, bg: p.bg, color: p.color },
      };
    });
  }

  if (role === "supervisor") {
    kpis = [
      kpi("Provas para Revisar", pendingSupervisor.filter((e) => e.status.key === "aguardando_revisao").length, ClockIcon, "#BA7517", "#FEF3DC"),
      kpi("Em Revisão", pendingSupervisor.filter((e) => e.status.key === "em_revisao").length, FileTextIcon, "#185FA5", "#EEF4FB"),
      kpi("Atas para Validar", pendingRecords.length, ClipboardTextIcon, "#6B45C8", "#F0EBFD"),
      kpi("Aprovadas Hoje", printQueue.length, CheckCircleIcon, "#0F6E56", "#E6F4F0"),
    ];
    headerButton = { label: "Quadro Kanban", icon: ColumnsIcon };
    panels = [
      {
        key: "review-queue",
        title: "Fila de Revisão — Provas",
        empty: { icon: CheckCircleIcon, title: "Nenhuma prova pendente", desc: "Tudo revisado!" },
        items: pendingSupervisor.map((e) =>
          examItem(e, {
            sub: `${e.discipline} · ${e.professorName.split(" ")[0]}`,
            prioColor: PRIORITY_CONFIG[e.priority].color,
          })
        ),
      },
      {
        key: "records-to-validate",
        title: "Atas Aguardando Validação",
        empty: { icon: CheckCircleIcon, title: "Nenhuma ata pendente", desc: "Todas as atas foram validadas." },
        items: pendingRecords.map((r) => recordItem(r)),
      },
    ];
  }

  if (role === "secretaria") {
    kpis = [
      kpi("Fila de Impressão", printQueue.length, PrinterIcon, "#185FA5", "#EEF4FB"),
      kpi("Imprimindo Agora", printingNow.length, ClockIcon, "#6B45C8", "#F0EBFD"),
      kpi("Para Arquivar", homologated.length, ArchiveIcon, "#BA7517", "#FEF3DC"),
      kpi("Concluídas Hoje", EXAMS.filter((e) => e.status.key === "concluido").length, CheckCircleIcon, "#0F6E56", "#E6F4F0"),
    ];
    panels = [
      {
        key: "print-queue",
        title: "Fila de Impressão",
        linkLabel: "Ver quadro",
        empty: { icon: PrinterIcon, title: "Fila vazia", desc: "Nenhuma prova aguardando impressão." },
        items: printQueue.map((e) =>
          examItem(e, {
            icon: PrinterIcon,
            iconColor: "#185FA5",
            iconBg: "#EEF4FB",
            iconBox: 32,
            iconSize: 16,
            sub: `${e.discipline} · Turma ${e.class}`,
            badge: undefined,
            prioColor: PRIORITY_CONFIG[e.priority].color,
          })
        ),
      },
      {
        key: "to-archive",
        title: "Documentos para Arquivar",
        linkLabel: "Ver atas",
        empty: { icon: ArchiveIcon, title: "Nada para arquivar", desc: "Todos os documentos estão arquivados." },
        items: homologated.map((r) => recordItem(r)),
      },
    ];
  }

  if (role === "coordenador") {
    kpis = [
      kpi("Atas para Homologar", validatedRecords.length, ClipboardTextIcon, "#BA7517", "#FEF3DC"),
      kpi("Homologadas", homologated.length, CheckCircleIcon, "#0F6E56", "#E6F4F0"),
      kpi("Arquivadas", RECORDS.filter((r) => r.status.key === "arquivado").length, ArchiveIcon, "#717182", "#ececf0"),
      kpi("Total de Provas", EXAMS.length, BookOpenIcon, "#185FA5", "#EEF4FB"),
    ];
    panels = [
      {
        key: "records-to-homologate",
        title: "Atas Aguardando Homologação",
        linkLabel: "Ver módulo de atas",
        fullWidth: true,
        empty: { icon: CheckCircleIcon, title: "Nenhuma ata pendente", desc: "Todas as atas foram homologadas." },
        items: validatedRecords.map((r) =>
          recordItem(r, {
            padding: 16,
            icon: FileTextIcon,
            iconColor: "#185FA5",
            iconBg: "#EEF4FB",
            iconBox: 40,
            iconSize: 18,
            titleWeight: 600,
            sub: `${r.professor} · Avaliação ${formatDate(r.date)}`,
          })
        ),
      },
    ];
  }

  return {
    user,
    unreadCount: unread.length,
    hasAdmin: role === "coordenador" || role === "supervisor",
    headerButton,
    kpis,
    panels,
    examRows,
  };
}
