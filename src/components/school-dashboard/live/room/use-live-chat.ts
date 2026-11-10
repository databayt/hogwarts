"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useChat, useRoomContext } from "@livekit/components-react"
import { RoomEvent } from "livekit-client"

import {
  getRoomChat,
  recordChatMessage,
  type RoomChatMessage,
} from "@/components/school-dashboard/live/actions/chat"
import type { ThreadMessage } from "@/components/school-dashboard/messaging/mobile"

type Pending = {
  id: string
  text: string
  at: number
  status: "sending" | "failed"
  /** Set once LiveKit took it — the temp row lives until that id arrives. */
  sentId?: string
}

/**
 * The room chat's whole state, WhatsApp-style:
 *
 * - **instant send** — the bubble appears with a clock the moment Send is
 *   pressed, turns into the real (ticked) message when LiveKit echoes it, and
 *   into a red "not sent, tap to retry" bubble if the send throws;
 * - **history** — the saved conversation so far (late joiners, reloads,
 *   reconnects), merged with the live data channel and deduped by the
 *   LiveKit message id every peer shares;
 * - **unread** — others' messages that arrived while the chat was not on
 *   screen, for the tab and the discussion disc.
 *
 * Owned by the room shell, so it survives the panel closing and tab
 * switches; the chat tab itself is a pure view.
 */
export function useLiveChat({
  sessionId,
  selfId,
  enabled,
  visible,
}: {
  sessionId: string
  selfId: string
  enabled: boolean
  /** The chat tab is on screen right now. */
  visible: boolean
}) {
  const { chatMessages, send: lkSend } = useChat()
  const [history, setHistory] = useState<RoomChatMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [pending, setPending] = useState<Pending[]>([])

  // A dropped connection is a hole in the live feed: what the class said
  // while this phone was reconnecting never arrived, and nothing asked for it
  // again until a reload. Each reconnect re-reads the saved conversation.
  const room = useRoomContext()
  const [reconnects, setReconnects] = useState(0)
  useEffect(() => {
    const onReconnected = () => setReconnects((n) => n + 1)
    room.on(RoomEvent.Reconnected, onReconnected)
    return () => {
      room.off(RoomEvent.Reconnected, onReconnected)
    }
  }, [room])

  // The saved conversation, fetched beside the join — never in front of the
  // video — and again after every reconnect. A failure leaves the chat
  // live-only, as it was before.
  useEffect(() => {
    if (!enabled) return
    let live = true
    getRoomChat({ sessionId })
      .then((res) => {
        if (!live || !res?.success) return
        if (reconnects === 0) {
          setHistory(res.data.messages)
          setHasMore(res.data.hasMore)
          return
        }
        // After a reconnect: add what is new and keep the older pages the
        // reader already loaded (and their "has more" answer).
        setHistory((had) => {
          const known = new Set(had.map((m) => m.id))
          const fresh = res.data.messages.filter((m) => !known.has(m.id))
          return fresh.length === 0
            ? had
            : [...had, ...fresh].sort((a, b) => a.at - b.at)
        })
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [enabled, sessionId, reconnects])

  const historyRef = useRef(history)
  useEffect(() => {
    historyRef.current = history
  }, [history])
  const loadOlder = useCallback(async () => {
    const oldest = historyRef.current[0]
    if (!oldest) return
    const res = await getRoomChat({ sessionId, before: oldest.at }).catch(
      () => null
    )
    if (!res?.success) return
    setHistory((h) => [...res.data.messages, ...h])
    setHasMore(res.data.hasMore)
  }, [sessionId])

  const live = useMemo<ThreadMessage[]>(
    () =>
      chatMessages.map((m) => ({
        id: m.id,
        senderId: m.from?.identity ?? "",
        senderName: m.from?.name || m.from?.identity || "?",
        text: m.message,
        at: m.timestamp,
      })),
    [chatMessages]
  )

  const messages = useMemo<ThreadMessage[]>(() => {
    const byId = new Map<string, ThreadMessage>()
    for (const h of history) {
      byId.set(h.id, {
        id: h.id,
        senderId: h.identity,
        senderName: h.name || "?",
        text: h.text,
        at: h.at,
      })
    }
    for (const m of live) byId.set(m.id, m)
    const merged = [...byId.values()].sort(
      (a, b) => Number(a.at) - Number(b.at)
    )
    // Own messages still in flight sit after everything that has landed, in
    // the order they were typed — as WhatsApp keeps its clocked bubbles last.
    for (const p of pending) {
      if (p.sentId && byId.has(p.sentId)) continue
      merged.push({
        id: p.id,
        senderId: selfId,
        text: p.text,
        at: p.at,
        status: p.status,
      })
    }
    return merged
  }, [history, live, pending, selfId])

  // Temp rows whose real twin has landed are skipped by the merge above and
  // pruned on the next send — never from an effect, which would re-render
  // the whole list a second time on every message.
  const liveIdsRef = useRef(new Set<string>())
  useEffect(() => {
    liveIdsRef.current = new Set(live.map((m) => m.id))
  }, [live])

  const transmit = useCallback(
    (tempId: string, text: string) => {
      lkSend(text)
        .then((msg) => {
          setPending((ps) =>
            ps.map((p) => (p.id === tempId ? { ...p, sentId: msg.id } : p))
          )
          // The memory, after the fact — the class already has the message.
          void recordChatMessage({
            sessionId,
            messageId: msg.id,
            text,
          }).catch(() => {})
        })
        .catch(() => {
          setPending((ps) =>
            ps.map((p) => (p.id === tempId ? { ...p, status: "failed" } : p))
          )
        })
    },
    [lkSend, sessionId]
  )

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim().slice(0, 1000)
      if (!text) return
      const id = `temp-${crypto.randomUUID()}`
      setPending((ps) => [
        ...ps.filter((p) => !(p.sentId && liveIdsRef.current.has(p.sentId))),
        { id, text, at: Date.now(), status: "sending" },
      ])
      transmit(id, text)
    },
    [transmit]
  )

  const pendingRef = useRef(pending)
  useEffect(() => {
    pendingRef.current = pending
  }, [pending])
  const retry = useCallback(
    (id: string) => {
      const p = pendingRef.current.find((x) => x.id === id)
      if (!p) return
      setPending((ps) =>
        ps.map((x) => (x.id === id ? { ...x, status: "sending" } : x))
      )
      transmit(id, p.text)
    },
    [transmit]
  )

  // Unread: others' live messages that arrived while the tab was off screen.
  const othersCount = useMemo(
    () => live.reduce((n, m) => (m.senderId !== selfId ? n + 1 : n), 0),
    [live, selfId]
  )
  // Caught up whenever the chat is on screen — adjusted during render, the
  // React way to follow a prop, rather than in an effect.
  const [seen, setSeen] = useState(0)
  if (visible && seen !== othersCount) setSeen(othersCount)
  const unread = visible ? 0 : Math.max(0, othersCount - seen)

  return { messages, send, retry, unread, hasMore, loadOlder }
}

export type LiveChat = ReturnType<typeof useLiveChat>
