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
        iconOnly
          ? "flex size-[34px] items-center justify-center bg-[color:var(--wa-surface-cta-filters)]"
          : "flex h-[34px] items-center px-[14px]",
        !iconOnly &&
          active &&
          "bg-[color:var(--wa-surface-cta-filters-active)]",
        !iconOnly && !active && "bg-[color:var(--wa-surface-cta-filters)]",
        className
      )}
    >
      {iconOnly ? (
        <WaIcon
          name="ic-wa-plus-filter-24"
          className="size-[24px] text-[color:var(--wa-text-cta-filters)]"
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
