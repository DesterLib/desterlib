import { z } from "zod";

const scanOptionsSchema = z
  .object({
    mediaType: z.enum(["movie", "tv"]).optional(),
    maxDepth: z.number().int().min(0).max(10).optional(),
    mediaTypeDepth: z
      .object({
        movie: z.number().int().min(0).max(10).optional(),
        tv: z.number().int().min(0).max(10).optional(),
      })
      .optional(),
    fileExtensions: z.array(z.string()).max(20).optional(),
    filenamePattern: z.string().max(500).optional(),
    excludePattern: z.string().max(500).optional(),
    includePattern: z.string().max(500).optional(),
    directoryPattern: z.string().max(500).optional(),
    excludeDirectories: z.array(z.string()).max(50).optional(),
    includeDirectories: z.array(z.string()).max(50).optional(),
    rescan: z.boolean().optional(),
    minFileSize: z.number().int().min(0).optional(),
    maxFileSize: z.number().int().min(0).optional(),
    followSymlinks: z.boolean().optional(),
  })
  .optional();

export const updateSettingsSchema = z.object({
  tmdbApiKey: z.string().optional(),
  port: z.number().min(1000).max(65535).optional(),
  enableRouteGuards: z.boolean().optional(),
  firstRun: z.boolean().optional(),
  scanSettings: scanOptionsSchema,
});

export const getSettingsSchema = z.object({});

export type UpdateSettingsRequest = z.infer<typeof updateSettingsSchema>;
export type GetSettingsRequest = z.infer<typeof getSettingsSchema>;
