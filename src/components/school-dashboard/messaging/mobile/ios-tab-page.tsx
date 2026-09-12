"use client"

import { cn } from "@/lib/utils"

import { IosHeader } from "./ios-header"

type Props = {
  title: string
  children: React.ReactNode
  /** Shown under the title, before the first section. */
  subheader?: React.ReactNode
  className?: string
}

/**
 * The scaffold every tab page outside Chats shares: a floating header, a big
 * title, and one scroller that runs under both the header and the tab bar.
 *
 * The Figma community file draws these screens with a solid bar and a labelled
 * tab bar, which is the previous WhatsApp design. This app is already on the
 * liquid-glass one, so the structure comes from the file and the chrome stays
 * ours — the header here is the same floating `IosHeader` the chat list uses.
 */
export function IosTabPage({ title, children, subheader, className }: Props) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden bg-[color:var(--wa-surface-primary)]",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 z-20">
        <IosHeader />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain pt-[calc(env(safe-area-inset-top,0px)+56px)] pb-[calc(env(safe-area-inset-bottom,0px)+96px)]">
        <h1 className="px-[16px] pt-[18px] pb-[14px] text-[28px] leading-none font-bold tracking-[-1.1px] text-[color:var(--wa-text-primary)]">
          {title}
        </h1>
        {subheader}
        {children}
      </div>
    </div>
  )
}

/** The bold run-in heading above each section of a tab page. */
export function IosSectionHeading({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2
      className={cn(
        "px-[16px] pt-[18px] pb-[8px] text-[17px] leading-[22px] font-semibold tracking-[-0.34px] text-[color:var(--wa-text-primary)]",
        className
      )}
    >
      {children}
    </h2>
  )
}

/** Centred placeholder for a page with nothing in it yet. */
export function IosTabEmpty({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-[10px] px-[32px] pt-[64px] text-center">
      <p className="text-[20px] leading-[26px] font-semibold tracking-[-0.4px] text-[color:var(--wa-text-primary)]">
        {title}
      </p>
      <p className="text-[15px] leading-[21px] text-[color:var(--wa-text-secondary)]">
        {body}
      </p>
      {children}
    </div>
  )
}
