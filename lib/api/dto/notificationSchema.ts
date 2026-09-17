import { z } from "zod";

/**
 * Espelha `NotificationResponse`. `readAt` nulo = não lida — é o único estado que a UI
 * precisa distinguir. `documentTypeKey` decide a rota do clique (prova → /provas).
 */
export const notificationSchema = z.object({
  id: z.number(),
  type: z.enum(["MOVEMENT", "DEADLINE", "STALLED"]),
  message: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
  documentId: z.number(),
  documentTypeKey: z.string(),
  documentTitle: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;
