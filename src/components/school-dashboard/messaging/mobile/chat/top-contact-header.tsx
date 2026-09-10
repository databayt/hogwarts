"use client"

import { cn } from "@/lib/utils"

import { WaIcon } from "../wa-icon"

type Props = {
  name: string
  avatarUrl?: string | null
  avatarFallback?: string
  unreadCount?: number
  onBack?: () => void
  onVideo?: () => void
  onPhone?: () => void
  onTapInfo?: () => void
  className?: string
}

export function TopContactHeader({
  name,
  avatarUrl,
  avatarFallback,
  unreadCount,
  onBack,
  onVideo,
  onPhone,
  onTapInfo,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative flex h-[98px] w-full flex-col items-end justify-end py-[4px] pe-[22px]",
        "bg-[color:var(--wa-surface-panel)] backdrop-blur-[25px]",
        className
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex w-[272px] items-center pe-px">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex size-[32px] shrink-0 items-center justify-center rtl:scale-x-[-1]"
          >
            <WaIcon
              name="ic-wa-chevron-lt-32"
              className="size-[32px] text-[color:var(--wa-text-primary)]"
            />
          </button>

          {typeof unreadCount === "number" && unreadCount > 0 && (
            <span className="flex h-full items-center pe-[4px] text-[16.8px] font-medium tracking-[-0.336px] text-[color:var(--wa-text-primary)]">
              {unreadCount}
            </span>
          )}

          <button
            type="button"
            onClick={onTapInfo}
            className="flex min-w-0 flex-1 items-center gap-[10px] text-start"
          >
            <span className="flex size-[36px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[0.212px] border-[color:var(--wa-border-avatar)] bg-neutral-300">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-full object-cover"
                  draggable={false}
                />
              ) : (
                <span className="text-[14px] font-semibold text-white">
                  {avatarFallback ?? name.charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className="max-w-[145px] truncate text-[16px] font-semibold tracking-[-0.32px] text-[color:var(--wa-text-primary)]">
              {name}
            </span>
          </button>
        </div>

        <div className="flex items-start gap-[16px] pb-[2px]">
          <button
            type="button"
            onClick={onVideo}
            aria-label="Video call"
            className="size-[32px]"
          >
            <WaIcon
              name="ic-wa-video-32"
              className="size-[32px] text-[color:var(--wa-text-secondary)]"
            />
          </button>
          <button
            type="button"
            onClick={onPhone}
            aria-label="Voice call"
            className="size-[32px]"
          >
            <WaIcon
              name="ic-wa-phone-32"
              className="size-[32px] text-[color:var(--wa-text-secondary)]"
            />
          </button>
        </div>
      </div>
    </div>
  )
}
