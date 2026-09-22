// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { loadAllBooks } from "@/components/library/book-list/load"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { toCatalogCardDto } from "../lib/catalog-dto"

/**
 * `/library/books` as data — the same `loadAllBooks` page: newest first,
 * `search` on title or author, `genre`, `grade_level`, 20 a page.
 *
 * GET /api/mobile/library/catalog?page=&search=&genre=&grade_level=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const sp = new URL(request.url).searchParams
    const page = Math.max(1, Number(sp.get("page")) || 1)
    const result = await loadAllBooks(auth.schoolId, {
      page,
      search: sp.get("search")?.trim() ?? "",
      genre: sp.get("genre") ?? "",
      gradeLevel: sp.get("grade_level") ?? "",
    })
    return NextResponse.json({
      data: result.books.map(toCatalogCardDto),
      total: result.totalCount,
      page,
      total_pages: result.totalPages,
      genres: result.genres,
    })
  } catch (error) {
    console.error("[mobile/library/catalog] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
