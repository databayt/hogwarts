// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { LIBRARY_CONFIG } from "@/components/library/config"

import { authenticate, isAuthError } from "../../../../lib/authenticate"
import { BORROW_SELECT, toBorrowingDto } from "../../../lib/book-dto"

/**
 * Borrow a book — the rules `actions.ts#borrowBook` enforces, in the same
 * order: the reader's active-loan limit, the book's existence inside this
 * school, a copy being free, and no second loan of a book already out to
 * them. The record and the copy count move in one transaction, so a copy is
 * never handed out twice.
 *
 * POST /api/mobile/library/books/:id/borrow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId, userId } = auth
    const { id: bookId } = await params

    const active = await db.borrowRecord.count({
      where: { userId, schoolId, status: "BORROWED" },
    })
    if (active >= LIBRARY_CONFIG.MAX_BOOKS_PER_USER) {
      return NextResponse.json(
        {
          error: "borrow_limit_reached",
          limit: LIBRARY_CONFIG.MAX_BOOKS_PER_USER,
        },
        { status: 409 }
      )
    }

    const book = await db.schoolBook.findFirst({
      where: { id: bookId, schoolId },
      select: { id: true, availableCopies: true },
    })
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }
    if (book.availableCopies <= 0) {
      return NextResponse.json({ error: "no_copies_available" }, { status: 409 })
    }

    const existing = await db.borrowRecord.findFirst({
      where: { bookId, userId, schoolId, status: "BORROWED" },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: "already_borrowed" }, { status: 409 })
    }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + LIBRARY_CONFIG.MAX_BORROW_DAYS)

    const [record] = await db.$transaction([
      db.borrowRecord.create({
        data: { bookId, userId, schoolId, dueDate, status: "BORROWED" },
        select: BORROW_SELECT,
      }),
      db.schoolBook.update({
        where: { id: bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ])

    return NextResponse.json(toBorrowingDto(record), { status: 201 })
  } catch (error) {
    console.error("[mobile/library/books/:id/borrow] POST failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
