// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"

import { getAllCatalogCourses } from "@/components/lumos/data/catalog/get-all-courses"

/** Hard cap on rows per request — the callers ask for 6-12. */
const MAX_COURSE_RESULTS = 24

/**
 * GET /api/lumos/course-search?q=&page=&perPage=&grade=&locale=
 *
 * The one data endpoint behind every client-side read on the courses page:
 * the search bar's typeahead, the Explore dropdown's featured thumbnails, and
 * the grid's "See More". Deliberately a route handler and NOT a server action:
 * auth() rotates the session cookie inside action requests, which makes Next
 * flag the action as revalidated and ship a full RSC re-render of the current
 * page (~1MB) with every response — unacceptable for a per-keystroke read.
 * As a GET returning JSON, a page of courses costs a few KB.
 *
 * Tenant scope and authorization live entirely in `getAllCatalogCourses`,
 * which resolves `schoolId` from the request's tenant context and never takes
 * it as an argument.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const params = req.nextUrl.searchParams

  const perPageParam = Number(params.get("perPage"))
  const perPage =
    Number.isFinite(perPageParam) && perPageParam > 0
      ? Math.min(perPageParam, MAX_COURSE_RESULTS)
      : 12

  const pageParam = Number(params.get("page"))
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const gradeParam = Number(params.get("grade"))
  const grade =
    Number.isFinite(gradeParam) && gradeParam > 0 ? gradeParam : undefined

  const localeParam = params.get("locale")
  const lang = localeParam === "ar" ? "ar" : "en"

  const q = params.get("q")?.trim()

  const { rows, count } = await getAllCatalogCourses({
    page,
    perPage,
    search: q || undefined,
    grade,
    lang,
  })

  return NextResponse.json(
    { rows, count },
    { headers: { "Cache-Control": "no-store" } }
  )
}
