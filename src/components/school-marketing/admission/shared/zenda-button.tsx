// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * Zenda's EXPLORE pill, for the bilingual marketing pages.
 *
 * The homepage clone gets this effect from `.button-v2` inside the
 * `.zenda-clone` scope, which is English/LTR-only. This is the same button
 * against the unscoped `.zenda-btn*` rules in `school-marketing.css`, so
 * `/admissions` and its siblings can carry it in Arabic too.
 *
 * The nesting is not decorative -- every span is load-bearing:
 *   `_bg`         the purple pill; clips the two wipe panels
 *   `_bg-inner`   the panels themselves; `--index` staggers them
 *   `_inner`      clips the label; `data-text` is what rolls IN on hover
 *   `_text`       the label that rolls OUT
 * Change the shape and the hover silently degrades to nothing.
 *
 * `label` must be a plain string: it is duplicated into `data-text`, which
 * `::after` renders. Anything that isn't text (an icon) goes in `trailing`,
 * which sits outside the rolling label.
 */
export function ZendaButton({
  href,
  label,
  variant = "default",
  trailing,
  className,
}: {
  href: string
  label: string
  variant?: "default" | "alternate"
  trailing?: ReactNode
  className?: string
}) {
  const alt = variant === "alternate"

  return (
    <Link
      href={href}
      className={cn("zenda-btn", alt && "is-alternate", className)}
    >
      <span className={cn("zenda-btn_bg", alt && "is-alternate")}>
        <span
          style={{ "--index": 0 } as CSSProperties}
          className="zenda-btn_bg-inner is-first"
        />
        <span
          style={{ "--index": 1 } as CSSProperties}
          className={cn("zenda-btn_bg-inner is-second", alt && "is-alternate")}
        />
      </span>
      <span data-text={label} className="zenda-btn_inner">
        <span className="zenda-btn_text">
          {label}
          {trailing}
        </span>
      </span>
    </Link>
  )
}

export default ZendaButton
