"use client"

import { MessageBubble, type MessageBubbleProps } from "./message-bubble"
import type { MessageDTO } from "./types"

export interface MessageGroupProps extends Omit<
  MessageBubbleProps,
  | "message"
  | "showAvatar"
  | "showSenderName"
  | "showTimestamp"
  | "isFirstInGroup"
  | "isLastInGroup"
> {
  messages: MessageDTO[]
}

/**
 * MessageGroup component groups consecutive messages from the same sender
 * following iMessage-style visual patterns:
 * - Shows sender name only on first message
 * - Shows avatar only on last message
 * - Shows timestamp only on last message
 * - Reduces vertical spacing between messages in same group
 */
export function MessageGroup({
  messages,
  currentUserId,
  locale,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
}: MessageGroupProps) {
  if (messages.length === 0) return null

  return (
    <div className="flex flex-col">
      {messages.map((message, index) => {
        const isFirst = index === 0
        const isLast = index === messages.length - 1

        return (
          <MessageBubble
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            locale={locale}
            showAvatar={isLast}
            showSenderName={isFirst}
            showTimestamp={isLast}
            isFirstInGroup={isFirst}
            isLastInGroup={isLast}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onReact={onReact}
            onRemoveReaction={onRemoveReaction}
          />
        )
      })}
    </div>
  )
}

/**
 * Groups messages by sender and time proximity
 *
 * Messages are grouped if:
 * 1. They are from the same sender
 * 2. They are less than 5 minutes apart
 * 3. They are consecutive in the message list
 *
 * @param messages Array of messages to group
 * @returns Array of message groups (each group is an array of messages)
 */
export function groupMessages(messages: MessageDTO[]): MessageDTO[][] {
  if (messages.length === 0) return []

  const groups: MessageDTO[][] = []
  let currentGroup: MessageDTO[] = []

  const TIME_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds

  messages.forEach((message, index) => {
    const prevMessage = messages[index - 1]

    // Start new group if:
    // 1. First message
    // 2. Different sender
    // 3. More than 5 minutes apart
    const shouldStartNewGroup =
      !prevMessage ||
      prevMessage.senderId !== message.senderId ||
      new Date(message.createdAt).getTime() -
        new Date(prevMessage.createdAt).getTime() >
        TIME_THRESHOLD

    if (shouldStartNewGroup) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }
      currentGroup = [message]
    } else {
      currentGroup.push(message)
    }
  })

  // Push last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}
