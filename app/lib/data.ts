/**
 * Tipos da UI derivados dos DTOs da API (E2.2) + mocks que ainda alimentam o dashboard.
 *
 * Status não tem mais tabela de cor/rótulo aqui: cor e label vêm de `workflow_statuses`
 * dentro do próprio `status` do documento (ver `badgeFromStatus`). Os mocks abaixo saem
 * quando o dashboard passar a ler a API (E2.4/E2.5).
 */
import type { Priority, UserSummary } from "../../lib/api/dto/documentSchema";
import type { WorkflowStatus } from "../../lib/api/dto/workflowSchema";
import { roleSchema, type Role } from "../../lib/api/dto/authSchema";

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

export interface Exam {
  id: string;
  title: string;
  discipline: string;
  class: string;
  applicationDate: string;
  priority: Priority;
  status: WorkflowStatus;
  professorId: string;
  professorName: string;
}

export interface EvaluationRecord {
  id: string;
  discipline: string;
  class: string;
  professor: string;
  date: string;
  evaluationType: string;
  status: WorkflowStatus;
}

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  forRoles: Role[];
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

// --- mocks (saem no E2.4/E2.5) ---

/** Espelha o seed de `workflow_statuses` para os mocks abaixo terem a forma real do DTO. */
function mockStatus(
  key: string,
  label: string,
  position: number,
  color: string,
  flags: { initial?: boolean; finalStatus?: boolean } = {}
): WorkflowStatus {
  return {
    id: position,
    key,
    label,
    position,
    color,
    initial: flags.initial ?? false,
    finalStatus: flags.finalStatus ?? false,
  };
}

const EXAM_STATUS = {
  rascunho: mockStatus("rascunho", "Rascunho", 1, "#6B7280", { initial: true }),
  aguardando_revisao: mockStatus("aguardando_revisao", "Aguardando Revisão", 2, "#F59E0B"),
  em_revisao: mockStatus("em_revisao", "Em Revisão", 3, "#3B82F6"),
  aprovado: mockStatus("aprovado", "Aprovado", 4, "#10B981"),
  reprovado: mockStatus("reprovado", "Reprovado", 5, "#EF4444"),
  em_impressao: mockStatus("em_impressao", "Em Impressão", 6, "#8B5CF6"),
  concluido: mockStatus("concluido", "Concluído", 7, "#059669", { finalStatus: true }),
} as const;

const RECORD_STATUS = {
  rascunho: mockStatus("rascunho", "Rascunho", 1, "#6B7280", { initial: true }),
  aguardando_validacao: mockStatus("aguardando_validacao", "Aguardando Validação", 2, "#F59E0B"),
  validado: mockStatus("validado", "Validado", 3, "#3B82F6"),
  homologado: mockStatus("homologado", "Homologado", 4, "#10B981"),
  arquivado: mockStatus("arquivado", "Arquivado", 5, "#64748B", { finalStatus: true }),
} as const;

export const USERS: User[] = [
  { id: "u1", name: "Ana Carvalho", email: "ana.carvalho@inst.edu.br", role: "professor", initials: "AC", avatarColor: "#3B82F6" },
  { id: "u2", name: "Bruno Ferreira", email: "bruno.ferreira@inst.edu.br", role: "professor", initials: "BF", avatarColor: "#8B5CF6" },
  { id: "u3", name: "Carlos Mendes", email: "carlos.mendes@inst.edu.br", role: "professor", initials: "CM", avatarColor: "#10B981" },
  { id: "u4", name: "Daniela Rocha", email: "daniela.rocha@inst.edu.br", role: "supervisor", initials: "DR", avatarColor: "#F59E0B" },
  { id: "u5", name: "Eduardo Lima", email: "eduardo.lima@inst.edu.br", role: "secretaria", initials: "EL", avatarColor: "#EF4444" },
  { id: "u6", name: "Fernanda Costa", email: "fernanda.costa@inst.edu.br", role: "coordenador", initials: "FC", avatarColor: "#3B82F6" },
];

export const EXAMS: Exam[] = [
  { id: "e1", title: "Prova Bimestral — Álgebra Linear", discipline: "Matemática", class: "3A", applicationDate: "2026-05-10", priority: "alta", status: EXAM_STATUS.aguardando_revisao, professorId: "u1", professorName: "Ana Carvalho" },
  { id: "e2", title: "Avaliação Trimestral — Interpretação de Texto", discipline: "Português", class: "2B", applicationDate: "2026-05-08", priority: "media", status: EXAM_STATUS.em_revisao, professorId: "u2", professorName: "Bruno Ferreira" },
  { id: "e3", title: "Teste Rápido — Revolução Industrial", discipline: "História", class: "1A", applicationDate: "2026-04-30", priority: "baixa", status: EXAM_STATUS.reprovado, professorId: "u1", professorName: "Ana Carvalho" },
  { id: "e4", title: "Prova Final — Termodinâmica", discipline: "Física", class: "3B", applicationDate: "2026-05-15", priority: "alta", status: EXAM_STATUS.aprovado, professorId: "u3", professorName: "Carlos Mendes" },
  { id: "e5", title: "Avaliação Prática — Soluções Químicas", discipline: "Química", class: "2A", applicationDate: "2026-05-06", priority: "media", status: EXAM_STATUS.em_impressao, professorId: "u3", professorName: "Carlos Mendes" },
  { id: "e6", title: "Prova Bimestral — Genética e Hereditariedade", discipline: "Biologia", class: "3A", applicationDate: "2026-05-12", priority: "alta", status: EXAM_STATUS.concluido, professorId: "u2", professorName: "Bruno Ferreira" },
  { id: "e7", title: "Teste de Vocabulário — Present Perfect", discipline: "Inglês", class: "1B", applicationDate: "2026-05-02", priority: "baixa", status: EXAM_STATUS.rascunho, professorId: "u1", professorName: "Ana Carvalho" },
  { id: "e8", title: "Avaliação — Geopolítica Contemporânea", discipline: "Geografia", class: "2A", applicationDate: "2026-05-07", priority: "media", status: EXAM_STATUS.aguardando_revisao, professorId: "u2", professorName: "Bruno Ferreira" },
];

export const RECORDS: EvaluationRecord[] = [
  { id: "r1", discipline: "Matemática", class: "3A", professor: "Ana Carvalho", date: "2026-04-20", evaluationType: "Prova Bimestral", status: RECORD_STATUS.aguardando_validacao },
  { id: "r2", discipline: "Física", class: "3B", professor: "Carlos Mendes", date: "2026-04-18", evaluationType: "Avaliação Trimestral", status: RECORD_STATUS.validado },
  { id: "r3", discipline: "Biologia", class: "3A", professor: "Bruno Ferreira", date: "2026-04-15", evaluationType: "Prova Bimestral", status: RECORD_STATUS.homologado },
  { id: "r4", discipline: "Química", class: "2A", professor: "Carlos Mendes", date: "2026-04-10", evaluationType: "Prova Prática", status: RECORD_STATUS.arquivado },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", message: 'Sua prova "Teste Rápido — Revolução Industrial" foi reprovada pelo supervisor. Veja os comentários.', type: "error", read: false, createdAt: "2026-04-22 16:45", forRoles: ["professor"] },
  { id: "n2", message: 'Nova prova aguardando revisão: "Prova Bimestral — Álgebra Linear" de Ana Carvalho.', type: "warning", read: false, createdAt: "2026-04-22 14:30", forRoles: ["supervisor"] },
  { id: "n3", message: 'Prova "Avaliação Prática — Soluções Químicas" aprovada e pronta para impressão.', type: "info", read: true, createdAt: "2026-04-20 11:00", forRoles: ["secretaria"] },
  { id: "n4", message: "Ata de Matemática (Turma 3A) aguardando sua validação.", type: "warning", read: false, createdAt: "2026-04-21 08:00", forRoles: ["supervisor"] },
  { id: "n5", message: "Ata de Física (Turma 3B) validada pelo supervisor e aguarda homologação.", type: "info", read: false, createdAt: "2026-04-22 09:00", forRoles: ["coordenador"] },
  { id: "n6", message: "Ata de Biologia (Turma 3A) foi homologada. Número de protocolo: PROT-2026-001.", type: "success", read: true, createdAt: "2026-04-20 16:00", forRoles: ["professor", "secretaria"] },
  { id: "n7", message: 'Prova "Prova Final — Termodinâmica" foi aprovada pelo supervisor.', type: "success", read: true, createdAt: "2026-04-18 10:00", forRoles: ["professor"] },
  { id: "n8", message: 'Nova prova aguardando revisão: "Avaliação — Geopolítica Contemporânea" de Bruno Ferreira.', type: "warning", read: false, createdAt: "2026-04-24 11:00", forRoles: ["supervisor"] },
];

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

/** Papéis que o seletor do dashboard oferece — `admin` fica fora até o E4. */
export const ROLES: Role[] = roleSchema.options.filter((r) => r !== "admin");

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
