import { cn } from "@/lib/utils"

import { BubbleTail } from "./bubble-tail"
import { BubbleTimestamp, type BubbleStatus } from "./bubble-timestamp"

type Props = {
  side: "me" | "other"
  avatarUrl?: string | null
  avatarFallback?: string
  durationLabel: string
  time: string
  status?: BubbleStatus
  className?: string
}

export function VoiceNoteBubble({
  side,
  avatarUrl,
  avatarFallback,
  durationLabel,
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
          "relative flex w-[287px] max-w-full items-center gap-[10px] rounded-[12px]",
          "border-[0.66px] border-[color:var(--wa-surface-shadow-baloon)]",
          "px-[8px] py-[8px]",
          isMe
            ? "bg-[color:var(--wa-surface-baloon-me)]"
            : "bg-[color:var(--wa-surface-baloon-other)]"
        )}
      >
        <BubbleTail side={side} />

        <span className="flex size-[40px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[0.212px] border-[color:var(--wa-border-avatar)] bg-neutral-300">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-full object-cover"
              draggable={false}
            />
          ) : (
            <span className="text-[14px] font-semibold text-white">
              {avatarFallback ?? "?"}
            </span>
          )}
        </span>

        <button
          type="button"
          aria-label="Play voice message"
          className="flex size-[24px] shrink-0 items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
            <path
              d="M5 3l14 9-14 9V3z"
              fill="currentColor"
              className="text-[color:var(--wa-text-primary)]"
            />
          </svg>
        </button>

        <div className="relative flex min-w-0 flex-1 items-center">
          <Waveform />
          <span className="absolute start-0 top-[18px] text-[11px] text-[color:var(--wa-text-secondary-alpha)]">
            {durationLabel}
          </span>
        </div>

        <BubbleTimestamp
          time={time}
          status={isMe ? (status ?? "sent") : null}
          className="absolute end-[10px] bottom-[3px]"
        />
      </div>
    </div>
  )
}

function Waveform() {
  const bars = [
    5, 9, 14, 20, 16, 10, 7, 12, 18, 22, 16, 9, 6, 12, 18, 20, 14, 8, 5, 10, 16,
    22, 18, 12, 7, 5,
  ]
  return (
    <div className="flex h-[28px] min-w-0 flex-1 items-center gap-[2px] pe-[8px]">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-[color:var(--wa-text-secondary-alpha)]"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  )
}
