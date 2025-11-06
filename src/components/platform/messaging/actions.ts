"use server"

import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"
import { checkMessageSendRateLimit, createRateLimitErrorMessage } from "@/lib/rate-limit"
import {
  createConversationSchema,
  updateConversationSchema,
  archiveConversationSchema,
  createMessageSchema,
  updateMessageSchema,
  deleteMessageSchema,
  markMessageAsReadSchema,
  markConversationAsReadSchema,
  addParticipantSchema,
  removeParticipantSchema,
  updateParticipantSchema,
  addReactionSchema,
  removeReactionSchema,
  pinMessageSchema,
  unpinMessageSchema,
  createConversationInviteSchema,
  respondToInviteSchema,
  saveDraftSchema,
  deleteDraftSchema,
  muteConversationSchema,
  unmuteConversationSchema,
} from "./validation"
import {
  getAuthContext,
  assertMessagingPermission,
  validateConversationType,
  canSendMessage,
  canManageParticipants,
} from "./authorization"
import {
  getConversationParticipant,
  isConversationParticipant,
  getConversation,
  getMessage,
} from "./queries"
import { MESSAGES_PATH, DEFAULT_SETTINGS } from "./config"

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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = createConversationSchema.parse(input)

    // Validate user can create this conversation type
    validateConversationType(authContext, parsed.type)

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

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversations-${schoolId}`)
    revalidateTag(`conversations-${authContext.userId}`)

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
      error: error instanceof Error ? error.message : "Failed to create conversation",
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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = updateConversationSchema.parse(input)

    // Get conversation
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )
    if (!conversation) {
      return { success: false, error: "Conversation not found" }
    }

    // Get user's participant role
    const participant = await getConversationParticipant(
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
    revalidateTag(`conversations-${schoolId}`)
    revalidateTag(`conversation-${parsed.conversationId}`)

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
      error: error instanceof Error ? error.message : "Failed to update conversation",
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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = archiveConversationSchema.parse(input)

    // Verify user is participant
    const isParticipant = await isConversationParticipant(
      parsed.conversationId,
      authContext.userId
    )
    if (!isParticipant) {
      return { success: false, error: "Not a participant in this conversation" }
    }

    // Archive the conversation itself
    await db.conversation.update({
      where: { id: parsed.conversationId },
      data: {
        isArchived: true,
      },
    })

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversations-${schoolId}`)
    revalidateTag(`conversation-${parsed.conversationId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[archiveConversation] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive conversation",
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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
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
        error: createRateLimitErrorMessage(rateLimitResult)
      }
    }

    // Get conversation
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )
    if (!conversation) {
      return { success: false, error: "Conversation not found" }
    }

    // Get user's participant role
    const participant = await getConversationParticipant(
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
        metadata: (parsed.metadata as any) || null,
        status: "sent",
      },
    })

    // Update conversation's lastMessageAt
    await db.conversation.update({
      where: { id: parsed.conversationId },
      data: { lastMessageAt: new Date() },
    })

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`messages-${parsed.conversationId}`)
    revalidateTag(`conversation-${parsed.conversationId}`)

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
      return { success: false, error: "Conversation ID is required" }
    }

    if (!content || !content.trim()) {
      return { success: false, error: "Message content is required" }
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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = updateMessageSchema.parse(input)

    // Get message
    const message = await getMessage(schoolId, parsed.messageId)
    if (!message) {
      return { success: false, error: "Message not found" }
    }

    // Check permission (can only edit own messages)
    if (message.senderId !== authContext.userId) {
      return { success: false, error: "Can only edit your own messages" }
    }

    // Check edit window
    const now = new Date()
    const messageAge = now.getTime() - new Date(message.createdAt).getTime()
    if (messageAge > DEFAULT_SETTINGS.messageEditWindow) {
      return { success: false, error: "Message edit window has expired" }
    }

    // Update message
    await db.message.update({
      where: { id: parsed.messageId },
      data: {
        content: parsed.content,
        metadata: (parsed.metadata as any) || undefined,
        isEdited: true,
        editedAt: new Date(),
      },
    })

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`messages-${message.conversationId}`)
    revalidateTag(`message-${parsed.messageId}`)

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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = deleteMessageSchema.parse(input)

    // Get message
    const message = await getMessage(schoolId, parsed.messageId)
    if (!message) {
      return { success: false, error: "Message not found" }
    }

    // Get user's participant role
    const participant = await getConversationParticipant(
      message.conversationId,
      authContext.userId
    )

    // Check permission
    const canDelete =
      message.senderId === authContext.userId ||
      participant?.role === "owner" ||
      participant?.role === "admin"

    if (!canDelete) {
      return { success: false, error: "Permission denied" }
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

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`messages-${message.conversationId}`)
    revalidateTag(`message-${parsed.messageId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteMessage] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete message",
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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = markMessageAsReadSchema.parse(input)

    // Get message
    const message = await getMessage(schoolId, parsed.messageId)
    if (!message) {
      return { success: false, error: "Message not found" }
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

    revalidateTag(`message-${parsed.messageId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[markMessageAsRead] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark message as read",
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
      return { success: false, error: "Not authenticated" }
    }

    const parsed = markConversationAsReadSchema.parse(input)

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

    revalidateTag(`conversation-${parsed.conversationId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[markConversationAsRead] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to mark conversation as read",
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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = addParticipantSchema.parse(input)

    // Get conversation
    const conversation = await getConversation(
      schoolId,
      authContext.userId,
      parsed.conversationId
    )
    if (!conversation) {
      return { success: false, error: "Conversation not found" }
    }

    // Get user's participant role
    const participant = await getConversationParticipant(
      parsed.conversationId,
      authContext.userId
    )

    // Check permission
    if (!canManageParticipants(participant?.role)) {
      return { success: false, error: "Permission denied" }
    }

    // Add participant
    await db.conversationParticipant.create({
      data: {
        conversationId: parsed.conversationId,
        userId: parsed.userId,
        role: parsed.role || "member",
      },
    })

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversation-${parsed.conversationId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[addParticipant] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add participant",
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
      return { success: false, error: "Not authenticated" }
    }

    const parsed = removeParticipantSchema.parse(input)

    // Get user's participant role
    const participant = await getConversationParticipant(
      parsed.conversationId,
      authContext.userId
    )

    // Check permission (can remove others if admin/owner, or can leave yourself)
    const canRemove =
      canManageParticipants(participant?.role) ||
      parsed.userId === authContext.userId

    if (!canRemove) {
      return { success: false, error: "Permission denied" }
    }

    // Remove participant
    await db.conversationParticipant.deleteMany({
      where: {
        conversationId: parsed.conversationId,
        userId: parsed.userId,
      },
    })

    revalidatePath(MESSAGES_PATH)
    revalidateTag(`conversation-${parsed.conversationId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[removeParticipant] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove participant",
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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = addReactionSchema.parse(input)

    // Get message
    const message = await getMessage(schoolId, parsed.messageId)
    if (!message) {
      return { success: false, error: "Message not found" }
    }

    // Verify user is participant
    const isParticipant = await isConversationParticipant(
      message.conversationId,
      authContext.userId
    )
    if (!isParticipant) {
      return { success: false, error: "Not a participant in this conversation" }
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

    revalidateTag(`message-${parsed.messageId}`)

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
      return { success: false, error: "Not authenticated" }
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
      error: error instanceof Error ? error.message : "Failed to remove reaction",
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
  direction?: 'before' | 'after'
}): Promise<ActionResponse<{
  items: any[]
  hasMore: boolean
  nextCursor: string | null
  prevCursor: string | null
}>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Check if user is participant in this conversation
    const isParticipant = await isConversationParticipant(
      input.conversationId,
      authContext.userId
    )

    if (!isParticipant) {
      return { success: false, error: "Not a participant in this conversation" }
    }

    // Import the cursor-based query and serialization utility
    const { getMessagesWithCursor } = await import("./queries")
    const { serializeMessagesPaginated } = await import("./serialization")

    // Fetch messages with cursor
    const result = await getMessagesWithCursor(input.conversationId, {
      cursor: input.cursor,
      take: input.take ?? 50,
      direction: input.direction ?? 'before',
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

// Export all actions
export const messagingActions = {
  createConversation,
  updateConversation,
  archiveConversation,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  markConversationAsRead,
  addParticipant,
  removeParticipant,
  addReaction,
  removeReaction,
  loadMoreMessages,
} as const
