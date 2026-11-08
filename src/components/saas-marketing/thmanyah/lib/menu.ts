// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import {
  FEATURE_GROUPS,
  SHOWN_FEATURES,
} from "@/components/saas-marketing/features/constants"
import {
  GROUP_LABEL_AR,
  localizeFeature,
} from "@/components/saas-marketing/features/i18n"

/**
 * The homepage menu's mega-menu columns — one per /features tab group, each
 * listing that group's shipped modules and linking to their feature pages.
 *
 * Built on the server and handed to HomeHeader as plain strings: the features
 * catalog (constants.tsx) carries every feature's long-form detail copy, and
 * importing it into the client header would ship all of it.
 */
export interface MenuColumn {
  title: string
  href: string
  links: { label: string; href: string }[]
}

/** Nike keeps a column short enough to scan; the group page has the rest. */
const PER_COLUMN = 6

export function homeMenu(lang: "ar" | "en"): MenuColumn[] {
  const shown = new Map(SHOWN_FEATURES.map((f) => [f.id, f]))
  return FEATURE_GROUPS.map((group) => ({
    title:
      lang === "ar" ? (GROUP_LABEL_AR[group.id] ?? group.label) : group.label,
    href: `/${lang}/features`,
    links: group.ids
      .flatMap((id) => {
        const feature = shown.get(id)
        return feature
          ? [
              {
                label: localizeFeature(feature, lang).title,
                href: `/${lang}/features/${id}`,
              },
            ]
          : []
      })
      .slice(0, PER_COLUMN),
  })).filter((column) => column.links.length > 0)
}
