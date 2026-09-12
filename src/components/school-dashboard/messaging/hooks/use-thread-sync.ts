"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef } from "react"

import socketService from "@/lib/websocket/socket-service"

import { markConversationAsRead, pollNewMessages } from "../actions"
import { buildMessageFromSocket, isTempId } from "../socket-message"
import type { MessageDTO } from "../types"

/** Poll cadence while the reader is looking at the thread. */
export const ACTIVE_POLL_MS = 5_000
/** Cadence once nothing has happened in the thread for a while. */
export const IDLE_POLL_MS = 12_000
/** How long a thread stays "active" after its last event. */
const IDLE_AFTER_MS = 2 * 60_000
/** Collapses the burst of reads a quick open-and-scroll produces. */
const READ_DEBOUNCE_MS = 800

type Updater = (prev: MessageDTO[]) => MessageDTO[]

export type ThreadSyncArgs = {
  /** The open conversation, or null when the list is showing. */
  conversationId: string | null
  currentUserId: string
  /** Socket.IO state. Polling runs only while this is false. */
  isConnected: boolean
  /** Newest persisted message id in the thread — the poll cursor. */
  getCursor: (conversationId: string) => string | null
  /** Merge server rows into the thread (dedupes by id and client nonce). */
  mergeIncoming: (conversationId: string, items: MessageDTO[]) => void
  /** Transform the thread in place (edits, deletes, reactions, receipts). */
  updateMessages: (conversationId: string, updater: Updater) => void
}

/**
 * Keeps the open thread current, whichever width is showing it.
 *
 * Owns the conversation-room socket listeners, the polling fallback and
 * mark-as-read. These used to live inside the desktop `ChatInterface`, so
 * the phone's thread — a different component — only stayed live because the
 * desktop one was mounted and hidden beside it. Now the orchestrator runs
 * this once and both views are pure.
 *
 * Polling is deliberate about cost: one request in flight at a time, no
 * requests while the tab is hidden, an immediate catch-up when it comes back
 * or the network returns, and a slower cadence once the thread has been
 * quiet for a couple of minutes.
 */
export function useThreadSync({
  conversationId,
  currentUserId,
  isConnected,
  getCursor,
  mergeIncoming,
  updateMessages,
}: ThreadSyncArgs) {
  // Handlers change identity as the orchestrator re-renders; the effects
  // below read them through refs so they subscribe once per thread.
  const getCursorRef = useRef(getCursor)
  const mergeRef = useRef(mergeIncoming)
  const updateRef = useRef(updateMessages)
  useEffect(() => {
    getCursorRef.current = getCursor
    mergeRef.current = mergeIncoming
    updateRef.current = updateMessages
  })

  const lastActivityRef = useRef(Date.now())
  const openedAtRef = useRef<string>(new Date().toISOString())

  /** Something happened in the thread — poll at the fast cadence again. */
  const touch = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // --- mark as read -------------------------------------------------------
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduleRead = useCallback((id: string) => {
    if (readTimerRef.current) return
    readTimerRef.current = setTimeout(() => {
      readTimerRef.current = null
      markConversationAsRead({ conversationId: id }).catch(() => {})
    }, READ_DEBOUNCE_MS)
  }, [])

  // Opening a thread reads it; leaving cancels a read still pending.
  useEffect(() => {
    if (!conversationId) return
    openedAtRef.current = new Date().toISOString()
    lastActivityRef.current = Date.now()
    scheduleRead(conversationId)
    return () => {
      if (readTimerRef.current) {
        clearTimeout(readTimerRef.current)
        readTimerRef.current = null
      }
    }
  }, [conversationId, scheduleRead])

  // --- socket: the conversation room --------------------------------------
  useEffect(() => {
    if (!conversationId || !isConnected) return
    const id = conversationId

    socketService.subscribeToConversation(id)

    const offNew = socketService.on("message:new", (data) => {
      if (data.conversationId !== id) return
      mergeRef.current(id, [buildMessageFromSocket(data)])
      if (data.senderId !== currentUserId) {
        touch()
        if (document.visibilityState === "visible") scheduleRead(id)
      }
    })

    const offUpdated = socketService.on("message:updated", (data) => {
      updateRef.current(id, (prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? {
                ...m,
                content: data.content,
                isEdited: true,
                updatedAt: new Date(data.editedAt),
              }
            : m
        )
      )
    })

    const offDeleted = socketService.on("message:deleted", (data) => {
      updateRef.current(id, (prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, isDeleted: true, deletedAt: new Date(data.deletedAt) }
            : m
        )
      )
    })

    const offReaction = socketService.on("message:reaction", (data) => {
      updateRef.current(id, (prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m
          const existing = m.reactions.find(
            (r) => r.userId === data.userId && r.emoji === data.emoji
          )
          if (existing) {
            return {
              ...m,
              reactions: m.reactions.filter((r) => r.id !== existing.id),
            }
          }
          return {
            ...m,
            reactions: [
              ...m.reactions,
              {
                id: `${data.userId}-${data.emoji}`,
                messageId: data.messageId,
                userId: data.userId,
                user: { id: data.userId, username: null, image: null },
                emoji: data.emoji,
                createdAt: new Date(),
              },
            ],
          }
        })
      )
    })

    // The other side read the thread: every sent message of ours is read.
    const offRead = socketService.on("message:read", (data) => {
      if (data.userId === currentUserId || data.conversationId !== id) return
      updateRef.current(id, (prev) => {
        if (
          !prev.some(
            (m) =>
              m.senderId === currentUserId &&
              !isTempId(m.id) &&
              m.status !== "read"
          )
        ) {
          return prev
        }
        return prev.map((m) =>
          m.senderId === currentUserId && !isTempId(m.id) && m.status !== "read"
            ? { ...m, status: "read" as MessageDTO["status"] }
            : m
        )
      })
    })

    // A recipient was in the room when the message landed: double tick.
    const offDelivered = socketService.on("message:delivered", (data) => {
      if (data.conversationId !== id) return
      updateRef.current(id, (prev) => {
        const idx = prev.findIndex((m) => m.id === data.messageId)
        if (idx < 0 || prev[idx].status !== "sent") return prev
        const next = prev.slice()
        next[idx] = { ...prev[idx], status: "delivered" }
        return next
      })
    })

    return () => {
      offNew()
      offUpdated()
      offDeleted()
      offReaction()
      offRead()
      offDelivered()
      if (socketService.isConnected()) {
        socketService.unsubscribeFromConversation(id)
      }
    }
  }, [conversationId, isConnected, currentUserId, scheduleRead, touch])

  // --- polling fallback ---------------------------------------------------
  useEffect(() => {
    if (!conversationId || isConnected) return
    const id = conversationId
    let cancelled = false
    let inFlight = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const schedule = (delay: number) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(tick, delay)
    }

    const tick = async () => {
      if (cancelled) return
      // A hidden tab polls nothing; `wake` restarts it when it shows again.
      if (document.visibilityState === "hidden") return
      if (!inFlight) {
        inFlight = true
        try {
          const cursor = getCursorRef.current(id)
          const result = await pollNewMessages(
            cursor
              ? { conversationId: id, afterMessageId: cursor }
              : { conversationId: id, since: openedAtRef.current }
          )
          if (!cancelled && result.success && result.data.items.length > 0) {
            const items = result.data.items as MessageDTO[]
            mergeRef.current(id, items)
            if (items.some((m) => m.senderId !== currentUserId)) {
              touch()
              scheduleRead(id)
            }
          }
        } catch {
          // Best effort; the next tick tries again.
        } finally {
          inFlight = false
        }
      }
      if (cancelled) return
      const idle = Date.now() - lastActivityRef.current > IDLE_AFTER_MS
      schedule(idle ? IDLE_POLL_MS : ACTIVE_POLL_MS)
    }

    const wake = () => {
      if (document.visibilityState !== "visible") return
      schedule(0)
    }

    schedule(ACTIVE_POLL_MS)
    document.addEventListener("visibilitychange", wake)
    window.addEventListener("focus", wake)
    window.addEventListener("online", wake)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      document.removeEventListener("visibilitychange", wake)
      window.removeEventListener("focus", wake)
      window.removeEventListener("online", wake)
    }
  }, [conversationId, isConnected, currentUserId, scheduleRead, touch])

  return { touch }
}
