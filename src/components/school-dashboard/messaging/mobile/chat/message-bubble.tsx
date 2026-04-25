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
  className?: string
}

export function MessageBubble({
  side,
  text,
  time,
  status,
  tail = true,
  senderName,
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
          "relative flex max-w-[287px] min-w-[88px] flex-col items-start gap-[2px]",
          "rounded-[12px] border-[0.66px] border-[color:var(--wa-surface-shadow-baloon)]",
          "px-[10px] pt-[5.5px] pb-[6.5px]",
          isMe
            ? "bg-[color:var(--wa-surface-baloon-me)]"
            : "bg-[color:var(--wa-surface-baloon-other)] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]"
        )}
      >
        {tail && <BubbleTail side={side} />}

        {senderName && !isMe && (
          <p className="text-[12.8px] font-semibold tracking-[-0.13px] text-[color:var(--wa-surface-product)]">
            {senderName}
          </p>
        )}

        <p className="max-w-[267px] text-[15.8px] leading-[21px] tracking-[-0.21px] break-words whitespace-pre-wrap text-[color:var(--wa-text-primary)]">
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
          className="absolute end-[8.11px] bottom-[3px]"
        />
      </div>
    </div>
  )
}
