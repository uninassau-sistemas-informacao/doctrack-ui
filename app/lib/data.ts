export type Role = "professor" | "supervisor" | "secretaria" | "coordenador";

export type ExamStatus =
  | "rascunho"
  | "aguardando_revisao"
  | "em_revisao"
  | "aprovado"
  | "reprovado"
  | "em_impressao"
  | "concluido";

export type Priority = "alta" | "media" | "baixa";

export type RecordStatus =
  | "rascunho"
  | "aguardando_validacao"
  | "validado"
  | "homologado"
  | "arquivado";

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
  status: ExamStatus;
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
  status: RecordStatus;
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

export const USERS: User[] = [
  { id: "u1", name: "Ana Carvalho", email: "ana.carvalho@inst.edu.br", role: "professor", initials: "AC", avatarColor: "#3B82F6" },
  { id: "u2", name: "Bruno Ferreira", email: "bruno.ferreira@inst.edu.br", role: "professor", initials: "BF", avatarColor: "#8B5CF6" },
  { id: "u3", name: "Carlos Mendes", email: "carlos.mendes@inst.edu.br", role: "professor", initials: "CM", avatarColor: "#10B981" },
  { id: "u4", name: "Daniela Rocha", email: "daniela.rocha@inst.edu.br", role: "supervisor", initials: "DR", avatarColor: "#F59E0B" },
  { id: "u5", name: "Eduardo Lima", email: "eduardo.lima@inst.edu.br", role: "secretaria", initials: "EL", avatarColor: "#EF4444" },
  { id: "u6", name: "Fernanda Costa", email: "fernanda.costa@inst.edu.br", role: "coordenador", initials: "FC", avatarColor: "#3B82F6" },
];

export const EXAMS: Exam[] = [
  { id: "e1", title: "Prova Bimestral — Álgebra Linear", discipline: "Matemática", class: "3A", applicationDate: "2026-05-10", priority: "alta", status: "aguardando_revisao", professorId: "u1", professorName: "Ana Carvalho" },
  { id: "e2", title: "Avaliação Trimestral — Interpretação de Texto", discipline: "Português", class: "2B", applicationDate: "2026-05-08", priority: "media", status: "em_revisao", professorId: "u2", professorName: "Bruno Ferreira" },
  { id: "e3", title: "Teste Rápido — Revolução Industrial", discipline: "História", class: "1A", applicationDate: "2026-04-30", priority: "baixa", status: "reprovado", professorId: "u1", professorName: "Ana Carvalho" },
  { id: "e4", title: "Prova Final — Termodinâmica", discipline: "Física", class: "3B", applicationDate: "2026-05-15", priority: "alta", status: "aprovado", professorId: "u3", professorName: "Carlos Mendes" },
  { id: "e5", title: "Avaliação Prática — Soluções Químicas", discipline: "Química", class: "2A", applicationDate: "2026-05-06", priority: "media", status: "em_impressao", professorId: "u3", professorName: "Carlos Mendes" },
  { id: "e6", title: "Prova Bimestral — Genética e Hereditariedade", discipline: "Biologia", class: "3A", applicationDate: "2026-05-12", priority: "alta", status: "concluido", professorId: "u2", professorName: "Bruno Ferreira" },
  { id: "e7", title: "Teste de Vocabulário — Present Perfect", discipline: "Inglês", class: "1B", applicationDate: "2026-05-02", priority: "baixa", status: "rascunho", professorId: "u1", professorName: "Ana Carvalho" },
  { id: "e8", title: "Avaliação — Geopolítica Contemporânea", discipline: "Geografia", class: "2A", applicationDate: "2026-05-07", priority: "media", status: "aguardando_revisao", professorId: "u2", professorName: "Bruno Ferreira" },
];

export const RECORDS: EvaluationRecord[] = [
  { id: "r1", discipline: "Matemática", class: "3A", professor: "Ana Carvalho", date: "2026-04-20", evaluationType: "Prova Bimestral", status: "aguardando_validacao" },
  { id: "r2", discipline: "Física", class: "3B", professor: "Carlos Mendes", date: "2026-04-18", evaluationType: "Avaliação Trimestral", status: "validado" },
  { id: "r3", discipline: "Biologia", class: "3A", professor: "Bruno Ferreira", date: "2026-04-15", evaluationType: "Prova Bimestral", status: "homologado" },
  { id: "r4", discipline: "Química", class: "2A", professor: "Carlos Mendes", date: "2026-04-10", evaluationType: "Prova Prática", status: "arquivado" },
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

export const STATUS_CONFIG: Record<ExamStatus, BadgeStyle> = {
  rascunho: { label: "Rascunho", color: "#6B7280", bg: "#F3F4F6" },
  aguardando_revisao: { label: "Aguardando Revisão", color: "#F59E0B", bg: "#FEF3C7" },
  em_revisao: { label: "Em Revisão", color: "#3B82F6", bg: "#EFF6FF" },
  aprovado: { label: "Aprovado", color: "#10B981", bg: "#ECFDF5" },
  reprovado: { label: "Reprovado", color: "#EF4444", bg: "#FEE2E2" },
  em_impressao: { label: "Em Impressão", color: "#8B5CF6", bg: "#F5F3FF" },
  concluido: { label: "Concluído", color: "#10B981", bg: "#D1FAE5" },
};

export const PRIORITY_CONFIG: Record<Priority, BadgeStyle> = {
  alta: { label: "Alta", color: "#EF4444", bg: "#FEE2E2" },
  media: { label: "Média", color: "#F59E0B", bg: "#FEF3C7" },
  baixa: { label: "Baixa", color: "#10B981", bg: "#ECFDF5" },
};

export const RECORD_STATUS_CONFIG: Record<RecordStatus, BadgeStyle> = {
  rascunho: { label: "Rascunho", color: "#6B7280", bg: "#F3F4F6" },
  aguardando_validacao: { label: "Aguard. Validação", color: "#F59E0B", bg: "#FEF3C7" },
  validado: { label: "Validado", color: "#3B82F6", bg: "#EFF6FF" },
  homologado: { label: "Homologado", color: "#10B981", bg: "#ECFDF5" },
  arquivado: { label: "Arquivado", color: "#6B7280", bg: "#F3F4F6" },
};

export const ROLE_LABELS: Record<Role, string> = {
  professor: "Professor",
  supervisor: "Supervisor",
  secretaria: "Secretaria",
  coordenador: "Coordenador",
};

export const NOTIF_DOT: Record<NotificationType, string> = {
  info: "#185FA5",
  success: "#0F6E56",
  warning: "#BA7517",
  error: "#993C1D",
};

export const ROLES: Role[] = ["professor", "supervisor", "secretaria", "coordenador"];

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
