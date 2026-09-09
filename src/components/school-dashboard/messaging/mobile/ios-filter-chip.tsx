"use client"

import { cn } from "@/lib/utils"

import { WaIcon } from "./wa-icon"

type Props = {
  label?: string
  active?: boolean
  iconOnly?: boolean
  onClick?: () => void
  className?: string
}

export function IosFilterChip({
  label,
  active = false,
  iconOnly = false,
  onClick,
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!iconOnly ? active : undefined}
      className={cn(
        "overflow-clip rounded-[19px] transition-colors",
        // Each chip is only as wide as its own label, so the row reads as
        // words rather than as four equal slots.
        "border-[1px]",
        iconOnly
          ? "flex size-[32px] shrink-0 items-center justify-center border-[color:var(--wa-border-cta-filters)]"
          : "flex h-[32px] shrink-0 items-center px-[10px]",
        !iconOnly &&
          active &&
          "border-[color:var(--wa-border-cta-filters-active)] bg-[color:var(--wa-surface-cta-filters-active)]",
        !iconOnly && !active && "border-[color:var(--wa-border-cta-filters)]",
        className
      )}
    >
      {iconOnly ? (
        <WaIcon
          name="ic-wa-plus-filter-24"
          className="size-[12px] text-[color:var(--wa-text-cta-filters)]"
          ariaLabel="More filters"
        />
      ) : (
        <span
          className={cn(
            "text-[14px] leading-[19px] font-semibold tracking-[-0.14px] whitespace-nowrap",
            active
              ? "text-[color:var(--wa-text-cta-filters-active)]"
              : "text-[color:var(--wa-text-cta-filters)]"
          )}
        >
          {label}
        </span>
      )}
    </button>
  )
}
