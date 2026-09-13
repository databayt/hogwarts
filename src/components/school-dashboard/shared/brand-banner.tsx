// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * The green banner the phone opens on in /library, /live and the dashboard's
 * next-action — lifted here so a section that needs one does not paste a
 * fourth copy of `library/hero.tsx`.
 *
 * Same object, same rules as those two files spell out: the ground is the
 * saas-marketing green `#00bc6d`, a BRAND ground that does not invert, and
 * every piece of ink on it is pinned dark (`#050505`) — white on this green
 * measures ~2.5:1. Nothing inside may use `primary-foreground`, which is white
 * in light mode and black in dark: exactly backwards here. 36px corners, the
 * thmanyah face at two weights.
 */
export function BrandBanner({
  eyebrow,
  children,
  actions,
  footer,
  className,
}: {
  /** Small line above the headline — whose money, which class. */
  eyebrow?: ReactNode
  /** The headline itself. Wrap the emphasis in `<strong>`. */
  children: ReactNode
  /** One white pill and at most one ghost pill (`BrandPill`). */
  actions?: ReactNode
  /** Under the actions: a progress bar, a small note. */
  footer?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[36px] bg-[#00bc6d] px-8 py-10 text-[#050505]",
        className
      )}
    >
      {eyebrow ? (
        <p className="mb-2 text-sm text-[#050505]/70">{eyebrow}</p>
      ) : null}
      <div
        className="text-3xl leading-[1.35] font-light text-balance"
        style={{ fontFamily: '"thmanyah sans", sans-serif' }}
      >
        {children}
      </div>
      {actions ? (
        <div className="mt-7 flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
      {footer ? <div className="mt-7">{footer}</div> : null}
    </section>
  )
}

/**
 * The banner's pill. White with dark ink for the one action, a quiet ghost for
 * the alternative — pinned colours, for the reason above, so NOT
 * `buttonVariants()`.
 */
export function brandPillClass(variant: "default" | "ghost" = "default") {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5",
    "text-sm font-medium whitespace-nowrap transition-colors",
    "outline-none focus-visible:ring-2 focus-visible:ring-[#050505]/40",
    variant === "default"
      ? "bg-white text-[#050505] hover:bg-white/90"
      : "text-[#050505]/75 hover:bg-[#050505]/10 hover:text-[#050505]"
  )
}

export function BrandPill({
  href,
  variant = "default",
  children,
}: {
  href: string
  variant?: "default" | "ghost"
  children: ReactNode
}) {
  return (
    <Link href={href} className={brandPillClass(variant)}>
      {children}
    </Link>
  )
}

/**
 * Progress on the green: a dark track at 15% and a dark fill, because the
 * themed `Progress` draws `primary` — which is the wrong ink on this ground in
 * one of the two themes.
 */
export function BrandProgress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-[#050505]/15"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[#050505] transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
