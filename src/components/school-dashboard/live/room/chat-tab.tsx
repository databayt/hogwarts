"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useMemo } from "react"

import { cn } from "@/lib/utils"
import {
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
 * The room chat drawn with the /messages WhatsApp thread: the same bubbles,
 * tails, ticks, day pills, composer and scroll rules (opens at the newest,
 * never yanks a reader out of the history, jump button with a count). The
 * `dark` scope picks the WhatsApp dark tokens, which sit on the room's glass
 * panel the way the app's dark theme does.
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

  return (
    <div className={cn("dark flex h-full flex-col", !active && "hidden")}>
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto overscroll-contain pt-[8px] pb-[4px] [-webkit-overflow-scrolling:touch]"
        >
          <div ref={contentRef}>
            {loadingOlder && hasMore && (
              <OlderSpinner label={labels.chatLoadingOlder} />
            )}
            {items.length === 0 ? (
              <p className="px-4 pt-6 text-center text-sm text-white/60">
                {labels.noMessages}
              </p>
            ) : (
              rows
            )}
          </div>
        </div>
        {showJump && (
          <JumpToBottomButton
            unseen={unseen}
            onClick={jumpToBottom}
            label={labels.chatJumpLatest}
          />
        )}
      </div>
      <InputBar
        textOnly
        maxLength={1000}
        onSend={send}
        placeholder={labels.messagePlaceholder}
        labels={composerLabels}
        className="bg-transparent backdrop-blur-none"
      />
    </div>
  )
})
