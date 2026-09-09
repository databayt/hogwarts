"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from "react"

import { cn } from "@/lib/utils"

import type { BubbleStatus } from "./bubble-timestamp"
import { ChatWallpaper } from "./chat-wallpaper"
import { DateSeparator } from "./date-separator"
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

type Props = {
  contactName: string
  contactSubtitle?: string
  contactAvatarUrl?: string | null
  unreadCount?: number
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
  replyDraft?: ReplyDraft | null
  draftText?: string
  /** Fetches older messages when the reader reaches the top of the thread. */
  onLoadMore?: () => void | Promise<void>
  hasMore?: boolean
  inputPlaceholder?: string
  encryptionNotice?: string
  className?: string
}

/** How close to the top counts as "asking for older messages". */
const LOAD_MORE_THRESHOLD_PX = 120

export function MessagesView({
  contactName,
  contactSubtitle,
  contactAvatarUrl,
  unreadCount,
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
  replyDraft,
  draftText,
  onLoadMore,
  hasMore,
  inputPlaceholder,
  encryptionNotice,
  className,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // Distinguishes "older messages were prepended" from "a new one arrived".
  const prevFirstId = useRef<string | null>(null)
  const prevCount = useRef(0)
  const prevScrollHeight = useRef(0)

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const firstId = items[0]?.id ?? null
    const grewAtTop =
      prevFirstId.current !== null &&
      firstId !== prevFirstId.current &&
      items.length > prevCount.current

    if (grewAtTop) {
      // Older messages were prepended — hold the reader's place instead of
      // yanking them back to the bottom.
      el.scrollTop += el.scrollHeight - prevScrollHeight.current
    } else if (items.length !== prevCount.current) {
      el.scrollTop = el.scrollHeight
    }

    prevFirstId.current = firstId
    prevCount.current = items.length
    prevScrollHeight.current = el.scrollHeight
  }, [items])

  // Open every conversation at its newest message, as WhatsApp does.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Scroll fires many times per flick; without this the same cursor would be
  // requested repeatedly and the same page prepended more than once.
  const loadingMore = useRef(false)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || !hasMore || !onLoadMore || loadingMore.current) return
    if (el.scrollTop > LOAD_MORE_THRESHOLD_PX) return
    loadingMore.current = true
    Promise.resolve(onLoadMore()).finally(() => {
      loadingMore.current = false
    })
  }

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
    [items]
  )

  return (
    <div className={cn("relative flex h-full w-full flex-col", className)}>
      <TopContactHeader
        name={contactName}
        subtitle={contactSubtitle}
        avatarUrl={contactAvatarUrl}
        unreadCount={unreadCount}
        onBack={onBack}
        onVideo={onVideo}
        onPhone={onPhone}
        onTapInfo={onTapInfo}
      />

      <ChatWallpaper className="min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain pb-[8px]"
        >
          {encryptionNotice && (
            <div className="flex w-full justify-center px-[16px] pt-[12px] pb-[4px]">
              <p className="max-w-[320px] rounded-[8px] bg-[color:var(--wa-surface-date)] px-[12px] py-[6px] text-center text-[12px] leading-[16px] text-[color:var(--wa-text-primary)]">
                {encryptionNotice}
              </p>
            </div>
          )}
          {renderedItems}
        </div>
      </ChatWallpaper>

      <InputBar
        value={draftText}
        placeholder={inputPlaceholder}
        onSend={onSend}
        onAttach={onAttach}
        onSticker={onSticker}
        onCamera={onCamera}
        onMic={onMic}
        replyDraft={replyDraft}
      />
    </div>
  )
}
