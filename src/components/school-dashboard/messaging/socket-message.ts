// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { MessageAttachmentDTO, MessageDTO } from "./types"

/** The `message:new` payload the socket server relays. */
export type SocketMessagePayload = {
  id: string
  conversationId: string
  senderId: string
  content: string
  contentType: string
  createdAt: string
  metadata?: Record<string, unknown> | null
  sender?: {
    id: string
    username: string | null
    email: string | null
    image: string | null
  }
  replyToId?: string | null
  attachments?: Array<{
    id: string
    url: string
    fileName: string
    fileSize: number
    fileType: string
    thumbnail?: string | null
  }>
}

/**
 * Build a MessageDTO from Socket.IO event data. Lives on its own so the
 * thread-sync hook and the views can share it without importing the client
 * orchestrator (which imports them — a cycle).
 */
export function buildMessageFromSocket(data: SocketMessagePayload): MessageDTO {
  return {
    id: data.id,
    conversationId: data.conversationId,
    senderId: data.senderId,
    sender: data.sender ?? {
      id: data.senderId,
      username: null,
      email: null,
      image: null,
    },
    content: data.content,
    contentType: (data.contentType || "text") as MessageDTO["contentType"],
    status: "sent",
    replyToId: data.replyToId ?? null,
    replyTo: null,
    forwardedFromId: null,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    isSystem: false,
    metadata: data.metadata ?? null,
    whatsappStatus: null,
    whatsappPhone: null,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.createdAt),
    attachments: (data.attachments ?? []).map(
      (a) =>
        ({
          id: a.id,
          messageId: data.id,
          url: a.url,
          fileUrl: a.url,
          name: a.fileName,
          fileName: a.fileName,
          size: a.fileSize,
          fileSize: a.fileSize,
          fileType: a.fileType,
          thumbnail: a.thumbnail ?? null,
          uploadedAt: new Date(data.createdAt),
        }) as MessageAttachmentDTO
    ),
    reactions: [],
    readReceipts: [],
    readCount: 0,
  }
}

/** Optimistic messages carry this prefix until the server assigns an id. */
export const TEMP_ID_PREFIX = "temp-"

export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX)
}

export function tempIdFor(nonce: string): string {
  return `${TEMP_ID_PREFIX}${nonce}`
}

export function nonceOf(tempId: string): string {
  return tempId.slice(TEMP_ID_PREFIX.length)
}

/**
 * Merge rows that arrived from the server (a poll page, a socket event, a
 * send response) into a thread. Dedupes by id, and swaps an optimistic row
 * for its persisted twin when the metadata carries the client nonce — so a
 * message the poller delivers before the send response does cannot appear
 * twice, once as `temp-…` and once as itself.
 *
 * Returns the same array when nothing changed, so callers can skip a render.
 */
export function mergeServerMessages(
  prev: MessageDTO[],
  incoming: MessageDTO[]
): MessageDTO[] {
  if (incoming.length === 0) return prev
  const ids = new Set(prev.map((m) => m.id))
  const tempByNonce = new Map<string, string>()
  for (const m of prev) {
    if (isTempId(m.id)) tempByNonce.set(nonceOf(m.id), m.id)
  }
  let next = prev
  let changed = false
  for (const item of incoming) {
    if (ids.has(item.id)) continue
    const nonce = (item.metadata as Record<string, unknown> | null)
      ?.clientNonce as string | undefined
    const tempId = nonce ? tempByNonce.get(nonce) : undefined
    if (tempId) {
      next = next.map((m) => (m.id === tempId ? item : m))
      tempByNonce.delete(nonce!)
    } else {
      next = [...next, item]
    }
    ids.add(item.id)
    changed = true
  }
  return changed ? next : prev
}
