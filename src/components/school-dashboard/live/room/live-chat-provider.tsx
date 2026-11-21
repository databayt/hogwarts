"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useLocalParticipant } from "@livekit/components-react"

import { useLiveChat, type LiveChat } from "./use-live-chat"

/**
 * The room chat's state, held BELOW the shell instead of in it.
 *
 * `useLiveChat` re-renders its host on every chat message. Held by
 * `RoomShell`, that re-rendered the stage, the control bar and everything else
 * the shell draws for each message. Here the state lives in a provider that
 * wraps the shell's content as a prop, so a message re-renders the provider and
 * the few components that READ it — the chat tab (the whole object) and the
 * discussion badge (one number) — and nothing else.
 *
 * Three contexts, so each reader subscribes to as little as it needs:
 * - `LiveChatContext` — the whole chat (messages, send, retry, …): the chat tab.
 * - `ChatUnreadContext` — the unread count: the control bar's discussion disc.
 * - `ChatVisibleContext` — the setter the shell calls when the chat tab goes on
 *   or off screen (it was `useLiveChat`'s `visible` argument). Stable.
 */
const LiveChatContext = createContext<LiveChat | null>(null)
const ChatUnreadContext = createContext(0)
const ChatVisibleContext = createContext<(visible: boolean) => void>(() => {})

export function LiveChatProvider({
  sessionId,
  enabled,
  children,
}: {
  sessionId: string
  /** The school's Chat tool. Off: nothing is fetched and no badge counts. */
  enabled: boolean
  children: ReactNode
}) {
  const { localParticipant } = useLocalParticipant()
  // Whether the chat tab is on screen right now — set by the shell.
  const [visible, setVisible] = useState(false)
  const raw = useLiveChat({
    sessionId,
    selfId: localParticipant.identity,
    enabled,
    visible,
  })
  // `useLiveChat` returns a fresh object each render; hold one until a field
  // actually changes, so the chat tab is not re-rendered by unrelated renders.
  const { messages, send, retry, unread, hasMore, loadOlder } = raw
  const chat = useMemo<LiveChat>(
    () => ({ messages, send, retry, unread, hasMore, loadOlder }),
    [messages, send, retry, unread, hasMore, loadOlder]
  )

  return (
    <ChatVisibleContext value={setVisible}>
      {/* With the Chat tool off the badge never counted anything. */}
      <ChatUnreadContext value={enabled ? unread : 0}>
        <LiveChatContext value={chat}>{children}</LiveChatContext>
      </ChatUnreadContext>
    </ChatVisibleContext>
  )
}

/** The whole chat — for the chat tab only; it changes on every message. */
export function useLiveChatState(): LiveChat {
  const chat = useContext(LiveChatContext)
  if (!chat) throw new Error("useLiveChatState needs a <LiveChatProvider>")
  return chat
}

/** Others' unread messages, for the discussion badge. */
export function useChatUnread(): number {
  return useContext(ChatUnreadContext)
}

/** Tell the chat whether its tab is on screen (stable). */
export function useSetChatVisible(): (visible: boolean) => void {
  return useContext(ChatVisibleContext)
}
