import { z } from "zod";

export const searchMediaSchema = z.object({
  query: z
    .string()
    .min(1, "Search query must be at least 1 character")
    .max(100, "Search query must be at most 100 characters"),
});

export type SearchMediaQuery = z.infer<typeof searchMediaSchema>;

