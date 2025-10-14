import { z } from "zod";

/**
 * Notification type enum
 */
export const NotificationTypeSchema = z.enum([
  "scan",
  "metadata",
  "sync",
  "collection",
  "settings",
  "error",
]);

/**
 * Notification status enum
 */
export const NotificationStatusSchema = z.enum([
  "started",
  "progress",
  "completed",
  "failed",
]);

/**
 * Notification event schema
 */
export const NotificationEventSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  status: NotificationStatusSchema,
  message: z.string(),
  timestamp: z.string(),
  data: z.record(z.unknown()).optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
