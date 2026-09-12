import { memo } from "react"

import { cn } from "@/lib/utils"

import { BubbleTail } from "./bubble-tail"
import { BubbleTimestamp, type BubbleStatus } from "./bubble-timestamp"

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
  return (
    <div
      className={cn(
        "flex w-full items-end gap-[8px] px-[16px] pb-[4px]",
        isMe ? "justify-end" : "justify-start",
        className
      )}
    >
      {failed && <FailedMark label={statusLabels?.failed} />}
      <Wrapper
        type={Wrapper === "button" ? "button" : undefined}
        onClick={failed ? onRetry : undefined}
        aria-label={failed ? retryLabel : undefined}
        className={cn(
          "relative flex max-w-[287px] min-w-[88px] flex-col items-start gap-[2px] text-start",
          "rounded-[12px] border-[0.66px] border-[color:var(--wa-surface-shadow-baloon)]",
          "px-[10px] pt-[5.5px] pb-[6.5px]",
          isMe
            ? "bg-[color:var(--wa-surface-baloon-me)]"
            : "bg-[color:var(--wa-surface-baloon-other)] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]",
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
          dir="auto"
          className="max-w-[267px] text-[15.8px] leading-[21px] tracking-[-0.21px] break-words whitespace-pre-wrap text-[color:var(--wa-text-primary)]"
        >
          {text}
          {/* Reserve trailing space for timestamp overlay */}
          <span
            aria-hidden
            className={cn("inline-block", isMe ? "w-[70px]" : "w-[52px]")}
          />
        </p>

        <BubbleTimestamp
          time={time}
          status={isMe ? (status ?? "sent") : null}
          labels={statusLabels}
          className="absolute end-[8.11px] bottom-[3px]"
        />
      </Wrapper>
    </div>
  )
})
