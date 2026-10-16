"use client"

import { memo, useMemo } from "react"

import { cn } from "@/lib/utils"

import type { BubbleStatus } from "./bubble-timestamp"
import { ChatWallpaper } from "./chat-wallpaper"
import { EncryptionNotice } from "./encryption-notice"
import { InputBar, type ReplyDraft } from "./input-bar"
import {
  JumpToBottomButton,
  OlderSpinner,
  renderChatItem,
} from "./thread-parts"
import { TopContactHeader } from "./top-contact-header"
import { useStickToBottom } from "./use-stick-to-bottom"

export type ChatItem =
  | { kind: "date"; id: string; label: string }
  | {
      kind: "text"
      id: string
      side: "me" | "other"
      text: string
      time: string
      status?: BubbleStatus
      senderName?: string
      tail?: boolean
      reactions?: string[]
    }
  | {
      kind: "reply"
      id: string
      side: "me" | "other"
      text: string
      time: string
      status?: BubbleStatus
      replySenderName: string
      replyText: string
    }
  | {
      kind: "voice"
      id: string
      side: "me" | "other"
      avatarUrl?: string | null
      avatarFallback?: string
      durationLabel: string
      time: string
      status?: BubbleStatus
    }
  | {
      kind: "location"
      id: string
      side: "me" | "other"
      mapImageUrl?: string
      time: string
      status?: BubbleStatus
    }

export type MessagesViewLabels = {
  statusSending?: string
  statusSent?: string
  statusDelivered?: string
  statusRead?: string
  statusFailed?: string
  notSent?: string
  loadingOlder?: string
  scrollToBottom?: string
  attach?: string
  stickers?: string
  camera?: string
  mic?: string
  send?: string
  cancelReply?: string
}

type Props = {
  contactName: string
  /** Presence or hint line under the name in the header. */
  contactSubtitle?: string | null
  contactAvatarUrl?: string | null
  backLabel?: string
  items: ChatItem[]
  onBack?: () => void
  onVideo?: () => void
  onPhone?: () => void
  onTapInfo?: () => void
  onSend?: (text: string) => void
  onAttach?: () => void
  onSticker?: () => void
  onCamera?: () => void
  onMic?: () => void
  onTypingStart?: () => void
  onTypingStop?: () => void
  /** Tapping a failed bubble re-sends it. */
  onRetry?: (messageId: string) => void
  replyDraft?: ReplyDraft | null
  /** The draft to restore into the composer when the thread opens. */
  draftText?: string
  onDraftChange?: (text: string) => void
  /** Fetches older messages when the reader nears the top of the thread. */
  onLoadMore?: () => void | Promise<void>
  hasMore?: boolean
  inputPlaceholder?: string
  encryptionNotice?: string
  encryptionLearnMore?: string
  labels?: MessagesViewLabels
  className?: string
}

export const MessagesView = memo(function MessagesView({
  contactName,
  contactSubtitle,
  contactAvatarUrl,
  backLabel,
  items,
  onBack,
  onVideo,
  onPhone,
  onTapInfo,
  onSend,
  onAttach,
  onSticker,
  onCamera,
  onMic,
  onTypingStart,
  onTypingStop,
  onRetry,
  replyDraft,
  draftText,
  onDraftChange,
  onLoadMore,
  hasMore,
  inputPlaceholder,
  encryptionNotice,
  encryptionLearnMore,
  labels,
  className,
}: Props) {
  const {
    scrollRef,
    contentRef,
    handleScroll,
    showJump,
    unseen,
    jumpToBottom,
    loadingOlder,
  } = useStickToBottom({ items, hasMore, onLoadMore })

  const statusLabels = useMemo(
    () => ({
      sending: labels?.statusSending,
      sent: labels?.statusSent,
      delivered: labels?.statusDelivered,
      read: labels?.statusRead,
      failed: labels?.statusFailed,
    }),
    [
      labels?.statusSending,
      labels?.statusSent,
      labels?.statusDelivered,
      labels?.statusRead,
      labels?.statusFailed,
    ]
  )

  const composerLabels = useMemo(
    () => ({
      attach: labels?.attach,
      stickers: labels?.stickers,
      camera: labels?.camera,
      mic: labels?.mic,
      send: labels?.send,
      cancelReply: labels?.cancelReply,
    }),
    [
      labels?.attach,
      labels?.stickers,
      labels?.camera,
      labels?.mic,
      labels?.send,
      labels?.cancelReply,
    ]
  )

  // The card follows the opening date pill when the thread has one.
  const noticeIndex = items[0]?.kind === "date" ? 1 : 0

  const renderedItems = useMemo(
    () =>
      items.map((item) =>
        renderChatItem(item, {
          statusLabels,
          notSentLabel: labels?.notSent,
          onRetry,
        })
      ),
    [items, statusLabels, labels?.notSent, onRetry]
  )

  return (
    <div className={cn("relative flex h-full w-full flex-col", className)}>
      {/* The wallpaper runs to the top of the screen and the thread scrolls
          under the floating header, which is why the header is out of flow and
          the scroller carries its height as padding. Padding on the scroller
          itself keeps scrollHeight whole, so the prepend anchor above still
          measures a real delta. */}
      <ChatWallpaper className="min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain pt-[calc(env(safe-area-inset-top,0px)+70px)] pb-[8px] [-webkit-overflow-scrolling:touch]"
        >
          <div ref={contentRef}>
            {/* The spinner pill WhatsApp shows while a page of history comes in. */}
            {loadingOlder && hasMore && (
              <OlderSpinner label={labels?.loadingOlder} />
            )}
            {/* The thread's first date pill sits ABOVE the encryption card —
                see the captures. Everything after the card is the thread. The
                card belongs to the head of the thread, so it waits until no
                older page is left to fetch. */}
            {renderedItems.slice(0, noticeIndex)}
            {!hasMore && (
              <EncryptionNotice
                text={encryptionNotice}
                learnMoreLabel={encryptionLearnMore}
              />
            )}
            {renderedItems.slice(noticeIndex)}
          </div>
        </div>

        {showJump && (
          <JumpToBottomButton
            unseen={unseen}
            onClick={jumpToBottom}
            label={labels?.scrollToBottom}
          />
        )}
      </ChatWallpaper>

      <TopContactHeader
        name={contactName}
        subtitle={contactSubtitle}
        avatarUrl={contactAvatarUrl}
        onBack={onBack}
        onVideo={onVideo}
        onPhone={onPhone}
        onTapInfo={onTapInfo}
        backLabel={backLabel}
      />

      <InputBar
        initialValue={draftText}
        onChange={onDraftChange}
        placeholder={inputPlaceholder}
        onSend={onSend}
        onAttach={onAttach}
        onSticker={onSticker}
        onCamera={onCamera}
        onMic={onMic}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        replyDraft={replyDraft}
        labels={composerLabels}
      />
    </div>
  )
})
