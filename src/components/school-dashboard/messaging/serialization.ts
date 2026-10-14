// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Messaging Data Serialization Utilities
 *
 * Centralized utilities for serializing database models to client-safe DTOs.
 * Handles Date → ISO string conversion to prevent Next.js server component errors.
 *
 * **Why this is needed:**
 * - Next.js serializes props between server and client components
 * - Date objects can't be serialized directly
 * - Manual serialization is error-prone and repetitive
 *
 * **Performance benefits:**
 * - Single source of truth for serialization logic
 * - Type-safe with full IntelliSense support
 * - Prevents runtime serialization errors
 */

import {
  displayName,
  NAME_DISPLAY_DEFAULT,
  type NameDisplay,
} from "@/lib/name-utils"

/**
 * Safely serialize a date to ISO string
 * @param date - Date object, null, or undefined
 * @returns ISO string representation
 */
export function safeSerializeDate(date: Date | null | undefined): string {
  if (!date) return new Date().toISOString()
  try {
    return new Date(date).toISOString()
  } catch (error) {
    console.error("[safeSerializeDate] Invalid date:", date, error)
    return new Date().toISOString()
  }
}

/**
 * Resolve a user's label: their profile name in the school's short display
 * (first + second or first + last) when present, else the username.
 */
function resolveProfileName(
  user: any,
  nameDisplay: NameDisplay = NAME_DISPLAY_DEFAULT
): string | null {
  if (!user) return null
  const profile =
    user.student || user.teacher || user.guardian || user.staffMember
  if (profile?.firstName) {
    return displayName(profile, nameDisplay)
  }
  return user.username ?? null
}

/**
 * Serialize a conversation participant
 */
export function serializeParticipant(
  participant: any,
  nameDisplay: NameDisplay = NAME_DISPLAY_DEFAULT
) {
  if (!participant) return null

  return {
    ...participant,
    createdAt: safeSerializeDate(participant.createdAt),
    lastReadAt: safeSerializeDate(participant.lastReadAt),
    user: participant.user
      ? {
          ...participant.user,
          username: resolveProfileName(participant.user, nameDisplay),
        }
      : null,
  }
}

/**
 * Serialize a message attachment
 */
export function serializeAttachment(attachment: any) {
  if (!attachment) return null

  return {
    ...attachment,
    // Alias DB field names to DTO-expected names
    url: attachment.fileUrl ?? attachment.url,
    name: attachment.fileName ?? attachment.name,
    size: attachment.fileSize ?? attachment.size,
    uploadedAt: safeSerializeDate(attachment.uploadedAt),
  }
}

/**
 * Serialize a message reaction
 */
export function serializeReaction(
  reaction: any,
  nameDisplay: NameDisplay = NAME_DISPLAY_DEFAULT
) {
  if (!reaction) return null

  return {
    ...reaction,
    createdAt: safeSerializeDate(reaction.createdAt),
    user: reaction.user
      ? {
          ...reaction.user,
          username: resolveProfileName(reaction.user, nameDisplay),
        }
      : null,
  }
}

/**
 * Serialize a message read receipt
 */
export function serializeReadReceipt(
  receipt: any,
  nameDisplay: NameDisplay = NAME_DISPLAY_DEFAULT
) {
  if (!receipt) return null

  return {
    ...receipt,
    readAt: safeSerializeDate(receipt.readAt),
    user: receipt.user
      ? {
          ...receipt.user,
          username: resolveProfileName(receipt.user, nameDisplay),
        }
      : null,
  }
}

/**
 * Serialize a reply-to message (partial message)
 */
export function serializeReplyTo(
  replyTo: any,
  nameDisplay: NameDisplay = NAME_DISPLAY_DEFAULT
) {
  if (!replyTo) return null

  return {
    ...replyTo,
    createdAt: safeSerializeDate(replyTo.createdAt),
    sender: replyTo.sender
      ? {
          ...replyTo.sender,
          username: resolveProfileName(replyTo.sender, nameDisplay),
        }
      : null,
  }
}

/**
 * Serialize a full message with all nested relations
 */
export function serializeMessage(
  message: any,
  nameDisplay: NameDisplay = NAME_DISPLAY_DEFAULT
) {
  if (!message) return null

  return {
    ...message,
    createdAt: safeSerializeDate(message.createdAt),
    updatedAt: safeSerializeDate(message.updatedAt),
    editedAt: message.editedAt ? safeSerializeDate(message.editedAt) : null,
    deletedAt: message.deletedAt ? safeSerializeDate(message.deletedAt) : null,
    sender: message.sender
      ? {
          ...message.sender,
          username: resolveProfileName(message.sender, nameDisplay),
        }
      : null,
    attachments: message.attachments?.map(serializeAttachment) || [],
    reactions:
      message.reactions?.map((r: any) => serializeReaction(r, nameDisplay)) ||
      [],
    readReceipts:
      message.readReceipts?.map((r: any) =>
        serializeReadReceipt(r, nameDisplay)
      ) || [],
    // readCount comes from the eager _count; falls back to the array length
    // when a caller selected full receipts instead of the count.
    readCount:
      message._count?.readReceipts ?? message.readReceipts?.length ?? 0,
    replyTo: serializeReplyTo(message.replyTo, nameDisplay),
  }
}

/**
 * Serialize a conversation with all nested relations
 */
export function serializeConversation(
  conversation: any,
  nameDisplay: NameDisplay = NAME_DISPLAY_DEFAULT
) {
  if (!conversation) return null

  return {
    ...conversation,
    createdAt: safeSerializeDate(conversation.createdAt),
    updatedAt: safeSerializeDate(conversation.updatedAt),
    lastMessageAt: conversation.lastMessageAt
      ? safeSerializeDate(conversation.lastMessageAt)
      : null,
    participants:
      conversation.participants?.map((p: any) =>
        serializeParticipant(p, nameDisplay)
      ) || [],
    createdBy: conversation.createdBy
      ? {
          ...conversation.createdBy,
          username: resolveProfileName(conversation.createdBy, nameDisplay),
        }
      : null,
    lastMessage: conversation.lastMessage
      ? serializeMessage(conversation.lastMessage, nameDisplay)
      : conversation.messages?.[0]
        ? serializeMessage(conversation.messages[0], nameDisplay)
        : null,
  }
}

/**
 * Serialize an array of messages (bulk operation)
 */
export function serializeMessages(
  messages: any[],
  nameDisplay: NameDisplay = NAME_DISPLAY_DEFAULT
): any[] {
  return messages.map((m) => serializeMessage(m, nameDisplay))
}

/**
 * Serialize an array of conversations (bulk operation)
 */
export function serializeConversations(
  conversations: any[],
  nameDisplay: NameDisplay = NAME_DISPLAY_DEFAULT
): any[] {
  return conversations.map((c) => serializeConversation(c, nameDisplay))
}

/**
 * Serialize cursor-based pagination result
 */
export function serializeMessagesPaginated(
  result: {
    items: any[]
    hasMore: boolean
    nextCursor: string | null
    prevCursor: string | null
  },
  nameDisplay: NameDisplay = NAME_DISPLAY_DEFAULT
) {
  return {
    items: serializeMessages(result.items, nameDisplay),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
    prevCursor: result.prevCursor,
  }
}
