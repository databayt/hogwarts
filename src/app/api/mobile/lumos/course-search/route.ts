// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { getAllCatalogCourses } from "@/components/lumos/data/catalog/get-all-courses"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { toCourseDto } from "../courses/course-dto"

/** Hard cap on rows per request — the callers ask for 6-18. */
const MAX_COURSE_RESULTS = 24

/**
 * The search sheet's reads — `/api/lumos/course-search` for a bearer token.
 *
 * Same parameters, same cap, same fetcher: `q` for the typeahead, no `q` and
 * an optional `grade` for the sheet's featured shelf. The school comes from
 * the verified token, never from the query.
 *
 * GET /api/mobile/lumos/course-search?locale=ar|en&q=&grade=&page=&perPage=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const params = new URL(request.url).searchParams
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
    const lang = params.get("locale") === "ar" ? "ar" : "en"
    const q = params.get("q")?.trim()

    const { rows, count } = await getAllCatalogCourses(
      { page, perPage, search: q || undefined, grade, lang },
      { schoolId: auth.schoolId }
    )

    return NextResponse.json(
      { rows: rows.map(toCourseDto), count },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("[mobile/lumos/course-search] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
