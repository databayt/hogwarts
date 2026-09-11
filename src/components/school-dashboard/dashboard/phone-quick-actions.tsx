"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { SectionHeading } from "./section-heading"

/**
 * The role's four quick actions, hoisted to the top of the PHONE dashboard.
 *
 * Every role's own dashboard already renders this section, but four screens
 * down, under the charts — which on a phone means nobody reaches it. Here it
 * sits under the day timetable, or directly under the next-action banner on a
 * day with no classes, so the top of the phone dashboard reads: what today is
 * (home block) → the one thing to do (next-action) → today's classes → the four
 * places you go most (this). Each role dashboard's
 * copy is `hidden md:block` for exactly this reason; if you delete this
 * component, take that class off all seven or the section vanishes on phones.
 *
 * No ground of its own: the tiles carry their own artwork, and a muted band
 * behind them was a second tinted rectangle under a page that already has the
 * green banner. The heading and the row read as a section without one.
 *
 * It bleeds to the viewport edges and pays 16px back as inner padding — the
 * home block's exact geometry, because this row is that block's grid continued.
 * Four columns at the block's 32px gap put tiles 3 and 4 directly beneath the
 * cluster's tiles, which is the relationship the Android home screen has
 * between its widget row and the 4-up rows under it. Symmetric, so it needs no
 * logical-property mirroring under RTL, and safe below `md`, where the sidebar
 * is off-canvas and the content really is the full viewport; the section is
 * hidden from `md` up, where each role dashboard renders its own copy.
 */
export function PhoneQuickActions({
  role,
  locale,
  className,
}: {
  role: string
  locale: string
  className?: string
}) {
  const { dictionary } = useDictionary()
  const dict = dictionary?.school?.dashboard?.quickActionsSection
  const actions = getQuickActionsByRole(role)

  if (actions.length === 0) return null

  return (
    <section className={cn("mx-[calc(50%-50vw)] px-4 md:hidden", className)}>
      <SectionHeading title={dict?.title || "Quick Actions"} />
      <QuickActions actions={actions} locale={locale} />
    </section>
  )
}
