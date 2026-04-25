import { cn } from "@/lib/utils"

import { BubbleTail } from "./bubble-tail"
import { BubbleTimestamp, type BubbleStatus } from "./bubble-timestamp"

type Props = {
  side: "me" | "other"
  text: string
  time: string
  status?: BubbleStatus
  replySenderName: string
  replyText: string
  tail?: boolean
  className?: string
}

export function ReplyBubble({
  side,
  text,
  time,
  status,
  replySenderName,
  replyText,
  tail = true,
  className,
}: Props) {
  const isMe = side === "me"
  return (
    <div
      className={cn(
        "flex w-full px-[16px] pb-[4px]",
        isMe ? "justify-end" : "justify-start",
        className
      )}
    >
      <div
        className={cn(
          "relative flex max-w-[287px] flex-col gap-[4px] rounded-[12px]",
          "border-[0.66px] border-[color:var(--wa-surface-shadow-baloon)]",
          "px-[6px] pt-[5px] pb-[6.5px]",
          isMe
            ? "bg-[color:var(--wa-surface-baloon-me)]"
            : "bg-[color:var(--wa-surface-baloon-other)]"
        )}
      >
        {tail && <BubbleTail side={side} />}

        <div className="relative flex min-w-[200px] items-start gap-[6px] overflow-hidden rounded-[7px] bg-black/5 py-[4px] ps-[8px] pe-[8px]">
          <span
            className="absolute start-0 top-0 h-full w-[4px] bg-[#DA4F7A]"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-semibold tracking-[-0.13px] text-[#DA4F7A]">
              {replySenderName}
            </span>
            <span className="truncate text-[13.2px] leading-[17px] tracking-[-0.13px] text-[color:var(--wa-text-secondary)]">
              {replyText}
            </span>
          </div>
        </div>

        <p className="px-[4px] text-[15.8px] leading-[21px] tracking-[-0.21px] text-[color:var(--wa-text-primary)]">
          {text}
          <span
            aria-hidden
            className={cn("inline-block", isMe ? "w-[70px]" : "w-[52px]")}
          />
        </p>

        <BubbleTimestamp
          time={time}
          status={isMe ? (status ?? "sent") : null}
          className="absolute end-[8px] bottom-[3px]"
        />
      </div>
    </div>
  )
}
