"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Check } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import { borrowBook, returnBook } from "../actions"

interface Props {
  bookId: string
  userId: string
  schoolId: string
  availableCopies: number
  hasBorrowedBook: boolean
  borrowRecordId?: string
  /** The digital copy. Absent on most catalog rows, which disables Read. */
  digitalFileUrl?: string | null
  dictionary?: Record<string, string>
}

/**
 * The action row at the foot of the card: a quieter pill beside a solid one,
 * the way the reference pairs Sample with Get.
 *
 * Not `<Button>`: every variant that component offers is themed against the
 * page ground, and this row sits on the marketing green. The shapes are
 * written out here rather than bent out of a variant that would invert.
 */

/**
 * Taller and narrower than a standard button, and fully rounded.
 *
 * Measured off the reference: its pills run about 3.2 wide to 1 tall inside a
 * card that is a little over 300pt across. At `h-14` in this column each pill
 * lands near 3.0, which reads as the reference's shape; the `h-11` this had
 * before came out at 3.8 and read as a wide lozenge.
 *
 * Labels are ONE word for the same reason — "Borrow Book" and "Return Book"
 * pushed the pill wide and flattened it further, and the card above already
 * says the noun.
 */
const PILL =
  "inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full px-5 font-semibold transition-colors"

/**
 * The ground under these is the marketing green, so both pills are pinned
 * dark-on-light exactly as `library/hero.tsx` pins its own: white on `#00bc6d`
 * is unreadable, and a token pair would invert in dark mode and lose the
 * contrast the ground was chosen for.
 */
const PRIMARY = "bg-white text-[#050505] hover:bg-white/90 disabled:opacity-50"

/** A darker patch of the same ground — the lesser thing, not a second CTA. */
const SECONDARY = "bg-[#050505]/12 text-[#050505] hover:bg-[#050505]/20"

export default function BorrowBook({
  bookId,
  userId,
  schoolId,
  availableCopies,
  hasBorrowedBook,
  borrowRecordId,
  digitalFileUrl,
  dictionary: lib,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleBorrow = async () => {
    setIsLoading(true)

    try {
      const result = await borrowBook({
        bookId,
        userId,
        schoolId,
      })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(
          result.message || lib?.borrowFailed || "Failed to borrow book"
        )
      }
    } catch {
      toast.error(lib?.unexpectedError || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturn = async () => {
    if (!borrowRecordId) return

    setIsLoading(true)

    try {
      const result = await returnBook({
        borrowRecordId,
        schoolId,
      })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(
          result.message || lib?.returnFailed || "Failed to return book"
        )
      }
    } catch {
      toast.error(lib?.unexpectedError || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const readLabel = lib?.read || "Read"

  /**
   * The reference's Sample pill. `digitalFileUrl` is a real catalog field with
   * no reader behind it yet, so this opens the file itself in a new tab.
   *
   * A book with no digital copy renders the pill DISABLED rather than dropping
   * it: the row is the shape of this card, and a card that is one wide button
   * on most books and two on a few reads as a different component each time.
   * Disabled says "this book has no digital copy", which is true; hiding it
   * says nothing at all.
   */
  const readPill = digitalFileUrl ? (
    <a
      href={digitalFileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(PILL, SECONDARY)}
    >
      <BookOpen className="size-4" />
      {readLabel}
    </a>
  ) : (
    <button
      type="button"
      disabled
      className={cn(PILL, SECONDARY, "opacity-45")}
    >
      <BookOpen className="size-4" />
      {readLabel}
    </button>
  )

  if (hasBorrowedBook) {
    return (
      <div className="space-y-3">
        <p className="inline-flex items-center gap-1.5 text-sm text-[#050505]/80">
          <Check className="size-4" />
          {lib?.borrowedThisBook || "You have borrowed this book"}
        </p>
        <div className="flex gap-3">
          {readPill}
          <button
            type="button"
            onClick={handleReturn}
            disabled={isLoading}
            className={cn(PILL, PRIMARY)}
          >
            {isLoading
              ? lib?.returning || "Returning..."
              : lib?.returnShort || "Return"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      {readPill}
      {availableCopies === 0 ? (
        // The SECONDARY palette, not PRIMARY dimmed: this pill is disabled for
        // its whole life rather than for the length of a request, and a
        // half-faded solid pill reads as broken where an unfilled one reads as
        // nothing to do.
        <button type="button" disabled className={cn(PILL, SECONDARY)}>
          {lib?.unavailable || "Unavailable"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleBorrow}
          disabled={isLoading}
          className={cn(PILL, PRIMARY)}
        >
          {isLoading
            ? lib?.borrowing || "Borrowing..."
            : lib?.borrow || "Borrow"}
        </button>
      )}
    </div>
  )
}
