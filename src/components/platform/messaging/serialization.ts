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
    console.error('[safeSerializeDate] Invalid date:', date, error)
    return new Date().toISOString()
  }
}

/**
 * Serialize a conversation participant
 */
export function serializeParticipant(participant: any) {
  if (!participant) return null

  return {
    ...participant,
    joinedAt: safeSerializeDate(participant.joinedAt),
    lastReadAt: safeSerializeDate(participant.lastReadAt),
    mutedUntil: participant.mutedUntil ? safeSerializeDate(participant.mutedUntil) : null,
    user: participant.user ? {
      ...participant.user,
    } : null,
  }
}

/**
 * Serialize a message attachment
 */
export function serializeAttachment(attachment: any) {
  if (!attachment) return null

  return {
    ...attachment,
    uploadedAt: safeSerializeDate(attachment.uploadedAt),
  }
}

/**
 * Serialize a message reaction
 */
export function serializeReaction(reaction: any) {
  if (!reaction) return null

  return {
    ...reaction,
    createdAt: safeSerializeDate(reaction.createdAt),
    user: reaction.user ? {
      ...reaction.user,
    } : null,
  }
}

/**
 * Serialize a message read receipt
 */
export function serializeReadReceipt(receipt: any) {
  if (!receipt) return null

  return {
    ...receipt,
    readAt: safeSerializeDate(receipt.readAt),
    user: receipt.user ? {
      ...receipt.user,
    } : null,
  }
}

/**
 * Serialize a reply-to message (partial message)
 */
export function serializeReplyTo(replyTo: any) {
  if (!replyTo) return null

  return {
    ...replyTo,
    createdAt: safeSerializeDate(replyTo.createdAt),
    sender: replyTo.sender ? {
      ...replyTo.sender,
    } : null,
  }
}

/**
 * Serialize a full message with all nested relations
 */
export function serializeMessage(message: any) {
  if (!message) return null

  return {
    ...message,
    createdAt: safeSerializeDate(message.createdAt),
    updatedAt: safeSerializeDate(message.updatedAt),
    editedAt: message.editedAt ? safeSerializeDate(message.editedAt) : null,
    deletedAt: message.deletedAt ? safeSerializeDate(message.deletedAt) : null,
    sender: message.sender ? {
      ...message.sender,
    } : null,
    attachments: message.attachments?.map(serializeAttachment) || [],
    reactions: message.reactions?.map(serializeReaction) || [],
    readReceipts: message.readReceipts?.map(serializeReadReceipt) || [],
    replyTo: serializeReplyTo(message.replyTo),
  }
}

/**
 * Serialize a conversation with all nested relations
 */
export function serializeConversation(conversation: any) {
  if (!conversation) return null

  return {
    ...conversation,
    createdAt: safeSerializeDate(conversation.createdAt),
    updatedAt: safeSerializeDate(conversation.updatedAt),
    lastMessageAt: conversation.lastMessageAt ? safeSerializeDate(conversation.lastMessageAt) : null,
    participants: conversation.participants?.map(serializeParticipant) || [],
    createdBy: conversation.createdBy ? {
      ...conversation.createdBy,
    } : null,
    lastMessage: conversation.lastMessage ? serializeMessage(conversation.lastMessage) : null,
  }
}

/**
 * Serialize an array of messages (bulk operation)
 */
export function serializeMessages(messages: any[]): any[] {
  return messages.map(serializeMessage)
}

/**
 * Serialize an array of conversations (bulk operation)
 */
export function serializeConversations(conversations: any[]): any[] {
  return conversations.map(serializeConversation)
}

/**
 * Serialize cursor-based pagination result
 */
export function serializeMessagesPaginated(result: {
  items: any[]
  hasMore: boolean
  nextCursor: string | null
  prevCursor: string | null
}) {
  return {
    items: serializeMessages(result.items),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
    prevCursor: result.prevCursor,
  }
}
