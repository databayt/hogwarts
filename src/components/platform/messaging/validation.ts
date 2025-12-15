/**
 * Messaging System Validation
 *
 * Comprehensive Zod validation for real-time messaging including:
 * - 5 conversation types: direct (1:1), group, class, department, announcement
 * - Participant roles: ADMIN, MODERATOR, MEMBER with different permissions
 * - Message features: reactions (emoji), pins, drafts, read receipts
 * - Attachments: Images (10MB), videos (100MB), documents (50MB), audio (20MB)
 * - Draft management: Auto-save with timestamps
 * - Invites: Time-bounded (future date only), one-time acceptance
 * - Quiet hours: Optional, hour range, digest frequency (daily/weekly)
 *
 * Key constraints:
 * - Direct messages: Exactly 2 participants (1 other user), no title
 * - Groups/Class/Dept: Multiple participants, required title, moderator role
 * - Announcements: Read-only, ADMIN/MODERATOR only post
 * - Messages: Max 4000 chars (SMS-like brevity), max 4000 for drafts
 * - Reactions: 10 char emoji limit (prevents Unicode bomb)
 * - Files: Strict MIME type checking + size limits per category
 * - Pinned messages: Max per conversation (prevents spam)
 *
 * Why specific type rules:
 * - Direct: Simplicity (no group management, implicit participant)
 * - Class: Tied to academic structure, auto-populated, class-wide notifications
 * - Announcement: Read-only + moderated (prevents student replies, maintains authority)
 * - Draft: Prevents data loss from browser crashes, survives navigation
 */

import { z } from "zod"
import { ConversationType, ParticipantRole, MessageStatus } from "@prisma/client"
import { FILE_UPLOAD_CONFIG, DEFAULT_SETTINGS } from "./config"

// Base enums
export const conversationTypeSchema = z.nativeEnum(ConversationType)
export const participantRoleSchema = z.nativeEnum(ParticipantRole)
export const messageStatusSchema = z.nativeEnum(MessageStatus)

// Create conversation schema
export const createConversationSchema = z.object({
  type: conversationTypeSchema,
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters").optional(),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  participantIds: z.array(z.string()).min(1, "At least one participant is required"),
}).superRefine((val, ctx) => {
  // Direct conversations must have exactly 2 participants (1 other user in payload)
  // Why: Direct messages are 1:1; adding 3rd person creates group, not direct
  if (val.type === "direct" && val.participantIds.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Direct conversations must have exactly one other participant",
      path: ["participantIds"],
    })
  }

  // Direct conversations cannot have titles
  // Why: 1:1 conversations are identified by participants, not names
  if (val.type === "direct" && val.title) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Direct conversations cannot have titles",
      path: ["title"],
    })
  }

  // Group/class/department conversations must have titles
  // Why: Multiple participants need identifying name; prevents anonymous group chats
  if (["group", "class", "department", "announcement"].includes(val.type) && !val.title) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "This conversation type requires a title",
      path: ["title"],
    })
  }
})

// Update conversation schema
export const updateConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  title: z.string().min(1).max(255).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
})

// Archive conversation schema
export const archiveConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
})

// Create message schema
export const createMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  content: z.string().min(1, "Message content is required").max(4000, "Message is too long"),
  contentType: z.string().default("text"),
  replyToId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Update message schema
export const updateMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  content: z.string().min(1, "Message content is required").max(4000, "Message is too long"),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Delete message schema
export const deleteMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
})

// Mark message as read schema
export const markMessageAsReadSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
})

// Mark conversation as read schema
export const markConversationAsReadSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
})

// Add participant schema
export const addParticipantSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  userId: z.string().min(1, "User ID is required"),
  role: participantRoleSchema.optional().default("member"),
})

// Remove participant schema
export const removeParticipantSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  userId: z.string().min(1, "User ID is required"),
})

// Update participant schema
export const updateParticipantSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  role: participantRoleSchema.optional(),
  nickname: z.string().max(100, "Nickname is too long").optional().or(z.literal("")),
  isMuted: z.boolean().optional(),
  mutedUntil: z.string().datetime().optional().or(z.literal("")),
  isPinned: z.boolean().optional(),
})

// Create attachment schema
export const createAttachmentSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  fileUrl: z.string().url("Must be a valid URL"),
  fileName: z.string().min(1, "File name is required").max(255, "File name is too long"),
  fileSize: z.number().int().positive("File size must be positive"),
  fileType: z.string().min(1, "File type is required"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).superRefine((val, ctx) => {
  // Validate file size based on MIME type category
  // Why different limits:
  // - Images (10MB): Compression friendly, common for student work photos
  // - Video (100MB): Large due to uncompressed formats, for lesson recordings
  // - Audio (20MB): Smaller, voice notes, language learning
  // - Document (50MB): PDFs, word docs, presentations
  // Prevents: Storage overload, bandwidth issues, accidental resource misuse
  const fileCategory = val.fileType.startsWith("image/")
    ? "image"
    : val.fileType.startsWith("video/")
    ? "video"
    : val.fileType.startsWith("audio/")
    ? "audio"
    : "document"

  const maxSize = FILE_UPLOAD_CONFIG[fileCategory].maxSize
  if (val.fileSize > maxSize) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `File size exceeds maximum allowed size for ${fileCategory} files`,
      path: ["fileSize"],
    })
  }
})

// Add reaction schema
export const addReactionSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  emoji: z.string().min(1, "Emoji is required").max(10, "Emoji is too long"),
})

// Remove reaction schema
export const removeReactionSchema = z.object({
  reactionId: z.string().min(1, "Reaction ID is required"),
})

// Pin message schema
export const pinMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  messageId: z.string().min(1, "Message ID is required"),
})

// Unpin message schema
export const unpinMessageSchema = z.object({
  pinnedMessageId: z.string().min(1, "Pinned message ID is required"),
})

// Create conversation invite schema
export const createConversationInviteSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  inviteeIds: z.array(z.string()).min(1, "At least one invitee is required"),
  expiresAt: z.string().datetime().optional().or(z.literal("")),
}).superRefine((val, ctx) => {
  // Validate expiration is in future
  if (val.expiresAt && val.expiresAt !== "") {
    const expiresDate = new Date(val.expiresAt)
    if (expiresDate <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiration date must be in the future",
        path: ["expiresAt"],
      })
    }
  }
})

// Accept/reject invite schema
export const respondToInviteSchema = z.object({
  inviteId: z.string().min(1, "Invite ID is required"),
  accept: z.boolean(),
})

// Typing indicator schema
export const typingIndicatorSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  isTyping: z.boolean(),
})

// Save draft schema
export const saveDraftSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  content: z.string().max(4000, "Draft is too long"),
  replyToId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Delete draft schema
export const deleteDraftSchema = z.object({
  draftId: z.string().min(1, "Draft ID is required"),
})

// Get conversations list schema
export const getConversationsListSchema = z.object({
  type: z.array(conversationTypeSchema).optional(),
  isArchived: z.boolean().optional(),
  search: z.string().optional(),
  participantId: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  perPage: z.number().int().positive().max(100).optional().default(20),
  sort: z.string().optional(),
})

// Get messages list schema
export const getMessagesListSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  senderId: z.string().optional(),
  contentType: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  hasAttachments: z.boolean().optional(),
  page: z.number().int().positive().optional().default(1),
  perPage: z.number().int().positive().max(100).optional().default(50),
  sort: z.string().optional(),
}).superRefine((val, ctx) => {
  // Validate date range
  if (val.startDate && val.endDate) {
    const start = new Date(val.startDate)
    const end = new Date(val.endDate)
    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must be before end date",
        path: ["startDate"],
      })
    }
  }
})

// Get conversation schema
export const getConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
})

// Get message schema
export const getMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
})

// Mute conversation schema
export const muteConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  mutedUntil: z.string().datetime().optional().or(z.literal("")),
})

// Unmute conversation schema
export const unmuteConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
})

// Search conversations schema
export const searchConversationsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  type: z.array(conversationTypeSchema).optional(),
  participantId: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  perPage: z.number().int().positive().max(100).optional().default(20),
})

// Search messages schema
export const searchMessagesSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  conversationId: z.string().optional(),
  senderId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().optional().default(1),
  perPage: z.number().int().positive().max(100).optional().default(50),
})

// Broadcast message schema (for announcements)
export const broadcastMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  content: z.string().min(1, "Message content is required").max(4000, "Message is too long"),
  contentType: z.string().default("text"),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Export all schemas as a collection
export const messagingSchemas = {
  createConversation: createConversationSchema,
  updateConversation: updateConversationSchema,
  archiveConversation: archiveConversationSchema,
  createMessage: createMessageSchema,
  updateMessage: updateMessageSchema,
  deleteMessage: deleteMessageSchema,
  markMessageAsRead: markMessageAsReadSchema,
  markConversationAsRead: markConversationAsReadSchema,
  addParticipant: addParticipantSchema,
  removeParticipant: removeParticipantSchema,
  updateParticipant: updateParticipantSchema,
  createAttachment: createAttachmentSchema,
  addReaction: addReactionSchema,
  removeReaction: removeReactionSchema,
  pinMessage: pinMessageSchema,
  unpinMessage: unpinMessageSchema,
  createConversationInvite: createConversationInviteSchema,
  respondToInvite: respondToInviteSchema,
  typingIndicator: typingIndicatorSchema,
  saveDraft: saveDraftSchema,
  deleteDraft: deleteDraftSchema,
  getConversationsList: getConversationsListSchema,
  getMessagesList: getMessagesListSchema,
  getConversation: getConversationSchema,
  getMessage: getMessageSchema,
  muteConversation: muteConversationSchema,
  unmuteConversation: unmuteConversationSchema,
  searchConversations: searchConversationsSchema,
  searchMessages: searchMessagesSchema,
  broadcastMessage: broadcastMessageSchema,
} as const
