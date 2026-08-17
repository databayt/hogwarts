// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { CatalogCourseType } from "@/components/lumos/data/catalog/get-all-courses"

/**
 * Browser-side reader for the school's course catalog.
 *
 * Every client-side course read on `/lumos/courses` — the search typeahead,
 * the Explore dropdown's featured cards, and the grid's "See More" — goes
 * through this one GET. It is NOT a server action on purpose: auth() rotates
 * the session cookie inside action requests, so each action response ships a
 * full RSC re-render of the page (~1MB). See the route handler for the detail.
 *
 * The type import is erased at compile time, so importing the shape from the
 * server-only fetcher does not pull it into the client bundle.
 */
export interface CourseSearchResult {
  rows: CatalogCourseType[]
  count: number
}

export async function fetchCatalogCourses(params: {
  q?: string
  page?: number
  perPage?: number
  /** Grade level to browse within; ignored by the server when `q` is set. */
  grade?: number
  lang: string
  signal?: AbortSignal
}): Promise<CourseSearchResult> {
  const qs = new URLSearchParams({ locale: params.lang === "ar" ? "ar" : "en" })
  if (params.q) qs.set("q", params.q)
  if (params.page) qs.set("page", String(params.page))
  if (params.perPage) qs.set("perPage", String(params.perPage))
  if (params.grade) qs.set("grade", String(params.grade))

  const res = await fetch(`/api/lumos/course-search?${qs.toString()}`, {
    signal: params.signal,
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`course-search failed: ${res.status}`)
  }
  return (await res.json()) as CourseSearchResult
}
