"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

import { WaIcon } from "./wa-icon"

export type IosHeaderMenuItem = {
  id: string
  label: string
  icon: React.ReactNode
  onSelect: () => void
}

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
  /** A glass back disc at the start edge, beside the options button. */
  onExit?: () => void
  exitLabel?: string
  /** What the options button opens; without items it stays a plain button. */
  optionsMenu?: IosHeaderMenuItem[]
  optionsLabel?: string
  /** Title as the large-title collapse draws it: hidden until `collapsed`. */
  collapsingTitle?: string
  /** The page's big title has scrolled under the header. */
  collapsed?: boolean
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
  onExit,
  exitLabel,
  optionsMenu,
  optionsLabel,
  collapsingTitle,
  collapsed = false,
  className,
}: Props) {
  const hasTitle = Boolean(title)
  const [menuOpen, setMenuOpen] = useState(false)
  const hasMenu = Boolean(optionsMenu?.length)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen])
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
      {collapsingTitle !== undefined && (
        <>
          {/* The cloud: runs 28px past the header so the fade finishes below
              the buttons, and only appears once there is content under it. */}
          <div
            aria-hidden
            className={cn(
              "wa-scroll-edge-list pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(100%+28px)] transition-opacity duration-200",
              collapsed ? "opacity-100" : "opacity-0"
            )}
          />
          <p
            aria-hidden={!collapsed}
            className={cn(
              "pointer-events-none absolute start-1/2 bottom-[21px] -translate-x-1/2 text-center text-[17px] leading-none font-semibold tracking-[-0.34px] text-[color:var(--wa-text-primary)] transition-[opacity,transform] duration-200 rtl:translate-x-1/2",
              collapsed ? "opacity-100" : "translate-y-[6px] opacity-0"
            )}
          >
            {collapsingTitle}
          </p>
        </>
      )}
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

      {onExit && (
        <HeaderCircularButton onClick={onExit} ariaLabel={exitLabel ?? "Back"}>
          <WaIcon
            name="ic-wa-chevron-lt-32"
            className="size-[26px] rtl:scale-x-[-1]"
          />
        </HeaderCircularButton>
      )}

      {showOptions && (
        <HeaderCircularButton
          onClick={hasMenu ? () => setMenuOpen(true) : onOptions}
          ariaLabel={optionsLabel ?? "More options"}
          expanded={hasMenu ? menuOpen : undefined}
        >
          <WaIcon name="ic-wa-meetball-24" className="size-[24px]" />
        </HeaderCircularButton>
      )}

      {(onExit || showOptions) && <div className="h-[26px] flex-1" />}

      {hasMenu && menuOpen && (
        <>
          {/* Any tap outside the card closes it, and does nothing else. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="pointer-events-auto fixed inset-0 z-40 cursor-default"
          />
          {/* The reference opens the card over the button that summoned it,
              anchored to the same start edge. */}
          <div
            role="menu"
            aria-label={optionsLabel ?? "More options"}
            className="wa-glass-menu pointer-events-auto absolute start-[8px] top-[calc(env(safe-area-inset-top,0px)+4px)] z-50 flex min-w-[196px] flex-col rounded-[28px] py-[8px]"
          >
            {optionsMenu!.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  item.onSelect()
                }}
                className="flex h-[44px] items-center gap-[14px] px-[24px] text-start text-[17px] leading-none tracking-[-0.34px] text-[color:var(--wa-text-primary)] active:bg-black/5"
              >
                <span className="flex size-[24px] shrink-0 items-center justify-center">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {showCamera && (
        <HeaderCircularButton onClick={onCamera} ariaLabel="Camera">
          <WaIcon name="ic-wa-camera-24" className="size-[24px]" />
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
            className="size-[24px] text-[color:var(--wa-text-invert)]"
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
  expanded,
  variant = "default",
}: {
  children: React.ReactNode
  onClick?: () => void
  ariaLabel: string
  expanded?: boolean
  variant?: "default" | "product"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-haspopup={expanded === undefined ? undefined : "menu"}
      aria-expanded={expanded}
      className={cn(
        // The button exists at two sizes off one component: 48 standing alone
        // as a symbol, 44 everywhere the file's own top toolbar places it, and
        // a top toolbar is what this is. The 42 it carried until now came off
        // a screenshot, back when the node could not be read at all.
        "pointer-events-auto flex size-[44px] shrink-0 items-center justify-center rounded-full",
        variant === "product"
          ? // The compose button is a tinted control, not a clear one: it keeps
            // the brand fill and only borrows the glass depth — which the node
            // casts straight down, so this does not mirror either.
            "bg-[color:var(--wa-surface-product)] shadow-[0_8px_40px_rgba(0,0,0,0.18)] active:opacity-80"
          : "wa-glass-control"
      )}
    >
      {children}
    </button>
  )
}
