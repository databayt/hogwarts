"use client"

import { memo } from "react"

import { cn } from "@/lib/utils"

import { IosMessagePreview } from "./ios-message-preview"
import { IosPresenceDot } from "./ios-presence-dot"
import { WaIcon } from "./wa-icon"

type LeadingKind =
  | "check-read"
  | "check-sent"
  | "voice"
  | "location"
  | "deleted"
  | null

// The desktop list's palette (contacts/contact-card.tsx, chat-interface.tsx).
// One flat blue for every photo-less row read as a wall of identical discs.
const AVATAR_COLORS = [
  { bg: "#CBF2EE", icon: "#028377" },
  { bg: "#E9E0FF", icon: "#5D47DE" },
  { bg: "#FEF1D4", icon: "#9D6C2C" },
  { bg: "#FBD8DC", icon: "#D10335" },
]

function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export type IosChatRowData = {
  id: string
  name: string
  avatarUrl?: string | null
  avatarFallback?: string
  /** Hashed to pick the fallback avatar's colour. */
  avatarKey?: string
  isGroup?: boolean
  online?: boolean
  preview: string
  previewLeading?: LeadingKind
  previewItalic?: boolean
  timestamp: string
  unreadCount?: number
  mentioned?: boolean
  pinned?: boolean
  muted?: boolean
}

type Props = {
  row: IosChatRowData
  /** Receives the row's conversation id, so one handler serves every row. */
  onClick?: (id: string) => void
  className?: string
}

/** The person silhouette WhatsApp shows when a contact has no photo. */
export function PersonGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4.2" />
      <path d="M12 13.6c-4.1 0-7.4 2.4-7.4 5.4v1h14.8v-1c0-3-3.3-5.4-7.4-5.4Z" />
    </svg>
  )
}

/**
 * One conversation row. Memoised: the list re-renders on every socket tick
 * and every poll, and a row whose data did not change should not.
 */
export const IosChatRow = memo(function IosChatRow({
  row,
  onClick,
  className,
}: Props) {
  const avatarColor = getAvatarColor(row.avatarKey ?? row.id)
  const hasUnread = (row.unreadCount ?? 0) > 0
  const timestampColor = hasUnread
    ? "text-[color:var(--wa-text-product)]"
    : "text-[color:var(--wa-text-secondary)]"

  return (
    <button
      type="button"
      onClick={() => onClick?.(row.id)}
      className={cn(
        "flex w-full items-start gap-[12.66px] ps-[16px] pt-[10px] text-start active:bg-black/5",
        className
      )}
    >
      <div className="relative shrink-0 pt-[2px]">
        <div className="relative size-[56px] overflow-hidden rounded-full border-[0.33px] border-[color:var(--wa-border-avatar)] bg-neutral-200">
          {row.avatarUrl ? (
            <img
              src={row.avatarUrl}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
              draggable={false}
            />
          ) : row.isGroup ? (
            <div
              className="flex size-full items-center justify-center"
              style={{
                backgroundColor: avatarColor.bg,
                color: avatarColor.icon,
              }}
            >
              <WaIcon name="ic-wa-group-16" className="size-[30px]" />
            </div>
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{
                backgroundColor: avatarColor.bg,
                color: avatarColor.icon,
              }}
            >
              <PersonGlyph className="size-[30px]" />
            </div>
          )}
        </div>
        <IosPresenceDot online={row.online} />
      </div>

      <div className="flex h-[76px] min-w-0 flex-1 items-start gap-[8px] border-b-[0.33px] border-[color:var(--wa-border-separator)]">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[1.5px]">
          <div className="flex w-full items-center gap-[3px]">
            <p
              dir="auto"
              className="max-w-[200px] truncate text-[16px] leading-tight font-semibold tracking-[-0.32px] text-[color:var(--wa-text-primary)]"
            >
              {row.name}
            </p>
          </div>
          <IosMessagePreview
            text={row.preview}
            leading={row.previewLeading ?? null}
            italic={row.previewItalic}
            className="w-full"
          />
        </div>

        <div className="flex w-[60px] shrink-0 flex-col items-end gap-[3px] pe-[15px] pt-px">
          <time
            // Formatted in the browser's zone; the server rendered it in its
            // own. React patches the text on hydrate instead of warning.
            suppressHydrationWarning
            className={cn(
              "text-[14px] leading-[19px] tracking-[-0.14px] whitespace-nowrap",
              timestampColor
            )}
          >
            {row.timestamp}
          </time>

          <div className="flex items-center gap-[6px]">
            {row.mentioned && (
              <span className="inline-flex min-w-[16px] items-center justify-center text-[17px] leading-none font-semibold tracking-[-0.17px] text-[color:var(--wa-text-product)] italic">
                @
              </span>
            )}
            {hasUnread && (
              <span className="inline-flex min-w-[16px] items-center justify-center rounded-full bg-[color:var(--wa-surface-product)] px-[6px] py-px text-[12px] leading-none tracking-[-0.12px] text-[color:var(--wa-text-invert)]">
                {row.unreadCount}
              </span>
            )}
            {row.pinned && !hasUnread && (
              <WaIcon
                name="ic-wa-pin-16"
                className="size-[16px] rotate-45 text-[color:var(--wa-text-secondary)]"
                ariaLabel="Pinned"
              />
            )}
          </div>
        </div>
      </div>
    </button>
  )
})
