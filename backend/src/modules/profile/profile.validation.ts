import { z } from "zod";

export const getProfileSchema = z.object({
  params: z.object({
    userId: z.coerce
      .number()
      .int()
      .positive("User ID must be a positive number"),
  }),
});

export const updateProfileIntroSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    headline: z.string().optional().nullable(),
    locationCity: z.string().optional().nullable(),
    locationCountry: z.string().optional().nullable(),
    about: z.string().optional().nullable(),

    profilePictureUrl: z
      .string()
      .url("Invalid profile picture URL")
      .optional()
      .nullable(),
    coverPhotoUrl: z
      .string()
      .url("Invalid cover photo URL")
      .optional()
      .nullable(),
  }),
});
