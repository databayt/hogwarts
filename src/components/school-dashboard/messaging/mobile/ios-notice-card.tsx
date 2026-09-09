"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

const DISMISSED_KEY = "wa-notice-dismissed"

type Props = {
  title: string
  body: string
  actionLabel: string
  dismissLabel: string
  className?: string
}

/**
 * The card WhatsApp shows under the search field asking to be allowed to
 * notify. The button asks the browser for real notification permission; the
 * card hides once permission is decided, or once the reader dismisses it.
 */
export function IosNoticeCard({
  title,
  body,
  actionLabel,
  dismissLabel,
  className,
}: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Shown until notifications are actually granted, or until the reader
    // waves it away — the card is per-browser, so the dismissal is too.
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "granted") return
    try {
      if (window.localStorage.getItem(DISMISSED_KEY) === "1") return
    } catch {
      // Private windows and blocked site data throw here; show the card.
    }
    setVisible(true)
  }, [])

  if (!visible) return null

  const hide = () => {
    setVisible(false)
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1")
    } catch {
      // Nothing to remember it with; it will reappear next visit.
    }
  }

  const ask = async () => {
    try {
      await Notification.requestPermission()
    } finally {
      hide()
    }
  }

  return (
    <div className={cn("w-full px-[16px] pt-[12px]", className)}>
      <div className="flex w-full items-start gap-[14px] rounded-[14px] bg-[color:var(--wa-surface-primary)] px-[14px] py-[14px] shadow-[0_1px_6px_rgba(0,0,0,0.10)]">
        <BellGlyph className="mt-[2px] size-[32px] shrink-0 text-[color:var(--wa-surface-product)]" />

        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <p className="text-[16px] leading-[21px] font-semibold tracking-[-0.32px] text-[color:var(--wa-text-primary)]">
            {title}
          </p>
          <p className="text-[15px] leading-[20px] text-[color:var(--wa-text-primary)]">
            {body}{" "}
            <button
              type="button"
              onClick={ask}
              className="font-semibold text-[color:var(--wa-text-product)]"
            >
              {actionLabel}
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={hide}
          aria-label={dismissLabel}
          className="-mt-[2px] shrink-0 p-[2px] text-[color:var(--wa-text-secondary)]"
        >
          <svg
            viewBox="0 0 20 20"
            className="size-[20px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function BellGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M15 5.5a7.5 7.5 0 0 0-7 7.5v4.2l-1.8 3.4a1 1 0 0 0 .9 1.5h16.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.5 13.2v4l1.8 3.4a1 1 0 0 1-.9 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M12.6 25.2a3.6 3.6 0 0 0 6.8 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="24" cy="8.5" r="4" fill="currentColor" />
    </svg>
  )
}
