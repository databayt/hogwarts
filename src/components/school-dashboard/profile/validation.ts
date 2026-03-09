import { z } from "zod"

export const updateProfileSchema = z.object({
  displayName: z.string().min(1),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  locale: z.enum(["ar", "en"]).default("ar"),
})

export const updateBioSchema = z.object({
  bio: z.string().max(500).optional(),
})

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(["ar", "en"]).optional(),
  allowMessages: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
})

export const updateGitHubProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  timezone: z.string().optional(),
  statusEmoji: z.string().max(10).optional(),
  statusMessage: z.string().max(100).optional(),
  pronouns: z.string().max(50).optional(),
  socialLinks: z
    .object({
      github: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
})

export const pinnedItemSchema = z.object({
  itemType: z.enum([
    "COURSE",
    "SUBJECT",
    "PROJECT",
    "ACHIEVEMENT",
    "CERTIFICATE",
    "CLASS",
    "CHILD",
    "DEPARTMENT",
    "PUBLICATION",
    "TASK",
  ]),
  itemId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  isPublic: z.boolean().default(true),
})
