// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { bubbleTime, daySeparatorLabel } from "./adapt"
import type { BubbleStatus } from "./bubble-timestamp"
import type { ChatItem } from "./messages-view"

/** A plain text message from any transport (LiveKit, a saved log, …). */
export type ThreadMessage = {
  id: string
  senderId: string
  senderName?: string
  text: string
  at: Date | number | string
  status?: BubbleStatus
}

/**
 * The iOS WhatsApp grouping rule for any text-only source: a date pill at each
 * day boundary, a tail on the last message of every same-sender run, and the
 * sender's name on the first message of an incoming run (groups only).
 * `toChatItems` in adapt.ts is the DTO-rich version of the same rule.
 */
export function toThreadItems(
  messages: ThreadMessage[],
  selfId: string,
  opts: {
    locale: "ar" | "en"
    labels: { today: string; yesterday: string }
    showSenderNames?: boolean
  }
): ChatItem[] {
  const items: ChatItem[] = []
  let lastDay: string | null = null
  const dayOf = (m: ThreadMessage) => new Date(m.at).toDateString()

  messages.forEach((m, i) => {
    const at = new Date(m.at)
    const day = at.toDateString()
    if (day !== lastDay) {
      items.push({
        kind: "date",
        id: `date-${day}-${m.id}`,
        label: daySeparatorLabel(at, opts.locale, opts.labels),
      })
      lastDay = day
    }
    const isMe = m.senderId === selfId
    const next = messages[i + 1]
    const prev = messages[i - 1]
    const tail = !next || next.senderId !== m.senderId || dayOf(next) !== day
    const startsRun =
      !prev || prev.senderId !== m.senderId || dayOf(prev) !== day
    items.push({
      kind: "text",
      id: m.id,
      side: isMe ? "me" : "other",
      text: m.text,
      time: bubbleTime(at),
      status: isMe ? (m.status ?? "sent") : undefined,
      senderName:
        opts.showSenderNames !== false && !isMe && startsRun
          ? m.senderName
          : undefined,
      tail,
    })
  })
  return items
}
