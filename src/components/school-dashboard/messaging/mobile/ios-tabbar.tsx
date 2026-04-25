"use client"

import { cn } from "@/lib/utils"

import { IosHomeIndicator } from "./ios-home-indicator"
import { WaIcon, type WaIconName } from "./wa-icon"

export type IosTabId =
  | "calls"
  | "communities"
  | "chats"
  | "settings"
  | "updates"

export type IosTab = {
  id: IosTabId
  label: string
  icon: WaIconName
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
        "relative flex w-full flex-col items-center px-[23px]",
        "border-t-[0.33px] border-[color:var(--wa-border-panel)]",
        "bg-[color:var(--wa-surface-panel-blur)] backdrop-blur-[25px]",
        className
      )}
    >
      <ul className="flex w-full items-start justify-between pt-[3px] pb-[2px]">
        {tabs.map((tab) => {
          const isActive = tab.id === active
          const color = isActive
            ? "text-[color:var(--wa-text-tabbar-selected)]"
            : "text-[color:var(--wa-text-tabbar)]"
          return (
            <li
              key={tab.id}
              className="relative flex w-[32px] flex-col items-center"
            >
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className="flex w-full flex-col items-center"
              >
                <WaIcon
                  name={tab.icon}
                  className={cn("size-[32px]", color)}
                  tint={false}
                />
                <span
                  className={cn(
                    "text-center text-[10px] leading-none font-medium tracking-[0.05px]",
                    color
                  )}
                >
                  {tab.label}
                </span>
              </button>
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span className="absolute end-[-13px] top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[color:var(--wa-surface-product)] px-[6px] text-[12px] leading-none tracking-[-0.12px] text-[color:var(--wa-text-invert)]">
                  {tab.badge}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <IosHomeIndicator />
    </nav>
  )
}
