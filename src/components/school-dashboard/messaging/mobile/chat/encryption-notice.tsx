// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

type Props = {
  /** The notice sentence. Nothing renders without it. */
  text?: string
  /** Trailing bold link. Omitted when the dictionary has no key for it. */
  learnMoreLabel?: string
  onLearnMore?: () => void
  className?: string
}

/**
 * The cream end-to-end-encryption card that opens every WhatsApp thread. The
 * lock glyph sits inline with the first word, so it wraps with the sentence
 * instead of anchoring to a column of its own.
 */
export function EncryptionNotice({
  text,
  learnMoreLabel,
  onLearnMore,
  className,
}: Props) {
  if (!text) return null

  return (
    <div
      className={cn(
        "flex w-full justify-center px-[16px] pt-[12px] pb-[4px]",
        className
      )}
    >
      {/* 280px wide, not the full column: measured off
          public/whatsapp/IMG_2634..2637, where the card leaves ~55px of
          wallpaper on each side of a 390pt screen. */}
      <p className="max-w-[280px] rounded-[8px] bg-[color:var(--wa-surface-notice)] px-[14px] py-[6px] text-center text-[14.5px] leading-[20px] text-[color:var(--wa-text-notice)]">
        <LockGlyph />
        {text}
        {learnMoreLabel && (
          <>
            {" "}
            <button
              type="button"
              onClick={onLearnMore}
              className="font-semibold underline-offset-2 hover:underline"
            >
              {learnMoreLabel}
            </button>
          </>
        )}
      </p>
    </div>
  )
}

function LockGlyph() {
  return (
    <svg
      viewBox="0 0 10 12"
      className="me-[5px] inline-block h-[12.5px] w-[10.5px] align-[-1.5px]"
      fill="currentColor"
      aria-hidden
    >
      <path d="M5 0a3 3 0 0 0-3 3v1.2h1.6V3a1.4 1.4 0 0 1 2.8 0v1.2H8V3a3 3 0 0 0-3-3Z" />
      <path d="M1.4 5.2h7.2c.44 0 .8.36.8.8v5.2c0 .44-.36.8-.8.8H1.4a.8.8 0 0 1-.8-.8V6c0-.44.36-.8.8-.8Z" />
    </svg>
  )
}
