// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Which guide is about the dashboard page someone is on — shared by the
 * server (the full index) and the panel (`support-routes.json`). A route
 * matches its page and the pages under it; when several guides share a page
 * (/live is both joining and teaching a class), the one that lists this
 * role first wins, so a teacher gets the teaching guide and a student the
 * joining one.
 */
export interface RouteEntry {
  slug: string
  routes?: string[]
  roles?: string[]
}

/** The path without its locale: `/ar/attendance/take` → `/attendance/take`. */
export const appPath = (pathname: string) =>
  pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/"

export function pageGuide<T extends RouteEntry>(
  entries: readonly T[],
  pathname: string | undefined,
  role?: string
): T | undefined {
  if (!pathname) return undefined
  const path = appPath(pathname)
  const hits = entries.filter((e) =>
    e.routes?.some((r) => path === r || path.startsWith(`${r}/`))
  )
  if (!hits.length || !role) return hits[0]
  const rank = (e: T) => {
    const i = e.roles?.indexOf(role) ?? -1
    return i === -1 ? 99 : i
  }
  return [...hits].sort((a, b) => rank(a) - rank(b))[0]
}
