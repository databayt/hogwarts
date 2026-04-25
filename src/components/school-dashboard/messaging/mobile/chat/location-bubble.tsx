import { cn } from "@/lib/utils"

import { BubbleTail } from "./bubble-tail"
import { BubbleTimestamp, type BubbleStatus } from "./bubble-timestamp"

type Props = {
  side: "me" | "other"
  mapImageUrl?: string
  time: string
  status?: BubbleStatus
  className?: string
}

export function LocationBubble({
  side,
  mapImageUrl,
  time,
  status,
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
          "relative flex w-[240px] max-w-full flex-col overflow-hidden rounded-[12px]",
          "border-[0.66px] border-[color:var(--wa-surface-shadow-baloon)]",
          isMe
            ? "bg-[color:var(--wa-surface-baloon-me)]"
            : "bg-[color:var(--wa-surface-baloon-other)]"
        )}
      >
        <BubbleTail side={side} />
        <div
          className="h-[130px] w-full bg-neutral-200"
          style={
            mapImageUrl
              ? {
                  backgroundImage: `url('${mapImageUrl}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="flex h-full items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="size-[28px] drop-shadow"
              aria-hidden
            >
              <path
                d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                fill="#E83E3E"
              />
            </svg>
          </div>
        </div>
        <BubbleTimestamp
          time={time}
          status={isMe ? (status ?? "sent") : null}
          className="absolute end-[8px] bottom-[6px] rounded-[4px] bg-black/30 px-[4px] py-[2px] text-white [&>time]:text-white"
        />
      </div>
    </div>
  )
}
