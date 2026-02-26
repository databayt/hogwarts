/**
 * Migrate existing QuestionBank records to CatalogQuestion
 *
 * For each QuestionBank record without a catalogQuestionId:
 * 1. Create a CatalogQuestion with contributedSchoolId = schoolId
 * 2. Set visibility = PRIVATE (school's own data)
 * 3. Set catalogQuestionId on the QuestionBank record
 *
 * Usage: npx tsx scripts/migrate-qbank-to-catalog.ts
 *        npx tsx scripts/migrate-qbank-to-catalog.ts --dry-run
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const isDryRun = process.argv.includes("--dry-run")

async function main() {
  console.log(
    isDryRun
      ? "DRY RUN: No changes will be made"
      : "Migrating QuestionBank → CatalogQuestion..."
  )

  // Get all QuestionBank records without a catalog link
  const questions = await prisma.questionBank.findMany({
    where: { catalogQuestionId: null },
    include: {
      subject: {
        select: { catalogSubjectId: true },
      },
    },
  })

  console.log(
    `Found ${questions.length} QuestionBank records without catalogQuestionId`
  )

  if (isDryRun) {
    console.log("Would create CatalogQuestion for each and link them.")
    return
  }

  let migrated = 0
  let failed = 0
  const batchSize = 50

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize)

    await prisma.$transaction(
      async (tx) => {
        for (const q of batch) {
          try {
            // Create CatalogQuestion
            const catalogQuestion = await tx.catalogQuestion.create({
              data: {
                catalogSubjectId:
                  q.subject?.catalogSubjectId ?? q.catalogSubjectId ?? null,
                catalogChapterId: q.catalogChapterId ?? null,
                catalogLessonId: q.catalogLessonId ?? null,
                questionText: q.questionText,
                questionType: q.questionType,
                difficulty: q.difficulty,
                bloomLevel: q.bloomLevel,
                points: q.points,
                options: q.options ?? undefined,
                sampleAnswer: q.sampleAnswer ?? null,
                explanation: q.explanation ?? null,
                tags: q.tags ?? [],
                contributedBy: q.createdBy,
                contributedSchoolId: q.schoolId,
                approvalStatus: "APPROVED",
                visibility: "PRIVATE",
                status: "PUBLISHED",
              },
            })

            // Link QuestionBank to CatalogQuestion
            await tx.questionBank.update({
              where: { id: q.id },
              data: {
                catalogQuestionId: catalogQuestion.id,
                catalogSubjectId:
                  q.subject?.catalogSubjectId ?? q.catalogSubjectId ?? null,
              },
            })

            migrated++
          } catch (error) {
            console.error(
              `Failed to migrate question ${q.id}:`,
              error instanceof Error ? error.message : error
            )
            failed++
          }
        }
      },
      { timeout: 60000 }
    )

    console.log(
      `Progress: ${Math.min(i + batchSize, questions.length)}/${questions.length}`
    )
  }

  console.log(`Migration complete: ${migrated} migrated, ${failed} failed`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
