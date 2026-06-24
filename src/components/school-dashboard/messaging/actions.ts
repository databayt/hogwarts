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
  createConversationSchema,
  createMessageSchema,
  deleteMessageSchema,
  forwardMessageSchema,
  markConversationAsReadSchema,
  markMessageAsReadSchema,
  muteConversationSchema,
  removeParticipantSchema,
  removeReactionSchema,
  starMessageSchema,
  unmuteConversationSchema,
  unstarMessageSchema,
  updateConversationSchema,
  updateMessageSchema,
} from "./validation"

// Action response type
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Emit a Socket.IO event via the external socket server (best-effort, non-blocking).
 * Posts to the /api/emit endpoint on the Socket.IO server.
 */
async function emitSocketEvent(
  conversationId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
  const emitSecret = process.env.EMIT_SECRET || process.env.SOCKET_SECRET || ""
  await fetch(`${socketUrl}/api/emit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-emit-secret": emitSecret,
    },
    body: JSON.stringify({
      room: `conversation:${conversationId}`,
      event,
      data,
    }),
  })
}

/**
 * Emit a Socket.IO event to multiple user rooms (for events where
 * the conversation room has no subscribers yet, e.g. new conversations).
 */
async function emitToUsers(
  userIds: string[],
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
  const emitSecret = process.env.EMIT_SECRET || process.env.SOCKET_SECRET || ""
  await fetch(`${socketUrl}/api/emit-to-users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-emit-secret": emitSecret,
    },
    body: JSON.stringify({ userIds, event, data }),
  })
}

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
    let conversation
    try {
      conversation = await db.conversation.create({
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
    } catch (createError) {
      // DB unique index conversations_direct_pair_key: a concurrent request
      // created the same direct pair between our dedup check above and this
      // insert — reuse theirs instead of surfacing an error.
      if (
        parsed.type === "direct" &&
        createError instanceof Prisma.PrismaClientKnownRequestError &&
        createError.code === "P2002"
      ) {
        const existing = await db.conversation.findFirst({
          where: {
            schoolId,
            type: "direct",
            OR: [
              {
                directParticipant1Id: authContext.userId,
                directParticipant2Id: parsed.participantIds[0],
              },
              {
                directParticipant1Id: parsed.participantIds[0],
                directParticipant2Id: authContext.userId,
              },
            ],
          },
          select: { id: true },
        })
        if (existing) {
          return { success: true, data: { id: existing.id } }
        }
      }
      throw createError
    }

    // Notify all participants of new conversation via Socket.IO (non-blocking)
    const allParticipantIds = [authContext.userId, ...parsed.participantIds]
    emitToUsers(allParticipantIds, "conversation:new", {
      id: conversation.id,
      type: parsed.type,
      title: parsed.title ?? null,
      participantIds: allParticipantIds,
    }).catch((err) =>
      console.error("[createConversation] Socket.IO emit error:", err)
    )

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
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }
    return actionError(
      ACTION_ERRORS.CONVERSATION_CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    // Conversation already includes the caller's participant record
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )
    if (!conversation) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    const participant = conversation.participants.find(
      (p) => p.userId === authContext.userId
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
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Update conversation
    await db.conversation.update({
      where: { id: parsed.conversationId },
      data: {
        title: parsed.title,
        avatar: parsed.avatar,
      },
    })

    // Broadcast update via Socket.IO (non-blocking)
    emitSocketEvent(parsed.conversationId, "conversation:updated", {
      conversationId: parsed.conversationId,
      updates: { title: parsed.title, avatar: parsed.avatar },
    }).catch((err) =>
      console.error("[updateConversation] Socket.IO emit error:", err)
    )

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversations-${schoolId}`, "max")
    revalidateTag(`conversation-${parsed.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateConversation] Error:", error)
    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }
    return actionError(
      ACTION_ERRORS.UPDATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    // getConversation is participant-scoped (participants.some(userId)) —
    // a null result already proves the caller isn't a participant, so the
    // separate isConversationParticipant round-trip was redundant.
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )
    if (!conversation) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Archive the conversation itself
    await db.conversation.update({
      where: { id: parsed.conversationId },
      data: {
        isArchived: true,
      },
    })

    // Broadcast archive via Socket.IO (non-blocking)
    emitSocketEvent(parsed.conversationId, "conversation:archived", {
      conversationId: parsed.conversationId,
      userId: authContext.userId,
    }).catch((err) =>
      console.error("[archiveConversation] Socket.IO emit error:", err)
    )

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
    return actionError(
      ACTION_ERRORS.CONVERSATION_ARCHIVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Send a message
 */
export async function sendMessage(
  input: z.infer<typeof createMessageSchema>
): Promise<ActionResponse<{ id: string; message?: any }>> {
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

    // Get conversation (already includes the caller's participant record —
    // no separate getConversationParticipant round-trip needed)
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )
    if (!conversation) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    const participant = conversation.participants.find(
      (p) => p.userId === authContext.userId
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
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Merge clientNonce into metadata for optimistic reconciliation
    const mergedMetadata = parsed.clientNonce
      ? { ...(parsed.metadata || {}), clientNonce: parsed.clientNonce }
      : parsed.metadata

    // Create message
    const message = await db.message.create({
      data: {
        conversationId: parsed.conversationId,
        senderId: authContext.userId,
        content: parsed.content,
        contentType: parsed.contentType || "text",
        replyToId: parsed.replyToId,
        metadata: mergedMetadata
          ? (mergedMetadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
        status: "sent",
      },
    })

    // Create attachments if provided (e.g. voice messages, file uploads)
    if (parsed.attachments?.length) {
      await db.messageAttachment.createMany({
        data: parsed.attachments.map((a) => ({
          messageId: message.id,
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileSize: a.fileSize,
          fileType: a.fileType,
          thumbnail: a.thumbnail ?? null,
          uploaded: true,
        })),
      })
    }

    // Update lastMessageAt and re-fetch the full message (with relations, for
    // the instant client-side update) in parallel — they're independent.
    const [, fullMessage] = await Promise.all([
      db.conversation.update({
        where: { id: parsed.conversationId },
        data: { lastMessageAt: new Date() },
      }),
      getMessage(schoolId, message.id),
    ])

    // Sender is always a participant — name is already in memory, no
    // user.findUnique round-trip.
    const senderName = participant?.user?.username || "Someone"

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

    const { serializeMessage } = await import("./serialization")
    const serialized = serializeMessage(fullMessage)

    // 6. Broadcast via Socket.IO for real-time delivery to other clients (non-blocking)
    emitSocketEvent(parsed.conversationId, "message:new", {
      id: message.id,
      conversationId: parsed.conversationId,
      senderId: authContext.userId,
      content: parsed.content,
      contentType: parsed.contentType || "text",
      createdAt: message.createdAt.toISOString(),
      metadata: mergedMetadata ?? null,
      sender: serialized?.sender ?? null,
      replyToId: parsed.replyToId ?? null,
      attachments: serialized?.attachments ?? [],
    }).catch((err) => console.error("[sendMessage] Socket.IO emit error:", err))

    return {
      success: true,
      data: { id: message.id, message: serialized },
    }
  } catch (error) {
    console.error("[sendMessage] Error:", error)
    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }
    return actionError(
      ACTION_ERRORS.MESSAGE_SEND_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
    const clientNonce = formData.get("clientNonce") as string | null

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
      clientNonce: clientNonce || undefined,
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
    return actionError(
      ACTION_ERRORS.MESSAGE_SEND_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    // Broadcast edit via Socket.IO (non-blocking)
    emitSocketEvent(message.conversationId, "message:updated", {
      messageId: parsed.messageId,
      content: parsed.content,
      editedAt: new Date().toISOString(),
    }).catch((err) => console.error("[editMessage] Socket.IO emit error:", err))

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
    return actionError(
      ACTION_ERRORS.MESSAGE_EDIT_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    // Broadcast delete via Socket.IO (non-blocking)
    emitSocketEvent(message.conversationId, "message:deleted", {
      messageId: parsed.messageId,
      deletedAt: new Date().toISOString(),
    }).catch((err) =>
      console.error("[deleteMessage] Socket.IO emit error:", err)
    )

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
    return actionError(
      ACTION_ERRORS.MESSAGE_DELETE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    // Get message (getMessage is schoolId-scoped — prevents cross-tenant)
    const message = await getMessage(schoolId, parsed.messageId)
    if (!message) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Only a participant of the message's conversation may mark it read
    const canRead = await isConversationParticipant(
      schoolId,
      message.conversationId,
      authContext.userId
    )
    if (!canRead) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Verify participant belongs to this tenant's conversation
    const isParticipant = await isConversationParticipant(
      schoolId,
      parsed.conversationId,
      authContext.userId
    )
    if (!isParticipant) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

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

    // Emit read receipt to other participants via Socket.IO
    emitSocketEvent(parsed.conversationId, "message:read", {
      conversationId: parsed.conversationId,
      userId: authContext.userId,
      readAt: new Date().toISOString(),
    }).catch(() => {})

    // Sync read receipts to WhatsApp — fully detached from the response path.
    // The lookup queries used to run inline and delayed every mark-as-read
    // (which fires on every conversation focus) even when WhatsApp was off.
    void (async () => {
      const conversation = await db.conversation.findUnique({
        where: { id: parsed.conversationId },
        select: { whatsappEnabled: true },
      })
      if (!conversation?.whatsappEnabled) return
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
      if (unreadWaMessages.length === 0) return
      const { syncReadReceiptsToWhatsApp } = await import("./whatsapp-bridge")
      await syncReadReceiptsToWhatsApp(
        schoolId,
        parsed.conversationId,
        unreadWaMessages.map((m) => m.id)
      )
    })().catch((err) =>
      console.error("[markConversationAsRead] WA read sync error:", err)
    )

    revalidateTag(`conversation-${parsed.conversationId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[markConversationAsRead] Error:", error)
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    // Get conversation (includes the caller's participant record)
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )
    if (!conversation) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    const participant = conversation.participants.find(
      (p) => p.userId === authContext.userId
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

    // Broadcast participant added via Socket.IO (non-blocking)
    emitSocketEvent(parsed.conversationId, "conversation:participant_added", {
      conversationId: parsed.conversationId,
      userId: parsed.userId,
      role: parsed.role || "member",
    }).catch((err) =>
      console.error("[addParticipant] Socket.IO emit error:", err)
    )

    // Adder is a participant — name already in memory
    const adderName = participant?.user?.username || "Someone"

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
    return actionError(
      ACTION_ERRORS.PARTICIPANT_ADD_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    // Broadcast participant removed via Socket.IO (non-blocking)
    emitSocketEvent(parsed.conversationId, "conversation:participant_removed", {
      conversationId: parsed.conversationId,
      userId: parsed.userId,
    }).catch((err) =>
      console.error("[removeParticipant] Socket.IO emit error:", err)
    )

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
    return actionError(
      ACTION_ERRORS.PARTICIPANT_REMOVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    // Broadcast reaction via Socket.IO (non-blocking)
    emitSocketEvent(message.conversationId, "message:reaction", {
      messageId: parsed.messageId,
      userId: authContext.userId,
      emoji: parsed.emoji,
    }).catch((err) => console.error("[addReaction] Socket.IO emit error:", err))

    revalidateTag(`message-${parsed.messageId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[addReaction] Error:", error)
    return actionError(
      ACTION_ERRORS.MESSAGE_REACTION_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = removeReactionSchema.parse(input)

    // Verify reaction belongs to a conversation in this school
    const reaction = await db.messageReaction.findFirst({
      where: {
        id: parsed.reactionId,
        userId: authContext.userId,
        message: { conversation: { schoolId } },
      },
      select: {
        id: true,
        emoji: true,
        messageId: true,
        message: { select: { conversationId: true } },
      },
    })
    if (!reaction) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    // Delete reaction
    await db.messageReaction.delete({
      where: {
        id: parsed.reactionId,
        userId: authContext.userId,
      },
    })

    // Broadcast reaction removal via Socket.IO (non-blocking)
    emitSocketEvent(reaction.message.conversationId, "message:reaction", {
      messageId: reaction.messageId,
      userId: authContext.userId,
      emoji: reaction.emoji,
      removed: true,
    }).catch((err) =>
      console.error("[removeReaction] Socket.IO emit error:", err)
    )

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[removeReaction] Error:", error)
    return actionError(
      ACTION_ERRORS.MESSAGE_REACTION_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Verify conversation belongs to this school
    const isParticipant = await isConversationParticipant(
      schoolId,
      input.conversationId,
      authContext.userId
    )
    if (!isParticipant) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
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
    return actionError(
      ACTION_ERRORS.UPDATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
    return actionError(
      ACTION_ERRORS.UPDATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
    return actionError(
      ACTION_ERRORS.UPDATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
    return actionError(
      ACTION_ERRORS.CONVERSATION_LEAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
      return actionError(ACTION_ERRORS.SEARCH_QUERY_TOO_SHORT)
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
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
      return actionError(ACTION_ERRORS.SEARCH_QUERY_TOO_SHORT)
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
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Fetch a conversation and its messages for client-side switching.
 * Used to avoid full page reloads when switching conversations.
 */
export async function fetchConversationData(input: {
  conversationId: string
  take?: number
  locale?: "ar" | "en"
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

    const { getConversation } = await import("./queries")
    const { serializeConversation, serializeMessages } =
      await import("./serialization")

    const take = Math.min(input.take ?? 50, 50)

    // conversationDetailSelect already loads the newest 50 messages with the
    // full message select — reusing them halves the queries per conversation
    // switch (the previous getMessagesList call re-fetched the same rows).
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      input.conversationId
    )

    if (!conversation) {
      return actionError(ACTION_ERRORS.MESSAGE_SEND_FAILED)
    }

    const messages = conversation.messages.slice(0, take)

    const serializedConv = serializeConversation(conversation)
    const serializedMsgs = serializeMessages(messages).reverse()

    // Localize names in ONE batched call if locale is provided
    if (input.locale && serializedConv) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nameRefs: Array<{ obj: any }> = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const collect = (obj: any) => {
        if (obj?.username) nameRefs.push({ obj })
      }
      for (const p of serializedConv.participants ?? []) collect(p.user)
      collect(serializedConv.createdBy)
      collect(serializedConv.lastMessage?.sender)
      for (const msg of serializedMsgs) collect(msg.sender)

      if (nameRefs.length > 0) {
        const { getNames } = await import("@/components/translation/person")
        const translated = await getNames(
          nameRefs,
          (r) => ({ firstName: r.obj.username as string }),
          input.locale,
          schoolId
        )
        for (const r of nameRefs) {
          r.obj.username = translated.get(r.obj.username) ?? r.obj.username
        }
      }
    }

    return {
      success: true,
      data: {
        conversation: serializedConv,
        messages: serializedMsgs,
        hasMore: conversation._count.messages > messages.length,
      },
    }
  } catch (error) {
    console.error("[fetchConversationData] Error:", error)
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    // No cursor — return empty (initial load uses fetchConversationData)
    if (!input.afterMessageId) {
      return { success: true, data: { items: [] } }
    }

    const { messageListSelect } = await import("./queries")
    const { serializeMessages } = await import("./serialization")

    // Single query per poll tick (this runs every 10s for every open chat):
    // - participant scoping is folded into the where clause (was a separate
    //   COUNT round-trip)
    // - the cursor replaces the separate findUnique + createdAt pivot
    // - soft-deleted rows are INCLUDED so the cursor still resolves when the
    //   newest message gets deleted, and clients receive the tombstone
    //   (they dedupe by id, so already-rendered messages are unaffected)
    const newMessages = await db.message.findMany({
      where: {
        conversationId: input.conversationId,
        conversation: {
          schoolId,
          participants: { some: { userId: authContext.userId } },
        },
      },
      cursor: { id: input.afterMessageId },
      skip: 1,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 50,
      select: messageListSelect,
    })

    return {
      success: true,
      data: { items: serializeMessages(newMessages) },
    }
  } catch (error) {
    console.error("[pollNewMessages] Error:", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
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

    const { getConversationsForPoll } = await import("./queries")
    const { serializeConversations } = await import("./serialization")

    // Poll path skips the pagination COUNT query — the client replaces its
    // list wholesale and never reads a total.
    const rows = await getConversationsForPoll(schoolId, authContext.userId)

    return {
      success: true,
      data: { conversations: serializeConversations(rows) },
    }
  } catch (error) {
    console.error("[pollConversationUpdates] Error:", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
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
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // If enabling, check school has active WhatsApp session
    if (input.enabled) {
      const waSession = await db.whatsAppSession.findUnique({
        where: { schoolId },
        select: { status: true },
      })
      if (!waSession || waSession.status !== "connected") {
        return actionError(ACTION_ERRORS.WHATSAPP_NOT_CONNECTED)
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
    return actionError(
      ACTION_ERRORS.UPDATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
      return actionError(ACTION_ERRORS.MESSAGE_NOT_FOUND)
    }

    // Never forward a soft-deleted message (its content is tombstoned)
    if (originalMessage.isDeleted) {
      return actionError(ACTION_ERRORS.MESSAGE_NOT_FOUND)
    }

    // Verify user is participant of the source conversation
    const isSourceParticipant = await isConversationParticipant(
      schoolId,
      originalMessage.conversationId,
      authContext.userId
    )
    if (!isSourceParticipant) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Batch: one query verifies participation in ALL targets, the creates run
    // in a single transaction, and lastMessageAt updates in one updateMany —
    // previously 3 sequential round-trips PER target conversation.
    const targetParticipations = await db.conversationParticipant.findMany({
      where: {
        userId: authContext.userId,
        conversationId: { in: parsed.targetConversationIds },
        conversation: { schoolId },
      },
      select: { conversationId: true },
    })
    const verifiedIds = targetParticipations.map((p) => p.conversationId)

    const forwarded = await db.$transaction(
      verifiedIds.map((targetConversationId) =>
        db.message.create({
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
          select: { id: true },
        })
      )
    )
    const messageIds = forwarded.map((f) => f.id)

    if (verifiedIds.length > 0) {
      await db.conversation.updateMany({
        where: { id: { in: verifiedIds } },
        data: { lastMessageAt: new Date() },
      })
    }

    revalidatePath(MESSAGES_PATH)

    return { success: true, data: { messageIds } }
  } catch (error) {
    console.error("[forwardMessage] Error:", error)
    return actionError(
      ACTION_ERRORS.MESSAGE_SEND_FAILED,
      error instanceof Error ? error.message : undefined
    )
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
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Verify the message belongs to this tenant
    const isParticipant = await isConversationParticipant(
      schoolId,
      input.conversationId,
      authContext.userId
    )
    if (!isParticipant) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Scope the delete to the verified conversation so a caller can't unstar
    // by pairing a conversation they belong to with an unrelated messageId
    // (parity with starMessage, which ties the star to conversationId).
    await db.starredMessage.deleteMany({
      where: {
        userId: authContext.userId,
        messageId: input.messageId,
        conversationId: input.conversationId,
      },
    })

    return { success: true, data: { success: true } }
  } catch (error) {
    console.error("[unstarMessage] Error:", error)
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
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

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const limit = input.limit || 50

    const starred = await db.starredMessage.findMany({
      where: {
        userId: authContext.userId,
        ...(input.conversationId && {
          conversationId: input.conversationId,
        }),
        message: { conversation: { schoolId } },
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
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
