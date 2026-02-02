"use server"

import { NotificationChannel, NotificationType } from "@prisma/client"

import { db } from "@/lib/db"
import { createNotification } from "@/components/platform/notifications/actions"

// Maximum length for message preview in notifications
const MESSAGE_PREVIEW_LENGTH = 100

/**
 * Extract mentioned user IDs from message content
 * Supports @username and @[userId] formats
 */
export async function extractMentions(content: string): Promise<string[]> {
  const mentionPattern = /@\[([a-zA-Z0-9_-]+)\]/g
  const mentions: string[] = []
  let match

  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}

/**
 * Truncate message content for notification preview
 */
function truncateContent(
  content: string,
  maxLength: number = MESSAGE_PREVIEW_LENGTH
): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength).trim() + "..."
}

/**
 * Notify all conversation participants about a new message
 * Excludes the sender and muted participants
 */
export async function notifyNewMessage(
  schoolId: string,
  conversationId: string,
  senderId: string,
  senderName: string,
  messageContent: string,
  conversationTitle?: string
): Promise<void> {
  try {
    // Get all participants except the sender
    const participants = await db.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: senderId },
        isMuted: false, // Don't notify muted participants
      },
      select: {
        userId: true,
      },
    })

    if (participants.length === 0) return

    // Create notifications for each participant
    const notificationPromises = participants.map((participant) =>
      createNotification({
        userId: participant.userId,
        type: "message" as NotificationType,
        priority: "normal",
        title: conversationTitle || senderName,
        body: truncateContent(messageContent),
        actorId: senderId,
        channels: ["in_app", "email"] as NotificationChannel[],
        metadata: {
          conversationId,
          senderId,
          senderName,
          messagePreview: truncateContent(messageContent),
        },
      })
    )

    await Promise.allSettled(notificationPromises)
  } catch (error) {
    // Log but don't throw - notifications should not block message sending
    console.error("[notifyNewMessage] Error:", error)
  }
}

/**
 * Notify mentioned users in a message
 */
export async function notifyMentions(
  schoolId: string,
  conversationId: string,
  senderId: string,
  senderName: string,
  messageContent: string,
  mentionedUserIds: string[]
): Promise<void> {
  try {
    if (mentionedUserIds.length === 0) return

    // Filter to only participants in the conversation (can't mention non-participants)
    const validParticipants = await db.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { in: mentionedUserIds },
        isMuted: false,
      },
      select: {
        userId: true,
      },
    })

    if (validParticipants.length === 0) return

    // Create mention notifications
    const notificationPromises = validParticipants.map((participant) =>
      createNotification({
        userId: participant.userId,
        type: "message_mention" as NotificationType,
        title: `${senderName} mentioned you`,
        body: truncateContent(messageContent),
        priority: "high", // Mentions are higher priority
        actorId: senderId,
        channels: ["in_app", "email"] as NotificationChannel[],
        metadata: {
          conversationId,
          senderId,
          senderName,
          messagePreview: truncateContent(messageContent),
          isMention: true,
        },
      })
    )

    await Promise.allSettled(notificationPromises)
  } catch (error) {
    console.error("[notifyMentions] Error:", error)
  }
}

/**
 * Notify a user when they are added to a conversation
 */
export async function notifyParticipantAdded(
  schoolId: string,
  conversationId: string,
  addedUserId: string,
  addedByUserId: string,
  addedByName: string,
  conversationTitle?: string
): Promise<void> {
  try {
    await createNotification({
      userId: addedUserId,
      type: "message" as NotificationType,
      priority: "normal",
      title: "Added to conversation",
      body: conversationTitle
        ? `${addedByName} added you to "${conversationTitle}"`
        : `${addedByName} added you to a conversation`,
      actorId: addedByUserId,
      channels: ["in_app"] as NotificationChannel[],
      metadata: {
        conversationId,
        addedByUserId,
        addedByName,
        conversationTitle,
        action: "participant_added",
      },
    })
  } catch (error) {
    console.error("[notifyParticipantAdded] Error:", error)
  }
}

/**
 * Notify all participants when a new announcement is made
 * (for announcement-type conversations)
 */
export async function notifyAnnouncement(
  schoolId: string,
  conversationId: string,
  senderId: string,
  senderName: string,
  announcementTitle: string,
  announcementContent: string
): Promise<void> {
  try {
    // Get all participants except the sender
    const participants = await db.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: senderId },
      },
      select: {
        userId: true,
      },
    })

    if (participants.length === 0) return

    // Create notifications for each participant
    const notificationPromises = participants.map((participant) =>
      createNotification({
        userId: participant.userId,
        type: "announcement" as NotificationType,
        title: announcementTitle,
        body: truncateContent(announcementContent),
        priority: "high", // Announcements are high priority
        actorId: senderId,
        channels: ["in_app", "email"] as NotificationChannel[],
        metadata: {
          conversationId,
          senderId,
          senderName,
          isAnnouncement: true,
        },
      })
    )

    await Promise.allSettled(notificationPromises)
  } catch (error) {
    console.error("[notifyAnnouncement] Error:", error)
  }
}

/**
 * Check if a user has notifications enabled for a specific type
 */
export async function shouldNotifyUser(
  userId: string,
  notificationType: NotificationType,
  channel: NotificationChannel
): Promise<boolean> {
  try {
    const preference = await db.notificationPreference.findFirst({
      where: {
        userId,
        type: notificationType,
        channel,
      },
      select: {
        enabled: true,
      },
    })

    // Default to enabled if no preference is set
    return preference?.enabled ?? true
  } catch (error) {
    console.error("[shouldNotifyUser] Error:", error)
    return true // Default to notify on error
  }
}
