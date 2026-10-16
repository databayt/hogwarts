"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import type { BubbleStatus } from "./bubble-timestamp"
import { DateSeparator } from "./date-separator"
import { LocationBubble } from "./location-bubble"
import { MessageBubble } from "./message-bubble"
import type { ChatItem } from "./messages-view"
import { ReactionCluster } from "./reaction-cluster"
import { ReplyBubble } from "./reply-bubble"
import { VoiceNoteBubble } from "./voice-note-bubble"

export type ChatItemContext = {
  statusLabels?: Partial<Record<Exclude<BubbleStatus, null>, string>>
  notSentLabel?: string
  onRetry?: (messageId: string) => void
}

/**
 * One thread row. Shared by the /messages phone thread and the live-class
 * chat so both draw the same bubbles, tails, ticks and date pills.
 */
export function renderChatItem(item: ChatItem, ctx: ChatItemContext): ReactNode {
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
            statusLabels={ctx.statusLabels}
            retryLabel={ctx.notSentLabel}
            onRetry={
              item.status === "failed" && ctx.onRetry
                ? () => ctx.onRetry?.(item.id)
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
            statusLabels={ctx.statusLabels}
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
}

/** The spinner pill WhatsApp shows while a page of history comes in. */
export function OlderSpinner({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex w-full justify-center pt-[8px]"
    >
      <span className="flex size-[28px] items-center justify-center rounded-full bg-[color:var(--wa-surface-date)] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
        <span className="size-[16px] animate-spin rounded-full border-[2px] border-[color:var(--wa-text-secondary-alpha)] border-t-transparent" />
      </span>
    </div>
  )
}

/**
 * Jump to the newest message, with a count of what arrived while the reader
 * was up in the history.
 */
export function JumpToBottomButton({
  unseen,
  onClick,
  label,
  className,
}: {
  unseen: number
  onClick: () => void
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "wa-glass-control absolute end-[12px] bottom-[12px] z-10 flex size-[40px] items-center justify-center rounded-full",
        className
      )}
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
  )
}
