import { z } from "zod";

export const getLogsSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 100)),
  level: z.enum(["error", "warn", "info", "http", "debug"]).optional(),
});

export type GetLogsQuery = z.infer<typeof getLogsSchema>;
