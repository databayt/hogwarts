"use client"

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { cn } from "@/lib/utils"

import type { BubbleStatus } from "./bubble-timestamp"
import { ChatWallpaper } from "./chat-wallpaper"
import { DateSeparator } from "./date-separator"
import { EncryptionNotice } from "./encryption-notice"
import { InputBar, type ReplyDraft } from "./input-bar"
import { LocationBubble } from "./location-bubble"
import { MessageBubble } from "./message-bubble"
import { ReactionCluster } from "./reaction-cluster"
import { ReplyBubble } from "./reply-bubble"
import { TopContactHeader } from "./top-contact-header"
import { VoiceNoteBubble } from "./voice-note-bubble"

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

/**
 * Within this many pixels of the bottom the reader counts as "at the
 * bottom": arrivals scroll into view and the jump button stays hidden.
 */
const NEAR_BOTTOM_PX = 80

/**
 * Older messages are requested when the reader is within this many
 * viewport-heights of the top — early enough that the page is usually in
 * before they get there, so the spinner is rarely seen.
 */
const PREFETCH_VIEWPORTS = 1.5

const isOwn = (item: ChatItem | undefined) =>
  !!item && item.kind !== "date" && item.side === "me"
const isOther = (item: ChatItem) => item.kind !== "date" && item.side === "other"

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Whether the reader is at (or near) the newest message. Read on every
  // scroll, written to state only when the answer flips, so a flick does
  // not re-render the thread sixty times a second.
  const nearBottomRef = useRef(true)
  const [showJump, setShowJump] = useState(false)
  const [unseen, setUnseen] = useState(0)

  // Set right before older messages are requested; consumed by the layout
  // effect that puts the reader back where they were once they arrive.
  const prependRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(
    null
  )
  const [loadingOlder, setLoadingOlder] = useState(false)
  const loadingRef = useRef(false)

  const prevItemsRef = useRef<ChatItem[]>(items)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current
    if (!el) return
    if (behavior === "smooth") {
      el.scrollTo({ top: el.scrollHeight, behavior })
    } else {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  // Open at the newest message, as WhatsApp does.
  useLayoutEffect(() => {
    scrollToBottom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Where to put the reader after the thread changed underneath them.
  useLayoutEffect(() => {
    const el = scrollRef.current
    const prev = prevItemsRef.current
    prevItemsRef.current = items
    if (!el || prev === items) return

    const pending = prependRef.current
    const grewAtTop =
      prev.length > 0 &&
      items.length > prev.length &&
      items[0]?.id !== prev[0]?.id &&
      items[items.length - 1]?.id === prev[prev.length - 1]?.id

    if (pending && grewAtTop) {
      // Older messages were prepended: hold the reader's place. The delta is
      // measured, not estimated, and iOS has no `overflow-anchor` to do it.
      prependRef.current = null
      el.scrollTop = pending.scrollTop + (el.scrollHeight - pending.scrollHeight)
      return
    }
    prependRef.current = null

    // Only a longer list is an arrival. A temp row becoming its persisted
    // twin keeps the length, and must not move a reader who scrolled up in
    // the second after sending.
    if (items.length <= prev.length) return
    const prevIds = new Set(prev.map((i) => i.id))
    const fresh = items.filter((i) => !prevIds.has(i.id))
    if (fresh.length === 0) return

    // Follow arrivals only when the reader is already at the bottom, or the
    // arrival is their own message. A reader scrolled up into history keeps
    // their place and gets the jump button with a count instead.
    if (nearBottomRef.current || fresh.some(isOwn)) {
      scrollToBottom()
      return
    }
    const others = fresh.filter(isOther).length
    if (others > 0) setUnseen((n) => n + others)
  }, [items, scrollToBottom])

  // Heights change after commit — images decode, the composer grows, the
  // keyboard shrinks the viewport. Stay pinned to the bottom through all of
  // it, but only while the reader was at the bottom to begin with.
  useEffect(() => {
    const el = scrollRef.current
    const content = contentRef.current
    if (!el || !content) return
    const observer = new ResizeObserver(() => {
      if (nearBottomRef.current) scrollToBottom()
    })
    observer.observe(content)
    observer.observe(el)
    return () => observer.disconnect()
  }, [scrollToBottom])

  const requestOlder = useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasMore || !onLoadMore || loadingRef.current) return
    loadingRef.current = true
    setLoadingOlder(true)
    prependRef.current = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight }
    Promise.resolve(onLoadMore()).finally(() => {
      loadingRef.current = false
      setLoadingOlder(false)
    })
  }, [hasMore, onLoadMore])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const near = fromBottom < NEAR_BOTTOM_PX
    if (near !== nearBottomRef.current) {
      nearBottomRef.current = near
      setShowJump(!near && el.scrollHeight > el.clientHeight + NEAR_BOTTOM_PX)
      if (near) setUnseen(0)
    }
    if (el.scrollTop < el.clientHeight * PREFETCH_VIEWPORTS) requestOlder()
  }, [requestOlder])

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
      items.map((item) => {
        switch (item.kind) {
          case "date":
            return <DateSeparator key={item.id} label={item.label} />
          case "text":
            return (
              <div key={item.id}>
                <MessageBubble
                  side={item.side}
                  text={item.text}
                  time={item.time}
                  status={item.status}
                  tail={item.tail}
                  senderName={item.senderName}
                  statusLabels={statusLabels}
                  retryLabel={labels?.notSent}
                  onRetry={
                    item.status === "failed" && onRetry
                      ? () => onRetry(item.id)
                      : undefined
                  }
                />
                {item.reactions && item.reactions.length > 0 && (
                  <ReactionCluster emojis={item.reactions} side={item.side} />
                )}
              </div>
            )
          case "reply":
            return (
              <ReplyBubble
                key={item.id}
                side={item.side}
                text={item.text}
                time={item.time}
                status={item.status}
                replySenderName={item.replySenderName}
                replyText={item.replyText}
                statusLabels={statusLabels}
              />
            )
          case "voice":
            return (
              <VoiceNoteBubble
                key={item.id}
                side={item.side}
                avatarUrl={item.avatarUrl}
                avatarFallback={item.avatarFallback}
                durationLabel={item.durationLabel}
                time={item.time}
                status={item.status}
              />
            )
          case "location":
            return (
              <LocationBubble
                key={item.id}
                side={item.side}
                mapImageUrl={item.mapImageUrl}
                time={item.time}
                status={item.status}
              />
            )
        }
      }),
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
          className="flex-1 overflow-y-auto overscroll-contain pt-[calc(env(safe-area-inset-top,0px)+56px)] pb-[8px] [-webkit-overflow-scrolling:touch]"
        >
          <div ref={contentRef}>
            {/* The spinner pill WhatsApp shows while a page of history comes in. */}
            {loadingOlder && hasMore && (
              <div
                role="status"
                aria-label={labels?.loadingOlder}
                className="flex w-full justify-center pt-[8px]"
              >
                <span className="flex size-[28px] items-center justify-center rounded-full bg-[color:var(--wa-surface-date)] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
                  <span className="size-[16px] animate-spin rounded-full border-[2px] border-[color:var(--wa-text-secondary-alpha)] border-t-transparent" />
                </span>
              </div>
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

        {/* Jump to the newest message, with a count of what arrived while
            the reader was up in the history. */}
        {showJump && (
          <button
            type="button"
            onClick={() => {
              setUnseen(0)
              scrollToBottom("smooth")
            }}
            aria-label={labels?.scrollToBottom}
            className="wa-glass-control absolute end-[12px] bottom-[12px] z-10 flex size-[40px] items-center justify-center rounded-full"
          >
            <svg
              viewBox="0 0 20 20"
              className="size-[20px] text-[color:var(--wa-text-primary)]"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 7.5 10 13.5 16 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {unseen > 0 && (
              <span className="absolute -top-[6px] -end-[4px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[color:var(--wa-surface-product)] px-[5px] text-[11px] leading-none font-semibold text-[color:var(--wa-text-invert)]">
                {unseen > 99 ? "99+" : unseen}
              </span>
            )}
          </button>
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
