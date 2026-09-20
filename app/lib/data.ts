/**
 * Tipos da UI derivados dos DTOs da API (E2.2) e as configurações visuais que não têm
 * equivalente no banco (cor de prioridade, cor do ponto de notificação, rótulo de papel).
 *
 * Status não tem tabela de cor/rótulo aqui: cor e label vêm de `workflow_statuses` dentro do
 * próprio `status` do documento (ver `badgeFromStatus`). Os mocks que alimentavam o dashboard
 * saíram no E6.2, quando a tela passou a ler `GET /dashboard`.
 */
import type { Priority, UserSummary } from "../../lib/api/dto/documentSchema";
import type { WorkflowStatus } from "../../lib/api/dto/workflowSchema";
import type { Role } from "../../lib/api/dto/authSchema";

export type { Priority, Role, UserSummary, WorkflowStatus };

export type NotificationType = "info" | "success" | "warning" | "error";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  avatarColor: string;
}

export interface BadgeStyle {
  label: string;
  color: string;
  bg: string;
}

/**
 * Badge a partir do status da API. O banco guarda só a cor sólida (texto); o fundo é essa
 * mesma cor a 12% — evita uma segunda coluna e funciona para qualquer status que o admin
 * cadastrar no E4.
 */
export function badgeFromStatus(status: WorkflowStatus): BadgeStyle {
  return { label: status.label, color: status.color, bg: `${status.color}1F` };
}

// --- configs visuais (sem equivalente no banco) ---

export const PRIORITY_CONFIG: Record<Priority, BadgeStyle> = {
  alta: { label: "Alta", color: "#EF4444", bg: "#FEE2E2" },
  media: { label: "Média", color: "#F59E0B", bg: "#FEF3C7" },
  baixa: { label: "Baixa", color: "#10B981", bg: "#ECFDF5" },
};

export const ROLE_LABELS: Record<Role, string> = {
  professor: "Professor",
  supervisor: "Supervisor",
  secretaria: "Secretaria",
  coordenador: "Coordenador",
  admin: "Administrador",
};

export const NOTIF_DOT: Record<NotificationType, string> = {
  info: "#185FA5",
  success: "#0F6E56",
  warning: "#BA7517",
  error: "#993C1D",
};

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** `createdAt` das notificações é ISO com hora; a lista mostra data e hora curtas. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
