import { z } from "zod";

export const updateSettingsSchema = z.object({
  tmdbApiKey: z.string().optional(),
  port: z.number().min(1000).max(65535).optional(),
  enableRouteGuards: z.boolean().optional(),
});

export const getSettingsSchema = z.object({});

export type UpdateSettingsRequest = z.infer<typeof updateSettingsSchema>;
export type GetSettingsRequest = z.infer<typeof getSettingsSchema>;
