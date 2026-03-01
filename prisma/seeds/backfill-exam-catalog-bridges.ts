/**
 * Backfill catalogSubjectId on existing Exam records
 *
 * Joins Exam.subjectId -> Subject.catalogSubjectId and batch updates
 * exams that are missing their catalog bridge FK. Idempotent.
 *
 * Usage:
 *   pnpm db:seed:single backfill-exam-catalog-bridges
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const BATCH_SIZE = 100

export async function backfillExamCatalogBridges() {
  console.log("\n--- Backfill Exam Catalog Bridges ---")

  // Find all exams missing catalogSubjectId where the subject has one
  const examsToUpdate = await prisma.exam.findMany({
    where: {
      catalogSubjectId: null,
      subject: {
        catalogSubjectId: { not: null },
      },
    },
    select: {
      id: true,
      subject: {
        select: { catalogSubjectId: true },
      },
    },
  })

  if (examsToUpdate.length === 0) {
    console.log("  No exams need backfilling.")
    return
  }

  console.log(`  Found ${examsToUpdate.length} exams to backfill`)

  let updated = 0
  for (let i = 0; i < examsToUpdate.length; i += BATCH_SIZE) {
    const batch = examsToUpdate.slice(i, i + BATCH_SIZE)

    await prisma.$transaction(
      batch.map((exam) =>
        prisma.exam.update({
          where: { id: exam.id },
          data: { catalogSubjectId: exam.subject.catalogSubjectId },
        })
      )
    )

    updated += batch.length
    console.log(`  Updated ${updated}/${examsToUpdate.length} exams`)
  }

  console.log(`  Backfill complete: ${updated} exams updated`)
}

// Direct execution
if (require.main === module) {
  backfillExamCatalogBridges()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e)
      prisma.$disconnect()
      process.exit(1)
    })
}
