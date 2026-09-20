import { apiFetch } from "./client";
import {
  adminUserSchema,
  type AdminUser,
  type AdminUserCreateInput,
  type AdminUserUpdateInput,
  type DocumentTypeInput,
  type WorkflowStatusInput,
  type WorkflowTransitionInput,
} from "./dto/adminSchema";
import {
  documentTypeSchema,
  workflowStatusSchema,
  workflowTransitionSchema,
  type DocumentType,
  type WorkflowStatus,
  type WorkflowTransition,
} from "./dto/workflowSchema";
import { z } from "zod";

/**
 * Rotas de administração (E4). As rotas de tipo de documento/workflow exigem papel admin no
 * backend (`@PreAuthorize("hasAuthority('ADMIN')")`); as quatro rotas de usuário (`/users`) não
 * são admin-only — a autorização é hierárquica (`Role.manages()`), resolvida no
 * `UserManagementService`. Em ambos os casos a UI só esconde o menu e a página redireciona;
 * quem decide é a API — esconder link não é controle de acesso.
 */
export const AdminApi = {
  async listUsers(search?: string): Promise<AdminUser[]> {
    const query = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    return z.array(adminUserSchema).parse(await apiFetch<unknown>(`/users${query}`));
  },

  async createUser(input: AdminUserCreateInput): Promise<AdminUser> {
    return adminUserSchema.parse(
      await apiFetch<unknown>("/users", { method: "POST", body: JSON.stringify(input) }),
    );
  },

  async updateUser(id: number, input: AdminUserUpdateInput): Promise<AdminUser> {
    return adminUserSchema.parse(
      await apiFetch<unknown>(`/users/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    );
  },

  async deactivateUser(id: number): Promise<void> {
    await apiFetch<void>(`/users/${id}`, { method: "DELETE" });
  },

  async createType(input: DocumentTypeInput): Promise<DocumentType> {
    return documentTypeSchema.parse(
      await apiFetch<unknown>("/admin/document-types", { method: "POST", body: JSON.stringify(input) }),
    );
  },

  async updateType(id: number, input: DocumentTypeInput): Promise<DocumentType> {
    return documentTypeSchema.parse(
      await apiFetch<unknown>(`/admin/document-types/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    );
  },

  async removeType(id: number): Promise<void> {
    await apiFetch<void>(`/admin/document-types/${id}`, { method: "DELETE" });
  },

  // addStatus/updateStatus devolvem o WorkflowStatusResponse criado/atualizado (o service
  // recalcula id e persiste); diferente do brief original, não são void.
  async addStatus(typeId: number, input: WorkflowStatusInput): Promise<WorkflowStatus> {
    return workflowStatusSchema.parse(
      await apiFetch<unknown>(`/admin/document-types/${typeId}/statuses`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  },

  async updateStatus(typeId: number, statusId: number, input: WorkflowStatusInput): Promise<WorkflowStatus> {
    return workflowStatusSchema.parse(
      await apiFetch<unknown>(`/admin/document-types/${typeId}/statuses/${statusId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    );
  },

  async deleteStatus(typeId: number, statusId: number): Promise<void> {
    await apiFetch<void>(`/admin/document-types/${typeId}/statuses/${statusId}`, { method: "DELETE" });
  },

  async addTransition(typeId: number, input: WorkflowTransitionInput): Promise<WorkflowTransition> {
    return workflowTransitionSchema.parse(
      await apiFetch<unknown>(`/admin/document-types/${typeId}/transitions`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  },

  // PUT .../transitions/{id} existe na API (AdminDocumentTypeController#updateTransition) mas
  // não estava listado no brief — sem ele não dá para editar transição, só recriar.
  async updateTransition(
    typeId: number,
    transitionId: number,
    input: WorkflowTransitionInput,
  ): Promise<WorkflowTransition> {
    return workflowTransitionSchema.parse(
      await apiFetch<unknown>(`/admin/document-types/${typeId}/transitions/${transitionId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    );
  },

  async deleteTransition(typeId: number, transitionId: number): Promise<void> {
    await apiFetch<void>(`/admin/document-types/${typeId}/transitions/${transitionId}`, { method: "DELETE" });
  },
};
