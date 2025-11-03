import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().trim().max(3000).optional().nullable(),
  hashtags: z.string().trim().optional().nullable(),
  isRepost: z.boolean().optional().default(false),
  originalPostId: z.number().int().positive().optional().nullable(),
  repostComment: z.string().trim().max(1000).optional().nullable(),
  postType: z.enum(["public", "connection-only"]).optional(),
  media: z.array(z.string()).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

