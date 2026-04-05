// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Messaging (Direct Messages & Group Chats) Server Actions Module
 *
 * RESPONSIBILITY: Real-time messaging system with conversation management and notifications
 *
 * WHAT IT HANDLES:
 * - Conversations: 1:1 private chats and group chats
 * - Messages: Send, edit, delete with timestamps and read receipts
 * - Participants: Add/remove members from group conversations
 * - Reactions: Emoji/custom reactions to messages (like, love, etc.)
 * - Message state: Mark read/unread, mute, archive, pin conversations
 * - Pagination: Load message history in chunks (pagination via cursor)
 *
 * KEY ALGORITHMS:
 * 1. createConversation(): Validates participant list, creates group or 1:1 based on count
 * 2. sendMessage(): Broadcast new message to all participants (trigger real-time updates)
 * 3. loadMoreMessages(): Cursor-based pagination (offset would be inefficient for large histories)
 * 4. Participant management: Add/remove updates conversation metadata atomically
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - Conversation must be in same school (validated via schoolId)
 * - All participants must be in same school
 * - Message retrieval scoped to conversation members only (prevent cross-conversation leaks)
 * - User cannot send message to conversation they're not part of
 * - Removing participant prevents access to future messages (enforced at DB level)
 *
 * GOTCHAS & NON-OBVIOUS BEHAVIOR:
 * 1. 1:1 conversations can be duplicated (createConversation always creates new, no deduping)
 *    (Rationale: UI can prevent duplicates, but no DB constraint)
 * 2. Message edit/delete is soft-delete (content cleared but record remains for audit)
 * 3. Read receipts are per-user per-message (not per-conversation - can see who read what)
 * 4. Reactions are cumulative (multiple reactions possible per message)
 * 5. Archive is soft-delete (hides from inbox but data remains)
 * 6. loadMoreMessages cursor assumes chronological ordering (relies on createdAt + ID tiebreaker)
 *
 * REAL-TIME CONSIDERATIONS:
 * - sendMessage should trigger WebSocket/SSE broadcast to all participants
 * - Message reactions should update live (implement optimistic UI)
 * - Read receipts should update without full page refresh
 * - Consider implementing typing indicators (currently missing)
 *
 * NOTIFICATION INTEGRATION:
 * - Message received should trigger notification to all participants except sender
 * - Notification type: "message" or "group_message"
 * - Include message preview in notification (first 100 chars)
 * - Muted conversations should suppress notifications
 *
 * PERFORMANCE NOTES:
 * - loadMoreMessages with cursor/limit prevents N+1 queries
 * - Consider indexing on (conversationId, createdAt) for pagination
 * - Mark read/unread operations are O(n) per conversation - consider batching
 * - Reaction queries could benefit from aggregation caching
 *
 * PERMISSION NOTES:
 * - All operations require user to be participant in conversation
 * - Only message sender can edit/delete their own messages
 * - Only conversation creator can remove participants (consider: admin override)
 * - Students cannot DM teachers directly (unless configured)
 *
 * FUTURE IMPROVEMENTS:
 * - Add typing indicators ("User is typing...")
 * - Implement message search across conversations
 * - Add file/media sharing (currently text-only)
 * - Support voice messages or transcription
 * - Add conversation groups/categories (school-wide, by class, etc.)
 * - Implement automatic read status (read when viewed, not manual)
 * - Add forwarding messages to other conversations
 * - Support scheduled messages (send later)
 * - Add message reactions with emoji picker
 */

"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  checkMessageSendRateLimit,
  createRateLimitErrorMessage,
} from "@/lib/rate-limit"
import { getTenantContext } from "@/lib/tenant-context"

import {
  logAttachmentUploaded,
  logConversationArchived,
  logConversationCreated,
  logMessageCreated,
  logMessageDeleted,
  logMessageEdited,
  logParticipantAdded,
  logParticipantRemoved,
} from "./audit"
import {
  assertMessagingPermission,
  canManageParticipants,
  canSendMessage,
  getAuthContext,
  validateConversationType,
} from "./authorization"
import { DEFAULT_SETTINGS, MESSAGES_PATH } from "./config"
import {
  extractMentions,
  notifyMentions,
  notifyNewMessage,
  notifyParticipantAdded,
} from "./notification-helpers"
import {
  getConversation,
  getConversationParticipant,
  getMessage,
  isConversationParticipant,
} from "./queries"
import {
  addParticipantSchema,
  addReactionSchema,
  archiveConversationSchema,
  createConversationInviteSchema,
  createConversationSchema,
  createMessageSchema,
  deleteDraftSchema,
  deleteMessageSchema,
  forwardMessageSchema,
  markConversationAsReadSchema,
  markMessageAsReadSchema,
  muteConversationSchema,
  pinMessageSchema,
  removeParticipantSchema,
  removeReactionSchema,
  respondToInviteSchema,
  saveDraftSchema,
  starMessageSchema,
  unmuteConversationSchema,
  unpinMessageSchema,
  unstarMessageSchema,
  updateConversationSchema,
  updateMessageSchema,
  updateParticipantSchema,
} from "./validation"

// Action response type
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Create a new conversation
 */
export async function createConversation(
  input: z.infer<typeof createConversationSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = createConversationSchema.parse(input)

    // Validate user can create this conversation type
    validateConversationType(authContext, parsed.type)

    // Check if school has active WhatsApp session (auto-enable dual-delivery)
    const waSession = await db.whatsAppSession
      .findUnique({
        where: { schoolId },
        select: { status: true },
      })
      .catch(() => null)
    const autoWhatsApp = waSession?.status === "connected"

    // For direct conversations, check if one already exists
    if (parsed.type === "direct" && parsed.participantIds.length === 1) {
      const otherUserId = parsed.participantIds[0]
      const existing = await db.conversation.findFirst({
        where: {
          schoolId,
          type: "direct",
          OR: [
            {
              directParticipant1Id: authContext.userId,
              directParticipant2Id: otherUserId,
            },
            {
              directParticipant1Id: otherUserId,
              directParticipant2Id: authContext.userId,
            },
          ],
        },
      })

      if (existing) {
        // Auto-enable WhatsApp on existing conversation if school is connected
        if (!existing.whatsappEnabled && autoWhatsApp) {
          db.conversation
            .update({
              where: { id: existing.id },
              data: { whatsappEnabled: true },
            })
            .catch(() => {})
          import("./whatsapp-bridge")
            .then(({ populateParticipantPhones }) =>
              populateParticipantPhones(schoolId, existing.id)
            )
            .catch(() => {})
        }
        return { success: true, data: { id: existing.id } }
      }
    }

    // Create conversation
    const conversation = await db.conversation.create({
      data: {
        schoolId,
        type: parsed.type,
        title: parsed.title,
        avatar: parsed.avatar,
        whatsappEnabled: autoWhatsApp,
        directParticipant1Id:
          parsed.type === "direct" ? authContext.userId : undefined,
        directParticipant2Id:
          parsed.type === "direct" ? parsed.participantIds[0] : undefined,
        participants: {
          create: [
            {
              userId: authContext.userId,
              role: "owner",
            },
            ...parsed.participantIds.map((userId) => ({
              userId,
              role: "member" as const,
            })),
          ],
        },
      },
    })

    // Populate WhatsApp phone numbers for participants (non-blocking)
    if (autoWhatsApp) {
      import("./whatsapp-bridge")
        .then(({ populateParticipantPhones }) =>
          populateParticipantPhones(schoolId, conversation.id)
        )
        .catch((err) =>
          console.error("[createConversation] WA phone populate:", err)
        )
    }

    // Audit log (non-blocking)
    logConversationCreated(
      { schoolId, userId: authContext.userId },
      {
        conversationId: conversation.id,
        conversationType: parsed.type,
        title: parsed.title,
        participantCount: parsed.participantIds.length + 1,
      }
    ).catch((err) =>
      console.error("[createConversation] Audit log error:", err)
    )

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversations-${schoolId}`, "max")
    revalidateTag(`conversations-${authContext.userId}`, "max")

    return { success: true, data: { id: conversation.id } }
  } catch (error) {
    console.error("[createConversation] Error:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create conversation",
    }
  }
}

/**
 * Update conversation
 */
export async function updateConversation(
  input: z.infer<typeof updateConversationSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = updateConversationSchema.parse(input)

    // Get conversation
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )
    if (!conversation) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Get user's participant role
    const participant = await getConversationParticipant(
      schoolId,
      parsed.conversationId,
      authContext.userId
    )

    // Check permission
    const owner = conversation.participants.find((p) => p.role === "owner")
    try {
      assertMessagingPermission(
        authContext,
        "update_conversation",
        {
          id: conversation.id,
          type: conversation.type,
          createdById: owner?.userId || "",
          participantIds: conversation.participants.map((p) => p.userId),
        },
        undefined,
        participant?.role
      )
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Permission denied",
      }
    }

    // Update conversation
    await db.conversation.update({
      where: { id: parsed.conversationId },
      data: {
        title: parsed.title,
        avatar: parsed.avatar,
      },
    })

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversations-${schoolId}`, "max")
    revalidateTag(`conversation-${parsed.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateConversation] Error:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update conversation",
    }
  }
}

/**
 * Archive conversation
 */
export async function archiveConversation(
  input: z.infer<typeof archiveConversationSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = archiveConversationSchema.parse(input)

    // Verify user is participant
    const isParticipant = await isConversationParticipant(
      schoolId,
      parsed.conversationId,
      authContext.userId
    )
    if (!isParticipant) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Get conversation title for audit
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )

    // Archive the conversation itself
    await db.conversation.update({
      where: { id: parsed.conversationId },
      data: {
        isArchived: true,
      },
    })

    // Audit log (non-blocking)
    logConversationArchived(
      { schoolId, userId: authContext.userId },
      {
        conversationId: parsed.conversationId,
        title: conversation?.title ?? undefined,
      }
    ).catch((err) =>
      console.error("[archiveConversation] Audit log error:", err)
    )

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversations-${schoolId}`, "max")
    revalidateTag(`conversation-${parsed.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[archiveConversation] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to archive conversation",
    }
  }
}

/**
 * Send a message
 */
export async function sendMessage(
  input: z.infer<typeof createMessageSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = createMessageSchema.parse(input)

    // Check rate limit before processing
    const rateLimitResult = checkMessageSendRateLimit(
      authContext.userId,
      parsed.conversationId,
      schoolId
    )

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: createRateLimitErrorMessage(rateLimitResult),
      }
    }

    // Get conversation
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )
    if (!conversation) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Get user's participant role
    const participant = await getConversationParticipant(
      schoolId,
      parsed.conversationId,
      authContext.userId
    )

    // Check permission
    const owner = conversation.participants.find((p) => p.role === "owner")
    try {
      assertMessagingPermission(
        authContext,
        "send_message",
        {
          id: conversation.id,
          type: conversation.type,
          createdById: owner?.userId || "",
          participantIds: conversation.participants.map((p) => p.userId),
        },
        undefined,
        participant?.role
      )
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Permission denied",
      }
    }

    // Create message
    const message = await db.message.create({
      data: {
        conversationId: parsed.conversationId,
        senderId: authContext.userId,
        content: parsed.content,
        contentType: parsed.contentType || "text",
        replyToId: parsed.replyToId,
        metadata: parsed.metadata
          ? (parsed.metadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
        status: "sent",
      },
    })

    // Update conversation's lastMessageAt
    await db.conversation.update({
      where: { id: parsed.conversationId },
      data: { lastMessageAt: new Date() },
    })

    // Get sender name for notifications
    const sender = await db.user.findUnique({
      where: { id: authContext.userId },
      select: { username: true },
    })
    const senderName = sender?.username || "Someone"

    // Trigger notifications (non-blocking)
    // 1. Notify all participants about the new message
    notifyNewMessage(
      schoolId,
      parsed.conversationId,
      authContext.userId,
      senderName,
      parsed.content,
      conversation.title || undefined
    ).catch((err) => console.error("[sendMessage] Notification error:", err))

    // 2. Check for and notify mentioned users
    const mentionedUserIds = await extractMentions(parsed.content)
    if (mentionedUserIds.length > 0) {
      notifyMentions(
        schoolId,
        parsed.conversationId,
        authContext.userId,
        senderName,
        parsed.content,
        mentionedUserIds
      ).catch((err) =>
        console.error("[sendMessage] Mention notification error:", err)
      )
    }

    // 3. WhatsApp dispatch (non-blocking)
    if (conversation.whatsappEnabled) {
      import("./whatsapp-bridge")
        .then(({ dispatchMessageToWhatsApp }) =>
          dispatchMessageToWhatsApp(
            schoolId,
            parsed.conversationId,
            message.id,
            parsed.content,
            authContext.userId
          )
        )
        .catch((err) =>
          console.error("[sendMessage] WhatsApp dispatch error:", err)
        )
    }

    // 4. Link preview (non-blocking) — extract URL, unfurl OG metadata, store in metadata
    import("./og-unfurl")
      .then(async ({ unfurlUrl }) => {
        const { extractFirstUrl } = await import("./link-preview")
        const url = extractFirstUrl(parsed.content)
        if (!url) return
        const preview = await unfurlUrl(url)
        if (!preview) return
        await db.message.update({
          where: { id: message.id },
          data: {
            metadata: {
              linkPreview: preview,
            } as unknown as Prisma.InputJsonValue,
          },
        })
      })
      .catch((err) => console.error("[sendMessage] Link preview error:", err))

    // 5. Audit log (non-blocking)
    logMessageCreated(
      { schoolId, userId: authContext.userId },
      {
        conversationId: parsed.conversationId,
        messageId: message.id,
        contentPreview: parsed.content,
        contentLength: parsed.content.length,
        replyToId: parsed.replyToId,
      }
    ).catch((err) => console.error("[sendMessage] Audit log error:", err))

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`messages-${parsed.conversationId}`, "max")
    revalidateTag(`conversation-${parsed.conversationId}`, "max")

    return { success: true, data: { id: message.id } }
  } catch (error) {
    console.error("[sendMessage] Error:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    }
  }
}

/**
 * Message form state for useActionState pattern
 */
export type MessageFormState = {
  success: boolean
  error?: string
  messageId?: string
}

/**
 * Send a message from a form (useActionState pattern)
 *
 * This action is designed for React 19's useActionState hook.
 * It accepts prevState and formData, and returns the new state.
 *
 * @example
 * ```tsx
 * const [state, formAction] = useActionState(sendMessageFromForm, { success: false })
 *
 * <form action={formAction}>
 *   <input type="hidden" name="conversationId" value={conversationId} />
 *   <textarea name="content" />
 *   <input type="hidden" name="replyToId" value={replyToId} />
 *   <button type="submit">Send</button>
 * </form>
 * ```
 */
export async function sendMessageFromForm(
  prevState: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  try {
    // Extract form data
    const conversationId = formData.get("conversationId") as string
    const content = formData.get("content") as string
    const replyToId = formData.get("replyToId") as string | null

    // Validate required fields
    if (!conversationId) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    if (!content || !content.trim()) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Call the existing sendMessage action
    const result = await sendMessage({
      conversationId,
      content: content.trim(),
      contentType: "text",
      replyToId: replyToId || undefined,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      messageId: result.data.id,
    }
  } catch (error) {
    console.error("[sendMessageFromForm] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    }
  }
}

/**
 * Edit a message
 */
export async function editMessage(
  input: z.infer<typeof updateMessageSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = updateMessageSchema.parse(input)

    // Get message
    const message = await getMessage(schoolId, parsed.messageId)
    if (!message) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Check permission (can only edit own messages)
    if (message.senderId !== authContext.userId) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Check edit window
    const now = new Date()
    const messageAge = now.getTime() - new Date(message.createdAt).getTime()
    if (messageAge > DEFAULT_SETTINGS.messageEditWindow) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Update message
    await db.message.update({
      where: { id: parsed.messageId },
      data: {
        content: parsed.content,
        metadata: parsed.metadata
          ? (parsed.metadata as Prisma.InputJsonValue)
          : undefined,
        isEdited: true,
        editedAt: new Date(),
      },
    })

    // Audit log (non-blocking)
    logMessageEdited(
      { schoolId, userId: authContext.userId },
      {
        conversationId: message.conversationId,
        messageId: parsed.messageId,
        contentPreview: parsed.content,
        contentLength: parsed.content.length,
        previousContentLength: message.content?.length,
      }
    ).catch((err) => console.error("[editMessage] Audit log error:", err))

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`messages-${message.conversationId}`, "max")
    revalidateTag(`message-${parsed.messageId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[editMessage] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit message",
    }
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(
  input: z.infer<typeof deleteMessageSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = deleteMessageSchema.parse(input)

    // Get message
    const message = await getMessage(schoolId, parsed.messageId)
    if (!message) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Get user's participant role
    const participant = await getConversationParticipant(
      schoolId,
      message.conversationId,
      authContext.userId
    )

    // Check permission
    const canDelete =
      message.senderId === authContext.userId ||
      participant?.role === "owner" ||
      participant?.role === "admin"

    if (!canDelete) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Soft delete message
    await db.message.update({
      where: { id: parsed.messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: "[Message deleted]",
      },
    })

    // Audit log (non-blocking)
    logMessageDeleted(
      { schoolId, userId: authContext.userId },
      {
        conversationId: message.conversationId,
        messageId: parsed.messageId,
      }
    ).catch((err) => console.error("[deleteMessage] Audit log error:", err))

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`messages-${message.conversationId}`, "max")
    revalidateTag(`message-${parsed.messageId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteMessage] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete message",
    }
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(
  input: z.infer<typeof markMessageAsReadSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = markMessageAsReadSchema.parse(input)

    // Get message
    const message = await getMessage(schoolId, parsed.messageId)
    if (!message) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Create or update read receipt
    await db.messageReadReceipt.upsert({
      where: {
        messageId_userId: {
          messageId: parsed.messageId,
          userId: authContext.userId,
        },
      },
      create: {
        messageId: parsed.messageId,
        userId: authContext.userId,
        readAt: new Date(),
      },
      update: {
        readAt: new Date(),
      },
    })

    revalidateTag(`message-${parsed.messageId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[markMessageAsRead] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark message as read",
    }
  }
}

/**
 * Mark all messages in conversation as read
 */
export async function markConversationAsRead(
  input: z.infer<typeof markConversationAsReadSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const parsed = markConversationAsReadSchema.parse(input)

    const { schoolId } = await getTenantContext()

    // Update participant's last read timestamp
    await db.conversationParticipant.updateMany({
      where: {
        conversationId: parsed.conversationId,
        userId: authContext.userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    })

    // Sync read receipts to WhatsApp (non-blocking)
    if (schoolId) {
      const conversation = await db.conversation.findUnique({
        where: { id: parsed.conversationId },
        select: { whatsappEnabled: true },
      })
      if (conversation?.whatsappEnabled) {
        // Get unread WhatsApp messages to sync
        const unreadWaMessages = await db.message.findMany({
          where: {
            conversationId: parsed.conversationId,
            whatsappMessageId: { not: null },
            whatsappStatus: { not: "read" },
            senderId: { not: authContext.userId },
          },
          select: { id: true },
          take: 50,
        })
        if (unreadWaMessages.length > 0) {
          import("./whatsapp-bridge")
            .then(({ syncReadReceiptsToWhatsApp }) =>
              syncReadReceiptsToWhatsApp(
                schoolId,
                parsed.conversationId,
                unreadWaMessages.map((m) => m.id)
              )
            )
            .catch((err) =>
              console.error("[markConversationAsRead] WA read sync error:", err)
            )
        }
      }
    }

    revalidateTag(`conversation-${parsed.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[markConversationAsRead] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark conversation as read",
    }
  }
}

/**
 * Add participant to conversation
 */
export async function addParticipant(
  input: z.infer<typeof addParticipantSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = addParticipantSchema.parse(input)

    // Get conversation
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )
    if (!conversation) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Get user's participant role
    const participant = await getConversationParticipant(
      schoolId,
      parsed.conversationId,
      authContext.userId
    )

    // Check permission
    if (!canManageParticipants(participant?.role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Add participant
    await db.conversationParticipant.create({
      data: {
        conversationId: parsed.conversationId,
        userId: parsed.userId,
        role: parsed.role || "member",
      },
    })

    // Get the adder's name for notification
    const adder = await db.user.findUnique({
      where: { id: authContext.userId },
      select: { username: true },
    })
    const adderName = adder?.username || "Someone"

    // Notify the added user (non-blocking)
    notifyParticipantAdded(
      schoolId,
      parsed.conversationId,
      parsed.userId,
      authContext.userId,
      adderName,
      conversation.title || undefined
    ).catch((err) => console.error("[addParticipant] Notification error:", err))

    // Audit log (non-blocking)
    logParticipantAdded(
      { schoolId, userId: authContext.userId },
      {
        conversationId: parsed.conversationId,
        targetUserId: parsed.userId,
        newRole: parsed.role || "member",
      }
    ).catch((err) => console.error("[addParticipant] Audit log error:", err))

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversation-${parsed.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[addParticipant] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add participant",
    }
  }
}

/**
 * Remove participant from conversation
 */
export async function removeParticipant(
  input: z.infer<typeof removeParticipantSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const parsed = removeParticipantSchema.parse(input)

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Get user's participant role
    const participant = await getConversationParticipant(
      schoolId,
      parsed.conversationId,
      authContext.userId
    )

    // Check permission (can remove others if admin/owner, or can leave yourself)
    const canRemove =
      canManageParticipants(participant?.role) ||
      parsed.userId === authContext.userId

    if (!canRemove) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Remove participant
    await db.conversationParticipant.deleteMany({
      where: {
        conversationId: parsed.conversationId,
        userId: parsed.userId,
      },
    })

    // Audit log (non-blocking)
    if (schoolId) {
      logParticipantRemoved(
        { schoolId, userId: authContext.userId },
        {
          conversationId: parsed.conversationId,
          targetUserId: parsed.userId,
        }
      ).catch((err) =>
        console.error("[removeParticipant] Audit log error:", err)
      )
    }

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversation-${parsed.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[removeParticipant] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove participant",
    }
  }
}

/**
 * Add reaction to message
 */
export async function addReaction(
  input: z.infer<typeof addReactionSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = addReactionSchema.parse(input)

    // Get message
    const message = await getMessage(schoolId, parsed.messageId)
    if (!message) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Verify user is participant
    const isParticipant = await isConversationParticipant(
      schoolId,
      message.conversationId,
      authContext.userId
    )
    if (!isParticipant) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Create or update reaction
    await db.messageReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId: parsed.messageId,
          userId: authContext.userId,
          emoji: parsed.emoji,
        },
      },
      create: {
        messageId: parsed.messageId,
        userId: authContext.userId,
        emoji: parsed.emoji,
      },
      update: {},
    })

    revalidateTag(`message-${parsed.messageId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[addReaction] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add reaction",
    }
  }
}

/**
 * Remove reaction from message
 */
export async function removeReaction(
  input: z.infer<typeof removeReactionSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const parsed = removeReactionSchema.parse(input)

    // Delete reaction
    await db.messageReaction.delete({
      where: {
        id: parsed.reactionId,
        userId: authContext.userId, // Can only remove own reactions
      },
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[removeReaction] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove reaction",
    }
  }
}

/**
 * Load more messages with cursor-based pagination (efficient for large conversations)
 *
 * This replaces offset-based pagination for better performance:
 * - No need to scan through skipped rows
 * - Consistent performance regardless of page depth
 * - Works well with real-time data
 *
 * @param conversationId - Conversation ID
 * @param cursor - Message ID to start from (optional)
 * @param take - Number of messages to fetch (default: 50)
 * @param direction - 'before' (load older) or 'after' (load newer)
 */
export async function loadMoreMessages(input: {
  conversationId: string
  cursor?: string
  take?: number
  direction?: "before" | "after"
}): Promise<
  ActionResponse<{
    items: any[]
    hasMore: boolean
    nextCursor: string | null
    prevCursor: string | null
  }>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Check if user is participant in this conversation
    const isParticipant = await isConversationParticipant(
      schoolId,
      input.conversationId,
      authContext.userId
    )

    if (!isParticipant) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Import the cursor-based query and serialization utility
    const { getMessagesWithCursor } = await import("./queries")
    const { serializeMessagesPaginated } = await import("./serialization")

    // Fetch messages with cursor
    const result = await getMessagesWithCursor(schoolId, input.conversationId, {
      cursor: input.cursor,
      take: input.take ?? 50,
      direction: input.direction ?? "before",
    })

    // Serialize dates for client components
    const serialized = serializeMessagesPaginated(result)

    return { success: true, data: serialized }
  } catch (error) {
    console.error("[loadMoreMessages] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load messages",
    }
  }
}

/**
 * Pin/Unpin a conversation for the current user
 */
export async function pinConversation(input: {
  conversationId: string
  isPinned: boolean
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    // Update user's participant record
    await db.conversationParticipant.updateMany({
      where: {
        conversationId: input.conversationId,
        userId: authContext.userId,
      },
      data: {
        isPinned: input.isPinned,
      },
    })

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversation-${input.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[pinConversation] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update pin status",
    }
  }
}

/**
 * Mute a conversation for the current user
 */
export async function muteConversation(input: {
  conversationId: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    // Update user's participant record
    await db.conversationParticipant.updateMany({
      where: {
        conversationId: input.conversationId,
        userId: authContext.userId,
      },
      data: {
        isMuted: true,
      },
    })

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversation-${input.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[muteConversation] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to mute conversation",
    }
  }
}

/**
 * Unmute a conversation for the current user
 */
export async function unmuteConversation(input: {
  conversationId: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    // Update user's participant record
    await db.conversationParticipant.updateMany({
      where: {
        conversationId: input.conversationId,
        userId: authContext.userId,
      },
      data: {
        isMuted: false,
      },
    })

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversation-${input.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[unmuteConversation] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to unmute conversation",
    }
  }
}

/**
 * Leave (delete from user's view) a conversation
 * For direct conversations, this archives it
 * For group conversations, this removes the user from participants
 */
export async function leaveConversation(input: {
  conversationId: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Get conversation to check type
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      input.conversationId
    )

    if (!conversation) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    if (conversation.type === "direct") {
      // For direct conversations, archive it
      await db.conversation.update({
        where: { id: input.conversationId },
        data: { isArchived: true },
      })
    } else {
      // For group conversations, remove the participant
      await db.conversationParticipant.deleteMany({
        where: {
          conversationId: input.conversationId,
          userId: authContext.userId,
        },
      })
    }

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversations-${schoolId}`, "max")
    revalidateTag(`conversation-${input.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[leaveConversation] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to leave conversation",
    }
  }
}

// =============================================================================
// Search Actions
// =============================================================================

/**
 * Global search across conversations and messages
 *
 * Searches both conversation metadata (title, description) and
 * message content using PostgreSQL full-text search with ranking.
 */
export async function searchMessaging(input: {
  query: string
  limit?: number
  includeConversations?: boolean
  includeMessages?: boolean
}): Promise<
  ActionResponse<{
    conversations: Array<{
      id: string
      type: string
      title: string | null
      lastMessageAt: Date | null
    }>
    messages: Array<{
      id: string
      conversationId: string
      content: string
      senderUsername: string | null
      conversationTitle: string | null
      createdAt: Date
      rank: number
    }>
    totalConversations: number
    totalMessages: number
  }>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Validate query
    const query = input.query?.trim()
    if (!query || query.length < 2) {
      return {
        success: false,
        error: "Search query must be at least 2 characters",
      }
    }

    // Import search function
    const { globalSearch } = await import("./queries")

    const results = await globalSearch(schoolId, authContext.userId, query, {
      limit: input.limit ?? 20,
      includeConversations: input.includeConversations ?? true,
      includeMessages: input.includeMessages ?? true,
    })

    // Serialize results for client
    return {
      success: true,
      data: {
        conversations: results.conversations.map((c) => ({
          id: c.id,
          type: c.type,
          title: c.title,
          lastMessageAt: c.lastMessageAt,
        })),
        messages: results.messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          content: m.content,
          senderUsername: m.senderUsername,
          conversationTitle: m.conversationTitle,
          createdAt: m.createdAt,
          rank: m.rank,
        })),
        totalConversations: results.totalConversations,
        totalMessages: results.totalMessages,
      },
    }
  } catch (error) {
    console.error("[searchMessaging] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
    }
  }
}

/**
 * Search messages within a specific conversation
 */
export async function searchConversationMessages(input: {
  conversationId: string
  query: string
  limit?: number
  offset?: number
}): Promise<
  ActionResponse<{
    results: Array<{
      id: string
      content: string
      senderUsername: string | null
      createdAt: Date
      rank: number
    }>
    total: number
  }>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Validate query
    const query = input.query?.trim()
    if (!query || query.length < 2) {
      return {
        success: false,
        error: "Search query must be at least 2 characters",
      }
    }

    // Verify user is participant
    const isParticipant = await isConversationParticipant(
      schoolId,
      input.conversationId,
      authContext.userId
    )
    if (!isParticipant) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Import search function
    const { fullTextSearchMessages } = await import("./queries")

    const { results, total } = await fullTextSearchMessages(
      schoolId,
      authContext.userId,
      query,
      {
        conversationId: input.conversationId,
        limit: input.limit ?? 50,
        offset: input.offset ?? 0,
      }
    )

    return {
      success: true,
      data: {
        results: results.map((r) => ({
          id: r.id,
          content: r.content,
          senderUsername: r.senderUsername,
          createdAt: r.createdAt,
          rank: r.rank,
        })),
        total,
      },
    }
  } catch (error) {
    console.error("[searchConversationMessages] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
    }
  }
}

/**
 * Get search suggestions based on user's message history
 */
export async function fetchSearchSuggestions(input: {
  prefix: string
  limit?: number
}): Promise<ActionResponse<string[]>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Import function with alias to avoid collision
    const queries = await import("./queries")

    const suggestions = await queries.getSearchSuggestions(
      schoolId,
      authContext.userId,
      input.prefix,
      input.limit ?? 5
    )

    return { success: true, data: suggestions }
  } catch (error) {
    console.error("[fetchSearchSuggestions] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get suggestions",
    }
  }
}

/**
 * Fetch a conversation and its messages for client-side switching.
 * Used to avoid full page reloads when switching conversations.
 */
export async function fetchConversationData(input: {
  conversationId: string
  take?: number
}): Promise<
  ActionResponse<{
    conversation: any
    messages: any[]
    hasMore: boolean
  }>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const { getConversation, getMessagesList } = await import("./queries")
    const { serializeConversation, serializeMessages } =
      await import("./serialization")

    const take = input.take ?? 50

    const [conversation, messagesResult] = await Promise.all([
      getConversation(schoolId, authContext.userId, input.conversationId),
      getMessagesList(schoolId, {
        conversationId: input.conversationId,
        page: 1,
        perPage: take,
      }),
    ])

    if (!conversation) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    return {
      success: true,
      data: {
        conversation: serializeConversation(conversation),
        messages: serializeMessages(messagesResult.rows),
        hasMore: messagesResult.count > take,
      },
    }
  } catch (error) {
    console.error("[fetchConversationData] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch conversation",
    }
  }
}

/**
 * Poll for new messages in a conversation (fallback when Socket.IO unavailable).
 */
export async function pollNewMessages(input: {
  conversationId: string
  afterMessageId?: string
}): Promise<ActionResponse<{ items: any[] }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const isParticipant = await isConversationParticipant(
      schoolId,
      input.conversationId,
      authContext.userId
    )
    if (!isParticipant) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    const { serializeMessages } = await import("./serialization")

    // If we have a cursor, fetch messages newer than it
    if (input.afterMessageId) {
      const cursorMessage = await db.message.findUnique({
        where: { id: input.afterMessageId },
        select: { createdAt: true },
      })

      if (cursorMessage) {
        const newMessages = await db.message.findMany({
          where: {
            conversationId: input.conversationId,
            createdAt: { gt: cursorMessage.createdAt },
            isDeleted: false,
          },
          include: {
            sender: {
              select: { id: true, username: true, email: true, image: true },
            },
            attachments: true,
            reactions: {
              include: { user: { select: { id: true, username: true } } },
            },
            replyTo: {
              include: { sender: { select: { id: true, username: true } } },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 50,
        })

        return {
          success: true,
          data: { items: serializeMessages(newMessages) },
        }
      }
    }

    // No cursor — return empty (initial load uses fetchConversationData)
    return { success: true, data: { items: [] } }
  } catch (error) {
    console.error("[pollNewMessages] Error:", error)
    return { success: false, error: "Failed to poll messages" }
  }
}

/**
 * Poll for conversation list updates (fallback when Socket.IO unavailable).
 */
export async function pollConversationUpdates(): Promise<
  ActionResponse<{ conversations: any[] }>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const { getConversationsList } = await import("./queries")
    const { serializeConversations } = await import("./serialization")

    const result = await getConversationsList(schoolId, authContext.userId, {
      page: 1,
      perPage: 50,
    })

    return {
      success: true,
      data: { conversations: serializeConversations(result.rows) },
    }
  } catch (error) {
    console.error("[pollConversationUpdates] Error:", error)
    return { success: false, error: "Failed to poll conversations" }
  }
}

/**
 * Toggle WhatsApp delivery for a conversation.
 * When enabling, resolves and caches phone numbers for all participants.
 */
export async function toggleConversationWhatsApp(input: {
  conversationId: string
  enabled: boolean
}): Promise<ActionResponse<{ enabled: boolean }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Check participant is owner or admin
    const participant = await getConversationParticipant(
      schoolId,
      input.conversationId,
      authContext.userId
    )
    if (!participant || !["owner", "admin"].includes(participant.role)) {
      return {
        success: false,
        error: "Only owner or admin can toggle WhatsApp",
      }
    }

    // If enabling, check school has active WhatsApp session
    if (input.enabled) {
      const waSession = await db.whatsAppSession.findUnique({
        where: { schoolId },
        select: { status: true },
      })
      if (!waSession || waSession.status !== "connected") {
        return {
          success: false,
          error:
            "WhatsApp is not connected. Connect via the WhatsApp dashboard first.",
        }
      }

      // Populate phone numbers for participants
      const { populateParticipantPhones } = await import("./whatsapp-bridge")
      await populateParticipantPhones(schoolId, input.conversationId)
    }

    await db.conversation.update({
      where: { id: input.conversationId },
      data: { whatsappEnabled: input.enabled },
    })

    revalidatePath(MESSAGES_PATH)

    return { success: true, data: { enabled: input.enabled } }
  } catch (error) {
    console.error("[toggleConversationWhatsApp] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to toggle WhatsApp",
    }
  }
}

/**
 * Forward a message to one or more conversations
 */
export async function forwardMessage(
  input: z.infer<typeof forwardMessageSchema>
): Promise<ActionResponse<{ messageIds: string[] }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = forwardMessageSchema.parse(input)

    // Get original message
    const originalMessage = await db.message.findUnique({
      where: { id: parsed.messageId },
      include: {
        conversation: { select: { schoolId: true } },
        attachments: true,
      },
    })

    if (
      !originalMessage ||
      originalMessage.conversation.schoolId !== schoolId
    ) {
      return { success: false, error: "Message not found" }
    }

    // Verify user is participant of the source conversation
    const isSourceParticipant = await isConversationParticipant(
      schoolId,
      originalMessage.conversationId,
      authContext.userId
    )
    if (!isSourceParticipant) {
      return { success: false, error: "Not a participant of this conversation" }
    }

    const messageIds: string[] = []

    for (const targetConversationId of parsed.targetConversationIds) {
      // Verify user is participant of target conversation
      const isTargetParticipant = await isConversationParticipant(
        schoolId,
        targetConversationId,
        authContext.userId
      )
      if (!isTargetParticipant) continue

      // Create forwarded message
      const forwarded = await db.message.create({
        data: {
          conversationId: targetConversationId,
          senderId: authContext.userId,
          content: originalMessage.content,
          contentType: originalMessage.contentType,
          forwardedFromId: originalMessage.id,
          status: "sent",
          attachments:
            originalMessage.attachments.length > 0
              ? {
                  create: originalMessage.attachments.map((a) => ({
                    fileName: a.fileName,
                    fileUrl: a.fileUrl,
                    fileSize: a.fileSize,
                    fileType: a.fileType,
                    width: a.width,
                    height: a.height,
                    thumbnail: a.thumbnail,
                    uploaded: true,
                  })),
                }
              : undefined,
        },
      })

      messageIds.push(forwarded.id)

      // Update conversation lastMessageAt
      await db.conversation.update({
        where: { id: targetConversationId },
        data: { lastMessageAt: new Date() },
      })
    }

    revalidatePath(MESSAGES_PATH)

    return { success: true, data: { messageIds } }
  } catch (error) {
    console.error("[forwardMessage] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to forward message",
    }
  }
}

/**
 * Star a message
 */
export async function starMessage(
  input: z.infer<typeof starMessageSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = starMessageSchema.parse(input)

    // Verify participant
    const isParticipant = await isConversationParticipant(
      schoolId,
      parsed.conversationId,
      authContext.userId
    )
    if (!isParticipant) {
      return { success: false, error: "Not a participant of this conversation" }
    }

    const starred = await db.starredMessage.upsert({
      where: {
        userId_messageId: {
          userId: authContext.userId,
          messageId: parsed.messageId,
        },
      },
      create: {
        userId: authContext.userId,
        messageId: parsed.messageId,
        conversationId: parsed.conversationId,
      },
      update: {},
    })

    return { success: true, data: { id: starred.id } }
  } catch (error) {
    console.error("[starMessage] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to star message",
    }
  }
}

/**
 * Unstar a message
 */
export async function unstarMessage(
  input: z.infer<typeof unstarMessageSchema>
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    await db.starredMessage.deleteMany({
      where: {
        userId: authContext.userId,
        messageId: input.messageId,
      },
    })

    return { success: true, data: { success: true } }
  } catch (error) {
    console.error("[unstarMessage] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unstar message",
    }
  }
}

/**
 * Get starred messages for current user in a conversation
 */
export async function getStarredMessages(input: {
  conversationId?: string
  limit?: number
  cursor?: string
}): Promise<
  ActionResponse<{
    messageIds: string[]
    nextCursor?: string
  }>
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const limit = input.limit || 50

    const starred = await db.starredMessage.findMany({
      where: {
        userId: authContext.userId,
        ...(input.conversationId && {
          conversationId: input.conversationId,
        }),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      select: { id: true, messageId: true },
    })

    const hasMore = starred.length > limit
    const items = hasMore ? starred.slice(0, limit) : starred

    return {
      success: true,
      data: {
        messageIds: items.map((s) => s.messageId),
        nextCursor: hasMore ? items[items.length - 1].id : undefined,
      },
    }
  } catch (error) {
    console.error("[getStarredMessages] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get starred messages",
    }
  }
}
