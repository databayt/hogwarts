// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import {
  Activity,
  CalendarPlus,
  ClipboardCheck,
  PlaySquare,
  Settings,
  Table2,
  Video,
  type LucideIcon,
} from "lucide-react"

import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"

import type { LandingSectionProps, LandingViewer } from "./types"

interface GuideProps extends LandingSectionProps {
  viewer: LandingViewer
}

export type Card = { key: string; Icon: LucideIcon; href: string }

/**
 * What YOU can do here — replacing four cards that told every role the same
 * four things about the product.
 *
 * The old set was marketing ("Attendance marks itself", "Only the right
 * people") illustrated with icons borrowed from the lumos set, one of which
 * was a hand holding a cup. None of them were links. A page inside the product
 * is read by someone who has already bought it, so every card here is a real
 * destination, and only the ones this role can actually reach are rendered.
 */
export function LiveRoleGuide({ dictionary, lang, viewer }: GuideProps) {
  const g = dictionary?.landing?.guide
  const cards = cardsFor(viewer, lang)
  if (cards.length === 0) return null

  return (
    <section className="mb-16">
      <h2 className={cn(typographyVariants.cardTitle, "mb-5")}>{g?.title}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ key, Icon, href }) => (
          <Link
            key={key}
            href={href}
            className="hover:border-foreground group rounded-xl border p-5 text-start transition-colors"
          >
            <Icon
              className="text-foreground mb-4 size-6"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h3 className="mb-1.5 text-sm font-semibold">
              {g?.items?.[key as keyof typeof g.items]?.title}
            </h3>
            <p className={typographyVariants.hint}>
              {g?.items?.[key as keyof typeof g.items]?.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function cardsFor(viewer: LandingViewer, lang: string): Card[] {
  const cards: Card[] = []

  cards.push({ key: "sessions", Icon: Table2, href: `/${lang}/live/dashboard` })

  if (viewer.canSchedule) {
    cards.push({
      key: "schedule",
      Icon: CalendarPlus,
      href: `/${lang}/live/schedule`,
    })
  }

  // A student or guardian reaches a class from their own timetable far more
  // often than from this list, so that is the card they get.
  if (!viewer.canSchedule && viewer.canJoin) {
    cards.push({
      key: "timetable",
      Icon: viewer.role === "GUARDIAN" ? ClipboardCheck : Video,
      href:
        viewer.role === "GUARDIAN"
          ? `/${lang}/parent`
          : `/${lang}/timetable`,
    })
  }

  // ACCOUNTANT is excluded from `view_recordings` at the permission layer, so
  // it must not be offered the door either.
  if (viewer.canViewRecordings) {
    cards.push({
      key: "recordings",
      Icon: PlaySquare,
      href: `/${lang}/live/dashboard?status=ended`,
    })
  }

  if (viewer.canConfigure) {
    cards.push({ key: "settings", Icon: Settings, href: `/${lang}/live/settings` })
    cards.push({
      key: "network",
      Icon: Activity,
      href: `/${lang}/live/network-test`,
    })
  }

  return cards.slice(0, 4)
}
