"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cn } from "@/lib/utils"

import { QuickActions } from "./quick-actions"
import { getDashboardTileActions } from "./quick-actions-config"

/**
 * The role's quick actions as app tiles, with no heading of their own — the
 * tiles carry their labels, and the row reads as the home screen continued.
 *
 * Phones: one full-bleed row of four under today's classes, on the home
 * block's 32px column rhythm, so tiles 3 and 4 sit beneath the cluster's.
 * From `md` up: the same four, dissolved (`contents`) into the dashboard's
 * 8-column app grid beside the calendar widget and the home cluster
 * (content.tsx). It is the ONLY quick-actions section on the school dashboard
 * — the role dashboards' coloured-card copies were removed on 2026-10-15.
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
  const actions = getDashboardTileActions(role, 4)

  if (actions.length === 0) return null

  return (
    <section className={cn("mx-[calc(50%-50vw)] px-4 md:contents", className)}>
      <QuickActions actions={actions} locale={locale} tiles />
    </section>
  )
}
