// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { LIBRARY_CONFIG } from "@/components/library/config"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { BOOK_SELECT, toBookDto } from "../lib/book-dto"

/**
 * Mobile Library API — the school's shelves.
 *
 * The web library reads these rows through server actions
 * (`components/library/actions.ts`); a phone cannot call one, so this is the
 * same `SchoolBook` table behind HTTP, scoped to the token's school.
 *
 * GET /api/mobile/library/books?category=&search=&page=&limit=
 *
 * `category` matches the book's genre, which is what the web's shelves are
 * grouped by ("Poetry", "كتب أدبية"). `search` looks in the title and the
 * author, the two things a reader types.
 */
const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId } = auth

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")?.trim() || undefined
    const search = searchParams.get("search")?.trim() || undefined

    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const requested = Number(searchParams.get("limit"))
    const perPage =
      Number.isFinite(requested) && requested > 0
        ? Math.min(Math.trunc(requested), MAX_LIMIT)
        : LIBRARY_CONFIG.BOOKS_PER_PAGE

    const where = {
      schoolId,
      ...(category ? { genre: { equals: category, mode: "insensitive" as const } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { author: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [total, books] = await Promise.all([
      db.schoolBook.count({ where }),
      db.schoolBook.findMany({
        where,
        select: BOOK_SELECT,
        // Newest first, as the web's "أحدث الكتب" shelf reads.
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ])

    return NextResponse.json({
      data: books.map(toBookDto),
      total,
      page,
      per_page: perPage,
    })
  } catch (error) {
    console.error("[mobile/library/books] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
