"use client"

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

export type IosChatRowData = {
  id: string
  name: string
  avatarUrl?: string | null
  avatarFallback?: string
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
  onClick?: () => void
  className?: string
}

export function IosChatRow({ row, onClick, className }: Props) {
  const hasUnread = (row.unreadCount ?? 0) > 0
  const timestampColor = hasUnread
    ? "text-[color:var(--wa-text-product)]"
    : "text-[color:var(--wa-text-secondary)]"

  return (
    <button
      type="button"
      onClick={onClick}
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
              className="size-full object-cover"
              draggable={false}
            />
          ) : row.isGroup ? (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-neutral-400 to-neutral-500">
              <WaIcon
                name="ic-wa-group-16"
                className="size-[28px] text-white"
                tint={false}
              />
            </div>
          ) : (
            <div className="flex size-full items-center justify-center bg-[color:var(--wa-text-secondary)] text-[20px] font-semibold text-white">
              {row.avatarFallback ?? row.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <IosPresenceDot online={row.online} />
      </div>

      <div className="flex h-[67.33px] min-w-0 flex-1 items-start gap-[8px] border-b-[0.33px] border-[color:var(--wa-border-separator)] pe-[15px]">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[1.5px]">
          <div className="flex w-full items-center gap-[3px]">
            <p className="max-w-[200px] truncate text-[16px] leading-tight font-semibold tracking-[-0.32px] text-[color:var(--wa-text-primary)]">
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

        <div className="flex w-[60px] shrink-0 flex-col items-end gap-[3px] pt-px">
          <time
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
}
