// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One-time migration: Link standalone Book rows to CatalogBook entries.
 *
 * For all Book rows where catalogBookId IS NULL:
 * 1. Match to existing CatalogBook by title+author
 * 2. If matched → set Book.catalogBookId, create SchoolBookSelection
 * 3. If no match → create new CatalogBook (APPROVED + PUBLISHED), then link
 *
 * Usage: npx tsx scripts/migrate-books-to-catalog.ts [--dry-run]
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0621-\u064A-]/g, "")
    .replace(/-+/g, "-")
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run")

  if (isDryRun) {
    console.log("🔍 DRY RUN — no changes will be made\n")
  }

  // Find all standalone books (no catalog link)
  const standaloneBooks = await prisma.book.findMany({
    where: { catalogBookId: null },
    select: {
      id: true,
      title: true,
      author: true,
      genre: true,
      description: true,
      summary: true,
      coverUrl: true,
      coverColor: true,
      rating: true,
      videoUrl: true,
      isbn: true,
      publisher: true,
      publicationYear: true,
      language: true,
      pageCount: true,
      gradeLevel: true,
      schoolId: true,
    },
  })

  console.log(
    `Found ${standaloneBooks.length} standalone books (no catalogBookId)\n`
  )

  let matched = 0
  let created = 0
  let skipped = 0

  for (const book of standaloneBooks) {
    // Try to match to existing CatalogBook
    const catalogBook = await prisma.catalogBook.findFirst({
      where: { title: book.title, author: book.author },
    })

    if (catalogBook) {
      console.log(`  ✅ MATCH: "${book.title}" → CatalogBook ${catalogBook.id}`)

      if (!isDryRun) {
        // Link the book
        await prisma.book.update({
          where: { id: book.id },
          data: { catalogBookId: catalogBook.id },
        })

        // Ensure SchoolBookSelection exists
        const existingSelection = await prisma.schoolBookSelection.findFirst({
          where: { schoolId: book.schoolId, catalogBookId: catalogBook.id },
        })

        if (!existingSelection) {
          await prisma.schoolBookSelection.create({
            data: {
              schoolId: book.schoolId,
              catalogBookId: catalogBook.id,
              totalCopies: 1,
              availableCopies: 1,
              isActive: true,
            },
          })
        }

        // Update usage count
        const usageCount = await prisma.schoolBookSelection.count({
          where: { catalogBookId: catalogBook.id },
        })
        await prisma.catalogBook.update({
          where: { id: catalogBook.id },
          data: { usageCount },
        })
      }

      matched++
    } else {
      // Create new CatalogBook from standalone book data
      const slug =
        slugify(book.title) +
        "-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 6)

      console.log(
        `  🆕 CREATE: "${book.title}" → new CatalogBook (slug: ${slug})`
      )

      if (!isDryRun) {
        const newCatalogBook = await prisma.catalogBook.create({
          data: {
            title: book.title,
            slug,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            description: book.description || null,
            summary: book.summary || null,
            coverUrl: book.coverUrl || null,
            coverColor: book.coverColor,
            rating: book.rating,
            videoUrl: book.videoUrl,
            publisher: book.publisher,
            publicationYear: book.publicationYear,
            language: book.language || "ar",
            pageCount: book.pageCount,
            gradeLevel: book.gradeLevel,
            approvalStatus: "APPROVED",
            status: "PUBLISHED",
            visibility: "PUBLIC",
            contributedSchoolId: book.schoolId,
          },
        })

        // Link the book
        await prisma.book.update({
          where: { id: book.id },
          data: { catalogBookId: newCatalogBook.id },
        })

        // Create SchoolBookSelection
        await prisma.schoolBookSelection.create({
          data: {
            schoolId: book.schoolId,
            catalogBookId: newCatalogBook.id,
            totalCopies: 1,
            availableCopies: 1,
            isActive: true,
          },
        })

        await prisma.catalogBook.update({
          where: { id: newCatalogBook.id },
          data: { usageCount: 1 },
        })
      }

      created++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`  Matched to existing catalog: ${matched}`)
  console.log(`  Created new catalog entries: ${created}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Total processed: ${standaloneBooks.length}`)

  if (isDryRun) {
    console.log(`\n💡 Run without --dry-run to apply changes`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error("Migration failed:", e)
  prisma.$disconnect()
  process.exit(1)
})
