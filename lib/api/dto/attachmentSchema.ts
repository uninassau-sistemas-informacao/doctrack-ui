import { z } from "zod";
import { userSummarySchema } from "./documentSchema";

/** A chave do storage não vem no payload de propósito: o download passa por URL assinada. */
export const attachmentSchema = z.object({
  id: z.number(),
  originalName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number(),
  uploadedBy: userSummarySchema.nullable(),
  createdAt: z.string(),
});

export const uploadUrlSchema = z.object({
  uploadUrl: z.string(),
  storageKey: z.string(),
  contentType: z.string(),
  maxBytes: z.number(),
});

export const downloadUrlSchema = z.object({ downloadUrl: z.string() });

export type Attachment = z.infer<typeof attachmentSchema>;
export type UploadUrl = z.infer<typeof uploadUrlSchema>;
