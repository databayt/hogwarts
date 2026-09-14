"use client"

import { memo, useLayoutEffect, useRef } from "react"

import { cn } from "@/lib/utils"

import { BubbleTail } from "./bubble-tail"
import { BubbleTimestamp, type BubbleStatus } from "./bubble-timestamp"

/** One line of the 17/24 body; anything taller has wrapped. */
const LINE_PX = 24

/**
 * Narrow a wrapped paragraph to its longest line. CSS sizes a wrapped block
 * to the width it wrapped AT, so a two-line message keeps the full 263px and
 * leaves a gap beside its shorter lines; the iOS app hugs the longest line.
 * Single-line messages already fit and are never measured.
 */
function useHugLongestLine(text: string) {
  const ref = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      el.style.width = ""
      if (el.offsetHeight <= LINE_PX * 1.5) return
      const range = document.createRange()
      range.selectNodeContents(el)
      const lines = new Map<number, [number, number]>()
      for (const r of range.getClientRects()) {
        if (!r.width) continue
        const key = Math.round(r.top)
        const line = lines.get(key)
        lines.set(
          key,
          line
            ? [Math.min(line[0], r.left), Math.max(line[1], r.right)]
            : [r.left, r.right]
        )
      }
      let widest = 0
      for (const [l, r] of lines.values()) widest = Math.max(widest, r - l)
      if (widest) el.style.width = `${Math.ceil(widest)}px`
    }
    fit()
    // A web font landing after the first paint changes every line's width.
    let live = true
    document.fonts?.ready.then(() => live && fit())
    return () => {
      live = false
    }
  }, [text])
  return ref
}

type Props = {
  side: "me" | "other"
  text: string
  time: string
  status?: BubbleStatus
  tail?: boolean
  senderName?: string
  /** Accessible names for the tick states. */
  statusLabels?: Partial<Record<Exclude<BubbleStatus, null>, string>>
  /** Shown under a failed bubble; tapping the bubble retries. */
  retryLabel?: string
  onRetry?: () => void
  className?: string
}

/** The red mark iOS puts beside a message the server did not take. */
function FailedMark({ label }: { label?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="flex size-[20px] shrink-0 items-center justify-center self-end rounded-full bg-[#ff3b30] text-[13px] leading-none font-bold text-white"
    >
      !
    </span>
  )
}

export const MessageBubble = memo(function MessageBubble({
  side,
  text,
  time,
  status,
  tail = true,
  senderName,
  statusLabels,
  retryLabel,
  onRetry,
  className,
}: Props) {
  const isMe = side === "me"
  const failed = status === "failed"
  const Wrapper = failed && onRetry ? "button" : "div"
  const textRef = useHugLongestLine(text)
  return (
    <div
      className={cn(
        // 4px between bubbles of one run, 14px after the bubble that closes
        // it — measured off public/whatsapp/File (3).png and File (4).png.
        "flex w-full items-end gap-[8px] px-[16px]",
        tail ? "pb-[14px]" : "pb-[4px]",
        isMe ? "justify-end" : "justify-start",
        className
      )}
    >
      {failed && <FailedMark label={statusLabels?.failed} />}
      {/* Measured off File (4).png at 3x: 20px corners (squared where the tail
          joins), 12px sides, a 17/24 body, a hairline edge and no drop shadow.
          The bubble shrinks to its text — the time is its own row under the
          text, never an overlay, so a long line no longer stretches every
          bubble to the maximum width. */}
      <Wrapper
        type={Wrapper === "button" ? "button" : undefined}
        onClick={failed ? onRetry : undefined}
        aria-label={failed ? retryLabel : undefined}
        className={cn(
          "relative flex max-w-[283px] min-w-[64px] flex-col items-start gap-[3px] text-start",
          "rounded-[20px] border-[0.33px] border-[color:var(--wa-surface-shadow-baloon)]",
          tail && (isMe ? "rounded-ee-[4px]" : "rounded-es-[4px]"),
          "px-[12px] pt-[7px] pb-[6px]",
          isMe
            ? "bg-[color:var(--wa-surface-baloon-me)]"
            : "bg-[color:var(--wa-surface-baloon-other)]",
          failed && "opacity-90"
        )}
      >
        {tail && <BubbleTail side={side} />}

        {senderName && !isMe && (
          <p className="text-[12.8px] font-semibold tracking-[-0.13px] text-[color:var(--wa-surface-product)]">
            {senderName}
          </p>
        )}

        {/* `dir="auto"`: a message takes its own direction, the way WhatsApp
            draws Arabic right-aligned inside an English UI and vice versa. */}
        <p
          ref={textRef}
          dir="auto"
          className="max-w-[259px] text-[17px] leading-[24px] tracking-[-0.2px] break-words whitespace-pre-wrap text-[color:var(--wa-text-primary)]"
        >
          {text}
        </p>

        <BubbleTimestamp
          time={time}
          status={isMe ? (status ?? "sent") : null}
          labels={statusLabels}
          className="h-[15px] self-end"
        />
      </Wrapper>
    </div>
  )
})
