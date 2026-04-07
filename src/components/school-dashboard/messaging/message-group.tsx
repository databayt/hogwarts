"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo } from "react"

import { MessageBubble, type MessageBubbleProps } from "./message-bubble"
import type { ConversationType, MessageDTO } from "./types"

export interface MessageGroupProps extends Omit<
  MessageBubbleProps,
  | "message"
  | "showAvatar"
  | "showSenderName"
  | "showTimestamp"
  | "showTail"
  | "isFirstInGroup"
  | "isLastInGroup"
> {
  messages: MessageDTO[]
  conversationType?: ConversationType
}

/**
 * MessageGroup — WhatsApp-style consecutive message grouping:
 * - Tail on FIRST message in group
 * - Avatar on FIRST message (group chats only, not direct)
 * - Sender name on FIRST, timestamp on LAST
 * - Tight vertical spacing within group
 */
export const MessageGroup = memo(function MessageGroup({
  messages,
  currentUserId,
  locale,
  conversationType,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  onRetry,
}: MessageGroupProps) {
  if (messages.length === 0) return null

  const isGroupChat = conversationType !== "direct"

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
            showAvatar={isGroupChat}
            showSenderName={isGroupChat && isFirst}
            showTimestamp={isLast}
            showTail={isFirst}
            isFirstInGroup={isFirst}
            isLastInGroup={isLast}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onReact={onReact}
            onRemoveReaction={onRemoveReaction}
            onRetry={onRetry}
          />
        )
      })}
    </div>
  )
})

/**
 * Groups messages by sender and time proximity (5 minutes)
 */
export function groupMessages(messages: MessageDTO[]): MessageDTO[][] {
  if (messages.length === 0) return []

  const groups: MessageDTO[][] = []
  let currentGroup: MessageDTO[] = []

  const TIME_THRESHOLD = 5 * 60 * 1000

  messages.forEach((message, index) => {
    const prevMessage = messages[index - 1]

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

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}
