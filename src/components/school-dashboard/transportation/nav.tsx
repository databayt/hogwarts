// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import {
  getDictionary,
  type Dictionary,
} from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

type TransportationDictionary = Dictionary["transportation"]

/**
 * Section heading + tab strip for the transportation ops surfaces.
 *
 * Rendered from the `(app)` route-group layout rather than from
 * transportation/layout.tsx, so /transportation itself keeps its landing hero
 * without dashboard chrome stacked on top of it — the same split lumos uses.
 *
 * The tab list mirrors each page's own `ALLOWED_ROLES` gate exactly. A tab a
 * role can't open must not be shown: the page would only redirect them back to
 * /dashboard, which reads as a broken link.
 */
const OPS_ROLES = ["DEVELOPER", "ADMIN", "STAFF"]
const TRIP_ROLES = [...OPS_ROLES, "TEACHER"]
const FEE_ROLES = ["DEVELOPER", "ADMIN", "ACCOUNTANT"]
const SETTINGS_ROLES = ["DEVELOPER", "ADMIN"]

export function getTransportationTabs(
  role: string,
  lang: string,
  t?: TransportationDictionary
): PageNavItem[] {
  const nav = t?.nav
  const base = `/${lang}/transportation`
  const tabs: PageNavItem[] = []

  if (OPS_ROLES.includes(role)) {
    tabs.push(
      { name: nav?.overview || "Overview", href: `${base}/dashboard` },
      { name: nav?.vehicles || "Vehicles", href: `${base}/vehicles` },
      { name: nav?.routes || "Routes", href: `${base}/routes` },
      { name: nav?.drivers || "Drivers", href: `${base}/drivers` },
      { name: nav?.assignments || "Assignments", href: `${base}/assignments` }
    )
  }

  if (TRIP_ROLES.includes(role)) {
    tabs.push({ name: nav?.trips || "Trips", href: `${base}/trips` })
  }

  if (OPS_ROLES.includes(role)) {
    tabs.push({ name: nav?.reports || "Reports", href: `${base}/reports` })
  }

  if (FEE_ROLES.includes(role)) {
    tabs.push({
      name: t?.navAux?.transportFees || t?.fees?.title || "Transport fees",
      href: `${base}/fees`,
    })
  }

  if (SETTINGS_ROLES.includes(role)) {
    tabs.push({ name: nav?.settings || "Settings", href: `${base}/settings` })
  }

  return tabs
}

export async function TransportationSectionNav({ lang }: { lang: string }) {
  const [dictionary, session] = await Promise.all([
    getDictionary(lang as Locale),
    auth(),
  ])

  const t = dictionary?.transportation
  const role = session?.user?.role ?? ""
  const pages = getTransportationTabs(role, lang, t)

  return (
    <>
      <PageHeadingSetter title={t?.title || "Transportation"} />
      {pages.length > 0 && <PageNav pages={pages} className="print:hidden" />}
    </>
  )
}
