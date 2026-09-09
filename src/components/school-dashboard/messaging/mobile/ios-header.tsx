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
        "pointer-events-none relative flex w-full items-end justify-end gap-[14px] px-[16px] pb-[8px]",
        "h-[calc(env(safe-area-inset-top,0px)+56px)]",
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
              className="size-[22px]"
            />
          </HeaderCircularButton>
          <div className="h-[26px] flex-1" />
        </>
      )}

      {showCamera && (
        <HeaderCircularButton onClick={onCamera} ariaLabel="Camera">
          <WaIcon
            name="ic-wa-camera-24"
            className="size-[22px]"
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
        variant === "product"
          ? // The compose button is a tinted control, not a clear one: it keeps
            // the brand fill and only borrows the glass depth.
            "bg-[color:var(--wa-surface-product)] shadow-[3px_6px_16px_rgba(0,0,0,0.18)] active:opacity-80"
          : "wa-glass-control"
      )}
    >
      {children}
    </button>
  )
}
