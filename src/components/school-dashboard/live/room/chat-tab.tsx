"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useMemo } from "react"

import { cn } from "@/lib/utils"
import {
  ChatWallpaper,
  EncryptionNotice,
  InputBar,
  JumpToBottomButton,
  OlderSpinner,
  renderChatItem,
  toThreadItems,
  useStickToBottom,
} from "@/components/school-dashboard/messaging/mobile"

import type { RoomLabels } from "./labels"
import type { LiveChat } from "./use-live-chat"

interface ChatTabProps {
  chat: LiveChat
  selfId: string
  locale: "ar" | "en"
  labels: RoomLabels
  /** False while another tab is showing — the tab stays mounted, hidden. */
  active: boolean
}

/**
 * The room chat IS the /messages WhatsApp thread, in its dark theme: the
 * doodle wallpaper, the notice card at the head, the same bubbles, tails,
 * ticks, day pills, composer and scroll rules (opens at the newest, never
 * yanks a reader out of the history, jump button with a count). The panel's
 * `dark` scope picks the WhatsApp dark tokens.
 *
 * Kept mounted across tab switches (hidden, not unmounted), so the scroll
 * position and a half-typed message survive a look at the poll.
 */
export const ChatTab = memo(function ChatTab({
  chat,
  selfId,
  locale,
  labels,
  active,
}: ChatTabProps) {
  const { messages, send, retry, hasMore, loadOlder } = chat

  const items = useMemo(
    () =>
      toThreadItems(messages, selfId, {
        locale,
        labels: { today: labels.chatToday, yesterday: labels.chatYesterday },
      }),
    [messages, selfId, locale, labels.chatToday, labels.chatYesterday]
  )

  const {
    scrollRef,
    contentRef,
    handleScroll,
    showJump,
    unseen,
    jumpToBottom,
    loadingOlder,
  } = useStickToBottom({ items, hasMore, onLoadMore: loadOlder, active })

  const statusLabels = useMemo(
    () => ({
      sending: labels.chatSending,
      sent: labels.chatSent,
      failed: labels.chatFailed,
    }),
    [labels.chatSending, labels.chatSent, labels.chatFailed]
  )

  const rows = useMemo(
    () =>
      items.map((item) =>
        renderChatItem(item, {
          statusLabels,
          notSentLabel: labels.chatNotSent,
          onRetry: retry,
        })
      ),
    [items, statusLabels, labels.chatNotSent, retry]
  )

  const composerLabels = useMemo(() => ({ send: labels.send }), [labels.send])

  // The notice card follows the opening date pill, as in the /messages thread.
  const noticeIndex = items[0]?.kind === "date" ? 1 : 0

  return (
    <div className={cn("flex h-full flex-col", !active && "hidden")}>
      <ChatWallpaper className="min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain pt-[8px] pb-[8px] [-webkit-overflow-scrolling:touch]"
        >
          <div ref={contentRef}>
            {loadingOlder && hasMore && (
              <OlderSpinner label={labels.chatLoadingOlder} />
            )}
            {rows.slice(0, noticeIndex)}
            {/* The head of the thread: who can read it, in WhatsApp's notice
                card. Waits until no older page is left, like the original. */}
            {!hasMore && <EncryptionNotice text={labels.chatNotice} />}
            {rows.slice(noticeIndex)}
          </div>
        </div>
        {showJump && (
          <JumpToBottomButton
            unseen={unseen}
            onClick={jumpToBottom}
            label={labels.chatJumpLatest}
          />
        )}
      </ChatWallpaper>
      <InputBar
        textOnly
        maxLength={1000}
        onSend={send}
        placeholder={labels.messagePlaceholder}
        labels={composerLabels}
      />
    </div>
  )
})
