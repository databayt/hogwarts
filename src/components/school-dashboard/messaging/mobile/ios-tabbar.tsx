"use client"

import { cn } from "@/lib/utils"

import { WaIcon, type WaIconName } from "./wa-icon"

export type IosTabId =
  | "updates"
  | "calls"
  | "communities"
  | "chats"
  | "settings"

export type IosTab = {
  id: IosTabId
  label: string
  /** Outline glyph, drawn while the tab is not the current one. */
  icon: WaIconName
  /** Solid glyph, drawn while the tab is current. */
  iconActive: WaIconName
  badge?: number
}

type Props = {
  tabs: IosTab[]
  active: IosTabId
  onChange: (id: IosTabId) => void
  className?: string
}

export function IosTabbar({ tabs, active, onChange, className }: Props) {
  return (
    <nav
      aria-label="Main tabs"
      className={cn(
        // Liquid glass: a capsule floating clear of the screen edges, with the
        // list scrolling beneath it rather than stopping at a bar. The 25px
        // gutter and floor are node 5:596's own padding; the max() keeps the
        // capsule off a real home indicator, which the node never sees.
        "pointer-events-none relative flex w-full flex-col items-center px-[25px]",
        "pb-[max(25px,calc(env(safe-area-inset-bottom,0px)+8px))]",
        className
      )}
    >
      <ul
        className={cn(
          // 54px cells inside 4px of padding is the node's 62px bar, and a
          // 296 radius on 62 is simply a capsule.
          "pointer-events-auto flex w-full items-center justify-between rounded-full p-[4px]",
          "wa-glass-tabbar"
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active
          const color = isActive
            ? "text-[color:var(--wa-text-tabbar-selected)]"
            : "text-[color:var(--wa-text-tabbar)]"
          return (
            <li key={tab.id} className="relative flex flex-1 justify-center">
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  // The selected tab sits in its own recessed pill. In the
                  // node that pill is the whole 54px cell, capsule-cut like
                  // the bar around it — not a smaller rounded patch inside.
                  // Icon over word, the way a labelled iOS tab bar stacks.
                  // The node sets 5px between the glyph box and the label's
                  // cap; the label's own half-leading already supplies ~3 of
                  // them, so the flex gap carries the remaining 2.
                  "flex h-[54px] w-full flex-col items-center justify-center gap-[2px] rounded-full",
                  color,
                  isActive && "bg-[color:var(--wa-glass-inner)]"
                )}
              >
                <span className="relative flex items-center justify-center">
                  {/* Masked, not a raw <img>: the icons have to take the
                      selected/unselected colour rather than render flat black. */}
                  <WaIcon
                    name={isActive ? tab.iconActive : tab.icon}
                    className="size-[26px]"
                  />
                  {typeof tab.badge === "number" && tab.badge > 0 && (
                    <span className="absolute start-[15px] top-[-5px] flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[color:var(--wa-surface-product)] px-[4px] text-[11px] leading-none tracking-[-0.12px] text-[color:var(--wa-text-invert)]">
                      {tab.badge}
                    </span>
                  )}
                </span>
                {/* The node's own CTA/Tabbar style: 10px at weight 500. Its
                    0.5px tracking is left off — Arabic is cursive, and letter
                    spacing pulls the joins apart. */}
                <span className="max-w-full truncate px-[2px] text-[10px] leading-[13px] font-medium tracking-[-0.06px]">
                  {tab.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
