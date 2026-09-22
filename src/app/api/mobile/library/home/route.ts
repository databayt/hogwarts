// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { loadLibraryHome } from "@/components/library/load"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { langOf, toCatalogCardDto } from "../lib/catalog-dto"

/**
 * `/library` as data — the same `loadLibraryHome` the page renders, so the
 * phone's featured book and four shelves hold the page's books, in the page's
 * order and the reader's language.
 *
 * GET /api/mobile/library/home?lang=ar|en
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const home = await loadLibraryHome(auth.schoolId, langOf(request))
    return NextResponse.json({
      total: home.books.length,
      featured: home.featuredBook
        ? {
            ...toCatalogCardDto(home.featuredBook),
            description: home.featuredDescription,
          }
        : null,
      latest: home.latestBooks.map(toCatalogCardDto),
      featured_shelf: home.featuredBooks.map(toCatalogCardDto),
      literature: home.literatureBooks.map(toCatalogCardDto),
      science: home.scienceBooks.map(toCatalogCardDto),
    })
  } catch (error) {
    console.error("[mobile/library/home] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
