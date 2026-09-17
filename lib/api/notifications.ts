import { z } from "zod";
import { apiFetch } from "./client";
import { notificationSchema, type Notification } from "./dto/notificationSchema";

/** Caixa de entrada do usuário logado (E3.2). O destinatário é sempre a sessão atual. */
export const NotificationsApi = {
  async list(unreadOnly = false): Promise<Notification[]> {
    const qs = unreadOnly ? "?unread=true" : "";
    return z.array(notificationSchema).parse(await apiFetch<unknown>(`/notifications${qs}`));
  },

  /** Rota enxuta para o polling do badge — não traz o corpo das notificações. */
  async unreadCount(): Promise<number> {
    const data = await apiFetch<unknown>("/notifications/unread-count");
    return z.object({ count: z.number() }).parse(data).count;
  },

  async markAsRead(id: number): Promise<Notification> {
    return notificationSchema.parse(
      await apiFetch<unknown>(`/notifications/${id}/read`, { method: "PATCH" })
    );
  },

  async markAllAsRead(): Promise<number> {
    const data = await apiFetch<unknown>("/notifications/read-all", { method: "POST" });
    return z.object({ updated: z.number() }).parse(data).updated;
  },
};
