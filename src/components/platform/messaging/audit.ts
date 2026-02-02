/**
 * Messaging Audit Logging
 *
 * Provides audit trail for messaging operations including:
 * - Message creation, editing, and deletion
 * - Participant management
 * - Conversation archiving
 * - Attachment uploads
 *
 * Uses the existing AuditLog model with:
 * - action: Event type (e.g., "message.created")
 * - reason: JSON-stringified metadata for the event
 */

"use server"

import { db } from "@/lib/db"

/**
 * Messaging audit event types
 */
export enum MessagingAuditEvent {
  // Message events
  MESSAGE_CREATED = "message.created",
  MESSAGE_EDITED = "message.edited",
  MESSAGE_DELETED = "message.deleted",

  // Participant events
  PARTICIPANT_ADDED = "participant.added",
  PARTICIPANT_REMOVED = "participant.removed",
  PARTICIPANT_ROLE_CHANGED = "participant.role_changed",

  // Conversation events
  CONVERSATION_CREATED = "conversation.created",
  CONVERSATION_ARCHIVED = "conversation.archived",
  CONVERSATION_UNARCHIVED = "conversation.unarchived",
  CONVERSATION_MUTED = "conversation.muted",
  CONVERSATION_UNMUTED = "conversation.unmuted",

  // Attachment events
  ATTACHMENT_UPLOADED = "attachment.uploaded",
  ATTACHMENT_DELETED = "attachment.deleted",
}

/**
 * Base audit entry structure
 */
interface BaseAuditEntry {
  schoolId: string
  userId: string
  ip?: string
  userAgent?: string
}

/**
 * Message audit metadata
 */
interface MessageAuditMetadata {
  conversationId: string
  messageId?: string
  contentPreview?: string
  contentLength?: number
  replyToId?: string
  hasAttachments?: boolean
}

/**
 * Participant audit metadata
 */
interface ParticipantAuditMetadata {
  conversationId: string
  targetUserId: string
  previousRole?: string
  newRole?: string
  [key: string]: unknown
}

/**
 * Conversation audit metadata
 */
interface ConversationAuditMetadata {
  conversationId: string
  conversationType?: string
  title?: string
  participantCount?: number
  [key: string]: unknown
}

/**
 * Attachment audit metadata
 */
interface AttachmentAuditMetadata {
  conversationId: string
  messageId?: string
  attachmentId?: string
  fileName?: string
  fileType?: string
  fileSize?: number
  [key: string]: unknown
}

/**
 * Create an audit log entry for messaging events
 */
async function createMessagingAuditLog(
  event: MessagingAuditEvent,
  entry: BaseAuditEntry,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: event,
        userId: entry.userId,
        schoolId: entry.schoolId,
        reason: JSON.stringify(metadata),
        ip: entry.ip,
        userAgent: entry.userAgent,
      },
    })
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("[MessagingAudit] Failed to create audit log:", error)
  }
}

// =============================================================================
// Message Audit Functions
// =============================================================================

/**
 * Log message creation
 */
export async function logMessageCreated(
  entry: BaseAuditEntry,
  metadata: MessageAuditMetadata
): Promise<void> {
  await createMessagingAuditLog(MessagingAuditEvent.MESSAGE_CREATED, entry, {
    ...metadata,
    // Truncate content preview for privacy
    contentPreview: metadata.contentPreview?.slice(0, 50),
  })
}

/**
 * Log message edit
 */
export async function logMessageEdited(
  entry: BaseAuditEntry,
  metadata: MessageAuditMetadata & { previousContentLength?: number }
): Promise<void> {
  await createMessagingAuditLog(MessagingAuditEvent.MESSAGE_EDITED, entry, {
    ...metadata,
    contentPreview: metadata.contentPreview?.slice(0, 50),
  })
}

/**
 * Log message deletion
 */
export async function logMessageDeleted(
  entry: BaseAuditEntry,
  metadata: Pick<MessageAuditMetadata, "conversationId" | "messageId">
): Promise<void> {
  await createMessagingAuditLog(
    MessagingAuditEvent.MESSAGE_DELETED,
    entry,
    metadata
  )
}

// =============================================================================
// Participant Audit Functions
// =============================================================================

/**
 * Log participant added to conversation
 */
export async function logParticipantAdded(
  entry: BaseAuditEntry,
  metadata: ParticipantAuditMetadata
): Promise<void> {
  await createMessagingAuditLog(
    MessagingAuditEvent.PARTICIPANT_ADDED,
    entry,
    metadata
  )
}

/**
 * Log participant removed from conversation
 */
export async function logParticipantRemoved(
  entry: BaseAuditEntry,
  metadata: ParticipantAuditMetadata
): Promise<void> {
  await createMessagingAuditLog(
    MessagingAuditEvent.PARTICIPANT_REMOVED,
    entry,
    metadata
  )
}

/**
 * Log participant role change
 */
export async function logParticipantRoleChanged(
  entry: BaseAuditEntry,
  metadata: ParticipantAuditMetadata
): Promise<void> {
  await createMessagingAuditLog(
    MessagingAuditEvent.PARTICIPANT_ROLE_CHANGED,
    entry,
    metadata
  )
}

// =============================================================================
// Conversation Audit Functions
// =============================================================================

/**
 * Log conversation creation
 */
export async function logConversationCreated(
  entry: BaseAuditEntry,
  metadata: ConversationAuditMetadata
): Promise<void> {
  await createMessagingAuditLog(
    MessagingAuditEvent.CONVERSATION_CREATED,
    entry,
    metadata
  )
}

/**
 * Log conversation archived
 */
export async function logConversationArchived(
  entry: BaseAuditEntry,
  metadata: Pick<ConversationAuditMetadata, "conversationId" | "title">
): Promise<void> {
  await createMessagingAuditLog(
    MessagingAuditEvent.CONVERSATION_ARCHIVED,
    entry,
    metadata
  )
}

/**
 * Log conversation unarchived
 */
export async function logConversationUnarchived(
  entry: BaseAuditEntry,
  metadata: Pick<ConversationAuditMetadata, "conversationId" | "title">
): Promise<void> {
  await createMessagingAuditLog(
    MessagingAuditEvent.CONVERSATION_UNARCHIVED,
    entry,
    metadata
  )
}

// =============================================================================
// Attachment Audit Functions
// =============================================================================

/**
 * Log attachment upload
 */
export async function logAttachmentUploaded(
  entry: BaseAuditEntry,
  metadata: AttachmentAuditMetadata
): Promise<void> {
  await createMessagingAuditLog(
    MessagingAuditEvent.ATTACHMENT_UPLOADED,
    entry,
    metadata
  )
}

/**
 * Log attachment deletion
 */
export async function logAttachmentDeleted(
  entry: BaseAuditEntry,
  metadata: Pick<
    AttachmentAuditMetadata,
    "conversationId" | "messageId" | "attachmentId"
  >
): Promise<void> {
  await createMessagingAuditLog(
    MessagingAuditEvent.ATTACHMENT_DELETED,
    entry,
    metadata
  )
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Get audit history for a conversation
 */
export async function getConversationAuditHistory(
  schoolId: string,
  conversationId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<
  Array<{
    id: string
    action: string
    userId: string
    reason: string | null
    createdAt: Date
  }>
> {
  try {
    const logs = await db.auditLog.findMany({
      where: {
        schoolId,
        action: {
          startsWith: "message.",
        },
        reason: {
          contains: conversationId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
      select: {
        id: true,
        action: true,
        userId: true,
        reason: true,
        createdAt: true,
      },
    })

    return logs
  } catch (error) {
    console.error("[MessagingAudit] Failed to get audit history:", error)
    return []
  }
}

/**
 * Get audit history for a specific user's messaging activity
 */
export async function getUserMessagingAuditHistory(
  schoolId: string,
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<
  Array<{
    id: string
    action: string
    reason: string | null
    createdAt: Date
  }>
> {
  try {
    const logs = await db.auditLog.findMany({
      where: {
        schoolId,
        userId,
        action: {
          in: Object.values(MessagingAuditEvent),
        },
      },
      orderBy: { createdAt: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
      select: {
        id: true,
        action: true,
        reason: true,
        createdAt: true,
      },
    })

    return logs
  } catch (error) {
    console.error("[MessagingAudit] Failed to get user audit history:", error)
    return []
  }
}
