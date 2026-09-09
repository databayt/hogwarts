// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  ConversationDTO,
  MessageDTO,
} from "@/components/school-dashboard/messaging/types"

import type { BubbleStatus } from "./bubble-timestamp"
import type { ChatItem } from "./messages-view"

export type AdaptLabels = {
  today: string
  yesterday: string
  deleted: string
  photo: string
  video: string
  voice: string
  location: string
  document: string
  attachment: string
  userFallback: string
  groupFallback: string
}

/** Clock time inside a bubble — always 24h, matching the iOS WhatsApp bubbles. */
function bubbleTime(d: Date | string, locale: "ar" | "en"): string {
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

/** The pill above the first message of each day. */
function daySeparatorLabel(
  d: Date,
  locale: "ar" | "en",
  L: AdaptLabels
): string {
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return L.today
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return L.yesterday
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "long",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  })
}

/**
 * Read receipts are per-recipient, but the bubble shows one tick state. A
 * message anyone has read reads as read; otherwise fall back to the row's own
 * delivery status.
 */
function bubbleStatus(m: MessageDTO): BubbleStatus {
  if (m.readCount > 0 || m.status === "read") return "read"
  if (m.status === "delivered") return "delivered"
  return "sent"
}

function senderLabel(m: MessageDTO, L: AdaptLabels): string {
  return m.sender?.username || m.sender?.email || L.userFallback
}

/** Attachments have no bubble of their own yet — name them in a text bubble. */
function attachmentLabel(m: MessageDTO, L: AdaptLabels): string | null {
  const first = m.attachments?.[0]
  if (!first) return null
  const type = (first.fileType || "").toLowerCase()
  const extra =
    m.attachments.length > 1 ? ` (+${m.attachments.length - 1})` : ""
  if (type.startsWith("image/")) return `${L.photo}${extra}`
  if (type.startsWith("video/")) return `${L.video}${extra}`
  if (type.startsWith("audio/")) return `${L.voice}${extra}`
  return `${first.fileName || first.name || L.document}${extra}`
}

/** Duration lives in `metadata` when the sender recorded a voice note. */
function voiceDurationLabel(m: MessageDTO): string {
  const raw = m.metadata?.duration ?? m.metadata?.durationSeconds
  const seconds = typeof raw === "number" ? Math.round(raw) : 0
  if (!seconds) return "0:00"
  const mins = Math.floor(seconds / 60)
  return `${mins}:${String(seconds % 60).padStart(2, "0")}`
}

/**
 * Turn the conversation's messages into the flat item list `MessagesView`
 * renders: day separators inserted at each date boundary, and a bubble tail on
 * the last message of every same-sender run (the iOS WhatsApp grouping rule).
 */
export function toChatItems(
  messages: MessageDTO[],
  currentUserId: string,
  isGroup: boolean,
  locale: "ar" | "en",
  L: AdaptLabels
): ChatItem[] {
  const items: ChatItem[] = []
  let lastDay: string | null = null

  messages.forEach((m, i) => {
    const created = new Date(m.createdAt)
    const day = created.toDateString()
    if (day !== lastDay) {
      items.push({
        kind: "date",
        id: `date-${day}-${m.id}`,
        label: daySeparatorLabel(created, locale, L),
      })
      lastDay = day
    }

    const isMe = m.senderId === currentUserId
    const side = isMe ? "me" : "other"
    const time = bubbleTime(created, locale)
    const status = isMe ? bubbleStatus(m) : undefined

    // A tail closes each run: the next message is from someone else, is on a
    // later day, or there is no next message.
    const next = messages[i + 1]
    const tail =
      !next ||
      next.senderId !== m.senderId ||
      new Date(next.createdAt).toDateString() !== day

    // Only the first message of an incoming run is labelled with its sender.
    const prev = messages[i - 1]
    const startsRun =
      !prev ||
      prev.senderId !== m.senderId ||
      new Date(prev.createdAt).toDateString() !== day
    const senderName =
      isGroup && !isMe && startsRun ? senderLabel(m, L) : undefined

    const reactions = m.reactions?.length
      ? Array.from(new Set(m.reactions.map((r) => r.emoji)))
      : undefined

    if (m.isDeleted) {
      items.push({
        kind: "text",
        id: m.id,
        side,
        text: L.deleted,
        time,
        status,
        senderName,
        tail,
      })
      return
    }

    if (m.contentType === "voice" || m.contentType === "audio") {
      items.push({
        kind: "voice",
        id: m.id,
        side,
        avatarUrl: m.sender?.image ?? null,
        avatarFallback: senderLabel(m, L).charAt(0).toUpperCase(),
        durationLabel: voiceDurationLabel(m),
        time,
        status,
      })
      return
    }

    if (m.contentType === "location") {
      items.push({ kind: "location", id: m.id, side, time, status })
      return
    }

    if (m.replyTo) {
      items.push({
        kind: "reply",
        id: m.id,
        side,
        text: m.content,
        time,
        status,
        replySenderName:
          m.replyTo.sender?.username ||
          m.replyTo.sender?.email ||
          L.userFallback,
        replyText: m.replyTo.isDeleted ? L.deleted : m.replyTo.content,
      })
      return
    }

    const attachment = attachmentLabel(m, L)
    const text = m.content?.trim() ? m.content : (attachment ?? L.attachment)

    items.push({
      kind: "text",
      id: m.id,
      side,
      // An attachment with a caption shows both, the caption below the label.
      text:
        attachment && m.content?.trim() ? `${attachment}\n${m.content}` : text,
      time,
      status,
      senderName,
      tail,
      reactions,
    })
  })

  return items
}

/** The name shown in the conversation header — same rules as the chat list. */
export function conversationTitle(
  c: ConversationDTO,
  currentUserId: string,
  L: AdaptLabels
): string {
  if (c.title) return c.title
  if (c.type === "direct") {
    const other = c.participants?.find((p) => p.userId !== currentUserId)
    return (
      other?.nickname ||
      other?.user.username ||
      other?.user.email ||
      L.userFallback
    )
  }
  return L.groupFallback
}

export function conversationAvatar(
  c: ConversationDTO,
  currentUserId: string
): string | null {
  if (c.avatar) return c.avatar
  if (c.type === "direct") {
    const other = c.participants?.find((p) => p.userId !== currentUserId)
    return other?.user.image ?? null
  }
  return null
}
