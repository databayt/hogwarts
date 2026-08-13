// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Role } from "@/lib/rbac/types"
import { isRoleIn } from "@/lib/rbac/ui-permissions"
import type { PageNavItem } from "@/components/atom/page-nav"

/** Full access to every settings surface. */
export const LUMOS_ADMIN_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
] as const

/** Teachers reach the Videos surface only — they upload and manage their own. */
export const LUMOS_VIDEO_ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
] as const

/**
 * The managed surfaces, in nav order after the dashboard. Doubles as the
 * allowlist the legacy /lumos/settings redirects validate against.
 */
export const LUMOS_SURFACES = [
  "enrollments",
  "instructors",
  "review",
  "videos",
] as readonly string[]

/** Shape of the slice of the lumos dictionary the tab labels read. */
export interface StreamNavDictionary {
  header?: { dashboard?: string }
  settings?: {
    enrollments?: string
    instructors?: string
    review?: string
    videos?: string
  }
}

/**
 * The single tab strip for the lumos app surfaces.
 *
 * Home and Courses deliberately aren't here: the landing page is reachable
 * from the sidebar / breadcrumb, and the catalog from the landing page's own
 * primary button. What's left is one flat row over the admin surfaces — the
 * settings sub-pages sit alongside the dashboard rather than behind a second
 * inner tab strip.
 *
 * Returns [] for roles with no admin surface, so no empty strip is rendered.
 */
export function getTabsForRole(
  role: Role | null | undefined,
  lang: string,
  d?: StreamNavDictionary,
  pendingReviewCount = 0
): PageNavItem[] {
  const isAdmin = isRoleIn(role, LUMOS_ADMIN_ROLES)
  const canManageVideos = isRoleIn(role, LUMOS_VIDEO_ROLES)

  if (!canManageVideos) return []

  const s = d?.settings

  return [
    {
      name: d?.header?.dashboard || "Dashboard",
      href: `/${lang}/lumos/dashboard`,
    },
    ...(isAdmin
      ? [
          {
            name: s?.enrollments || "Enrollments",
            href: `/${lang}/lumos/enrollments`,
          },
          {
            name: s?.instructors || "Instructors",
            href: `/${lang}/lumos/instructors`,
          },
          {
            name: s?.review || "Review",
            href: `/${lang}/lumos/review`,
            badge: pendingReviewCount,
          },
        ]
      : []),
    {
      name: s?.videos || "Videos",
      href: `/${lang}/lumos/videos`,
    },
  ]
}
