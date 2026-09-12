import { memo } from "react"

import { cn } from "@/lib/utils"

import { WaIcon } from "../wa-icon"

/**
 * The tick state a bubble shows. `sending` is the optimistic row waiting on
 * the server (a small clock), `failed` is one the server refused (no tick —
 * the bubble draws the red mark beside itself).
 */
export type BubbleStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | null

type Props = {
  time: string
  status?: BubbleStatus
  /** Accessible names for the tick states. */
  labels?: Partial<Record<Exclude<BubbleStatus, null>, string>>
  className?: string
}

/** WhatsApp's single tick: one thin stroke, round caps. */
function SingleTick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 13 10" className={className} aria-hidden fill="none">
      <path
        d="M1.2 5.4 4.6 8.7 11.8 1.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** The small outlined clock iOS shows while a message is on its way. */
function ClockGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden fill="none">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M6 3.2V6l1.9 1.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const BubbleTimestamp = memo(function BubbleTimestamp({
  time,
  status,
  labels,
  className,
}: Props) {
  const label = status ? labels?.[status] : undefined
  return (
    <div className={cn("flex items-center justify-end gap-[2px]", className)}>
      <time
        // Clock time is formatted on the client's own zone; the server's zone
        // differs, and React patches the text on hydrate.
        suppressHydrationWarning
        className="text-[11px] leading-none tracking-[0.55px] text-[color:var(--wa-text-secondary-alpha)]"
      >
        {time}
      </time>
      {status === "sending" && (
        <span role="img" aria-label={label}>
          <ClockGlyph className="size-[12px] text-[color:var(--wa-text-secondary-alpha)]" />
        </span>
      )}
      {status === "sent" && (
        <span role="img" aria-label={label}>
          <SingleTick className="h-[10px] w-[13px] text-[color:var(--wa-text-secondary-alpha)]" />
        </span>
      )}
      {(status === "delivered" || status === "read") && (
        <WaIcon
          name="ic-wa-check-bubble-17"
          className={cn(
            "size-[17px]",
            status === "read"
              ? "text-[#53BDEB]"
              : "text-[color:var(--wa-text-secondary-alpha)]"
          )}
          ariaLabel={label}
        />
      )}
    </div>
  )
})
