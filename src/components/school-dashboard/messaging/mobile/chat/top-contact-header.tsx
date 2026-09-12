"use client"

import { memo } from "react"

import { cn } from "@/lib/utils"

import { WaIcon } from "../wa-icon"

type Props = {
  name: string
  /** Presence or hint line under the name. Omitted leaves the name centred. */
  subtitle?: string | null
  avatarUrl?: string | null
  avatarFallback?: string
  onBack?: () => void
  onVideo?: () => void
  onPhone?: () => void
  onTapInfo?: () => void
  backLabel?: string
  videoLabel?: string
  phoneLabel?: string
  className?: string
}

/**
 * The chat header carries no bar of its own — the wallpaper runs to the top of
 * the screen and the controls float over it as liquid glass, the way the iOS
 * app draws it (`public/whatsapp/IMG_2634..2637`).
 *
 * Measured off those captures at 3x: the back disc is 44px inset 16px, the
 * call capsule 102x44 inset 16px on the other side, the avatar 40px, and the
 * name sits on the same axis as both discs. The material and the 44px size are
 * the toolbar instantiation of Figma node 1:59 — the same one `ios-header.tsx`
 * carries, so the back disc lands at the same y as the chat list's buttons.
 * The capsule has no kit variant of its own; it is that material at one width.
 */
export const TopContactHeader = memo(function TopContactHeader({
  name,
  subtitle,
  avatarUrl,
  avatarFallback,
  onBack,
  onVideo,
  onPhone,
  onTapInfo,
  backLabel,
  videoLabel,
  phoneLabel,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "wa-glass-chat pointer-events-none absolute inset-x-0 top-0 z-20",
        "flex items-end gap-[9px] px-[16px] pb-[8px]",
        "h-[calc(env(safe-area-inset-top,0px)+56px)]",
        className
      )}
    >
      {/* The scroll-edge effect: bubbles that scroll under the controls fade
          out through a frosted strip instead of showing through the name.
          IMG_2637 clips the top bubble at the band's edge the same way. The
          strip is blur plus the wallpaper's own cream, feathered by a mask so
          it has no hard edge, and it never takes a tap. */}
      <div
        aria-hidden
        className="wa-scroll-edge pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(env(safe-area-inset-top,0px)+72px)]"
      />
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel ?? "Back"}
        className="wa-glass-control pointer-events-auto flex size-[44px] shrink-0 items-center justify-center rounded-full"
      >
        <WaIcon
          name="ic-wa-chevron-lt-32"
          className="size-[34px] rtl:scale-x-[-1]"
        />
      </button>

      <button
        type="button"
        onClick={onTapInfo}
        className="pointer-events-auto flex h-[44px] min-w-0 flex-1 items-center gap-[10px] text-start"
      >
        <span className="flex size-[40px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[0.212px] border-[color:var(--wa-border-avatar)] bg-neutral-300">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              width={40}
              height={40}
              decoding="async"
              className="size-full object-cover"
              draggable={false}
            />
          ) : (
            <span className="text-[15px] font-semibold text-white">
              {avatarFallback ?? name.charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        <span className="flex min-w-0 flex-col justify-center">
          <span
            dir="auto"
            className="truncate text-[17px] leading-[22px] font-semibold tracking-[-0.34px] text-[color:var(--wa-text-primary)]"
          >
            {name}
          </span>
          {subtitle ? (
            <span className="truncate text-[13px] leading-[16px] text-[color:var(--wa-text-secondary)]">
              {subtitle}
            </span>
          ) : null}
        </span>
      </button>

      {/* The two glyphs are not symmetric inside the capsule: measured off the
          captures the video ink starts 14px in, the phone ink ends 13px from
          the far edge, and 27px of air sits between them. Our 32px icon boxes
          carry their own transparent inset (video 3.2, phone 5.9), so the
          padding and gap below are what put the *ink* where the capture has
          it, not what centres the boxes. */}
      <div className="wa-glass-control pointer-events-auto flex h-[44px] w-[102px] shrink-0 items-center justify-start gap-[17px] rounded-full ps-[10px]">
        <button
          type="button"
          onClick={onVideo}
          aria-label={videoLabel ?? "Video call"}
          className="flex size-[32px] items-center justify-center"
        >
          <WaIcon name="ic-wa-video-32" className="size-[32px]" />
        </button>
        <button
          type="button"
          onClick={onPhone}
          aria-label={phoneLabel ?? "Voice call"}
          className="flex size-[32px] items-center justify-center"
        >
          <WaIcon name="ic-wa-phone-32" className="size-[32px]" />
        </button>
      </div>
    </div>
  )
})
