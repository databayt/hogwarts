"use client"

import { cn } from "@/lib/utils"

import { WaIcon } from "./wa-icon"

type Props = {
  title?: string
  showOptions?: boolean
  showCamera?: boolean
  showAdd?: boolean
  showBack?: boolean
  onOptions?: () => void
  onCamera?: () => void
  onAdd?: () => void
  onBack?: () => void
  backLabel?: string
  className?: string
}

export function IosHeader({
  title,
  showOptions,
  showCamera,
  showAdd,
  showBack,
  onOptions,
  onCamera,
  onAdd,
  onBack,
  backLabel,
  className,
}: Props) {
  const hasTitle = Boolean(title)
  return (
    <div
      className={cn(
        // Liquid glass: the bar itself has no surface. The buttons float as
        // glass discs and the list scrolls underneath them.
        "pointer-events-none relative flex h-[98px] w-full items-end justify-end gap-[14px] px-[16px] pb-[10px]",
        className
      )}
    >
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel ?? "Back"}
          className="absolute start-[4px] bottom-[8px] flex h-[40px] items-center justify-center rounded-full px-[8px] text-[color:var(--wa-surface-product)] rtl:scale-x-[-1]"
        >
          <svg
            viewBox="0 0 12 20"
            className="size-[20px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="10 2 2 10 10 18" />
          </svg>
        </button>
      )}

      {hasTitle && (
        <p className="pointer-events-none absolute start-1/2 bottom-[8px] -translate-x-1/2 text-center text-[16.8px] leading-none font-semibold tracking-[-0.336px] text-[color:var(--wa-text-primary)] rtl:translate-x-1/2">
          {title}
        </p>
      )}

      {showOptions && (
        <>
          <HeaderCircularButton onClick={onOptions} ariaLabel="More options">
            <WaIcon
              name="ic-wa-meetball-24"
              className="size-[22px] text-[color:var(--wa-text-primary)]"
            />
          </HeaderCircularButton>
          <div className="h-[26px] flex-1" />
        </>
      )}

      {showCamera && (
        <HeaderCircularButton onClick={onCamera} ariaLabel="Camera">
          <WaIcon
            name="ic-wa-camera-24"
            className="size-[22px] text-[color:var(--wa-text-primary)]"
          />
        </HeaderCircularButton>
      )}

      {showAdd && (
        <HeaderCircularButton
          onClick={onAdd}
          ariaLabel="New chat"
          variant="product"
        >
          <WaIcon
            name="ic-wa-plus-add-24"
            className="size-[21px] text-[color:var(--wa-text-invert)]"
          />
        </HeaderCircularButton>
      )}
    </div>
  )
}

function HeaderCircularButton({
  children,
  onClick,
  ariaLabel,
  variant = "default",
}: {
  children: React.ReactNode
  onClick?: () => void
  ariaLabel: string
  variant?: "default" | "product"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "pointer-events-auto flex size-[42px] shrink-0 items-center justify-center rounded-full",
        "shadow-[var(--wa-glass-shadow)] backdrop-blur-[20px] active:opacity-70",
        variant === "product"
          ? "bg-[color:var(--wa-surface-product)]"
          : "border-[0.5px] border-[color:var(--wa-glass-border)] bg-[color:var(--wa-glass-bg)]"
      )}
    >
      {children}
    </button>
  )
}
