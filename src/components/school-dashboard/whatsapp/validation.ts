import { z } from "zod"

// Phone number: E.164 format (e.g., +966501234567)
const phoneSchema = z.string().regex(/^\+[1-9]\d{6,14}$/)

export const connectWhatsAppSchema = z.object({
  schoolId: z.string().min(1),
})

export const sendMessageSchema = z.object({
  recipientPhone: phoneSchema.optional(),
  groupId: z.string().optional(),
  content: z.string().min(1).max(4096),
  contentType: z
    .enum(["text", "image", "document", "audio", "video"])
    .default("text"),
  mediaUrl: z.string().url().optional(),
  mediaCaption: z.string().max(1024).optional(),
})

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(512).optional(),
  type: z
    .enum([
      "section_parents",
      "class_parents",
      "teachers",
      "announcement",
      "custom",
    ])
    .default("custom"),
  sectionId: z.string().optional(),
  classId: z.string().optional(),
  participants: z.array(phoneSchema).min(1),
})

export const addParticipantsSchema = z.object({
  groupId: z.string().min(1),
  participants: z.array(phoneSchema).min(1),
})

export const removeParticipantsSchema = z.object({
  groupId: z.string().min(1),
  participants: z.array(phoneSchema).min(1),
})

export const saveTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  content: z.string().min(1).max(4096),
  type: z.string().min(1),
  lang: z.enum(["ar", "en"]).default("ar"),
  isActive: z.boolean().default(true),
})

export const sendBroadcastSchema = z.object({
  groupIds: z.array(z.string()).min(1),
  content: z.string().min(1).max(4096),
})

export const autoGroupSchema = z.object({
  sectionId: z.string().optional(),
  classId: z.string().optional(),
  type: z.enum(["section_parents", "class_parents"]),
})
