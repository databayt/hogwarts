"use client"

import { cn } from "@/lib/utils"

import { PersonGlyph } from "./ios-chat-row"
import { WaIcon, type WaIconName } from "./wa-icon"

type Props = {
  title: string
  subtitle?: string | null
  /** Small glyph drawn before the subtitle — the call direction, for example. */
  subtitleIcon?: React.ReactNode
  /** Colours the title, the way a missed call is drawn in red. */
  tone?: "default" | "danger" | "product"
  avatarUrl?: string | null
  /** Drawn in place of a photo. */
  avatarIcon?: WaIconName
  /** Photoless rows fall back to this ring colour pairing. */
  avatarVariant?: "person" | "group" | "product"
  meta?: string | null
  trailing?: React.ReactNode
  onClick?: () => void
  className?: string
}

/**
 * One row of a tab page's list. Same geometry as `IosChatRow` — 56px avatar,
 * 76px row, separator inset to the text column — so Updates, Calls and the
 * chat list read as one list language.
 */
export function IosListRow({
  title,
  subtitle,
  subtitleIcon,
  tone = "default",
  avatarUrl,
  avatarIcon,
  avatarVariant = "person",
  meta,
  trailing,
  onClick,
  className,
}: Props) {
  const titleColor =
    tone === "danger"
      ? "text-[color:var(--wa-text-quote-title)]"
      : tone === "product"
        ? "text-[color:var(--wa-text-product)]"
        : "text-[color:var(--wa-text-primary)]"

  const avatarSkin =
    avatarVariant === "group"
      ? "bg-[color:var(--wa-surface-avatar-group)] text-[color:var(--wa-text-avatar-group)]"
      : avatarVariant === "product"
        ? "bg-[color:var(--wa-surface-product)] text-[color:var(--wa-text-invert)]"
        : "bg-[color:var(--wa-surface-avatar-person)] text-[color:var(--wa-text-avatar-person)]"

  const Tag = onClick ? "button" : "div"

  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn(
        "flex w-full items-start gap-[12.66px] ps-[16px] pt-[10px] text-start",
        onClick && "active:bg-black/5",
        className
      )}
    >
      <div className="shrink-0 pt-[2px]">
        <div className="relative size-[56px] overflow-hidden rounded-full border-[0.33px] border-[color:var(--wa-border-avatar)]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-full object-cover"
              draggable={false}
            />
          ) : (
            <div
              className={cn(
                "flex size-full items-center justify-center",
                avatarSkin
              )}
            >
              {avatarIcon ? (
                <WaIcon name={avatarIcon} className="size-[28px]" />
              ) : (
                <PersonGlyph className="size-[30px]" />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-[76px] min-w-0 flex-1 items-start gap-[8px] border-b-[0.33px] border-[color:var(--wa-border-separator)] pb-[10px]">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[2px]">
          <p
            className={cn(
              "w-full truncate text-[16px] leading-tight font-semibold tracking-[-0.32px]",
              titleColor
            )}
          >
            {title}
          </p>
          {subtitle ? (
            <span className="flex w-full min-w-0 items-center gap-[4px] text-[14px] leading-[19px] tracking-[-0.14px] text-[color:var(--wa-text-secondary)]">
              {subtitleIcon}
              <span className="truncate">{subtitle}</span>
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-[10px] pe-[15px] pt-px">
          {meta ? (
            <time className="text-[14px] leading-[19px] tracking-[-0.14px] whitespace-nowrap text-[color:var(--wa-text-secondary)]">
              {meta}
            </time>
          ) : null}
          {trailing}
        </div>
      </div>
    </Tag>
  )
}
