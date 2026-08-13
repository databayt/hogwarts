// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Backfill shadow Applications for pre-unification students.
 *
 * `content/docs-en/admission.mdx` ("Student intake — four channels, one
 * pipeline") promises every student is born from an Application tagged with
 * the channel it came through, and `AdmissionChannel.LEGACY_BACKFILL` exists
 * for exactly this case — but nothing ever wrote it. Any student created
 * before the four intake paths were unified (and every student written by a
 * seed or an ops script) has `applicationId = NULL`, which downstream code
 * already reads as if it could not happen: `deriveIsSelfOnboarded` in
 * listings/students/actions.ts keys off `student.application.channel`.
 *
 * This script only closes the missing LINK. It deliberately does NOT run the
 * other eleven steps of `provisionStudent` — these students already have their
 * login, student code, year level, guardians and fee assignments; re-running
 * the core would double-provision them.
 *
 * Usage:
 *   npx tsx scripts/backfill-legacy-applications.ts              # dry run (default)
 *   npx tsx scripts/backfill-legacy-applications.ts --school ID  # scope to one tenant
 *   npx tsx scripts/backfill-legacy-applications.ts --execute    # actually write
 *
 * Dry run is the default on purpose: this writes one Application per orphaned
 * student, which on a seeded demo school is ~1000 rows.
 */

import { PrismaClient } from "@prisma/client"

import { ensureDirectAdmitApplication } from "../src/lib/system-campaign"

const prisma = new PrismaClient()

/**
 * Batched rather than one big transaction: Neon is serverless, and holding a
 * transaction open across hundreds of rows risks pool exhaustion and a timeout
 * that rolls back everything. Batching bounds the blast radius and lets
 * progress persist if a later batch fails.
 */
const BATCH_SIZE = 50

interface Args {
  execute: boolean
  schoolId: string | null
}

function parseArgs(argv: string[]): Args {
  const schoolFlag = argv.indexOf("--school")
  return {
    execute: argv.includes("--execute"),
    schoolId: schoolFlag !== -1 ? (argv[schoolFlag + 1] ?? null) : null,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const schools = await prisma.school.findMany({
    where: args.schoolId ? { id: args.schoolId } : {},
    select: { id: true, name: true, domain: true },
    orderBy: { createdAt: "asc" },
  })

  if (schools.length === 0) {
    console.log(
      args.schoolId ? `No school with id ${args.schoolId}.` : "No schools."
    )
    return
  }

  console.log(
    args.execute
      ? `EXECUTING against ${schools.length} school(s) — this writes rows.`
      : `DRY RUN over ${schools.length} school(s) — nothing will be written. Pass --execute to apply.`
  )

  let totalOrphans = 0
  let totalLinked = 0
  let totalFailed = 0

  for (const school of schools) {
    // A draft from the admin wizard is legitimately Application-less until
    // completeStudentWizard runs provisionStudent, so it is NOT an orphan.
    // Drafts are exactly the rows carrying a non-null wizardStep.
    const orphans = await prisma.student.findMany({
      where: { schoolId: school.id, applicationId: null, wizardStep: null },
      select: {
        id: true,
        studentId: true,
        grNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        nationality: true,
        email: true,
        mobileNumber: true,
        currentAddress: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        userId: true,
        lang: true,
      },
      orderBy: { createdAt: "asc" },
    })

    if (orphans.length === 0) continue

    totalOrphans += orphans.length
    const label = school.domain ?? school.name ?? school.id
    console.log(`\n${label}: ${orphans.length} student(s) with no Application`)

    if (!args.execute) {
      for (const s of orphans.slice(0, 3)) {
        console.log(
          `  e.g. ${s.studentId ?? s.grNumber ?? s.id}  ${s.firstName} ${s.lastName}`
        )
      }
      if (orphans.length > 3)
        console.log(`  ... and ${orphans.length - 3} more`)
      continue
    }

    for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
      const batch = orphans.slice(i, i + BATCH_SIZE)
      try {
        await prisma.$transaction(
          async (tx) => {
            for (const student of batch) {
              const applicationId = await ensureDirectAdmitApplication(
                tx,
                {
                  schoolId: school.id,
                  firstName: student.firstName,
                  middleName: student.middleName,
                  lastName: student.lastName,
                  dateOfBirth: student.dateOfBirth,
                  gender: student.gender,
                  nationality: student.nationality,
                  email: student.email,
                  phone: student.mobileNumber,
                  address: student.currentAddress,
                  city: student.city,
                  state: student.state,
                  postalCode: student.postalCode,
                  country: student.country,
                  userId: student.userId,
                  lang: student.lang,
                },
                "LEGACY_BACKFILL",
                student.studentId ?? student.grNumber ?? student.id
              )

              await tx.student.update({
                where: { id: student.id },
                data: { applicationId },
              })
            }
          },
          { timeout: 60000 }
        )
        totalLinked += batch.length
        console.log(
          `  linked ${Math.min(i + BATCH_SIZE, orphans.length)}/${orphans.length}`
        )
      } catch (error) {
        totalFailed += batch.length
        console.error(
          `  batch ${i}-${i + batch.length} FAILED:`,
          error instanceof Error ? error.message : error
        )
      }
    }
  }

  console.log(
    `\n${totalOrphans} orphaned student(s) found across ${schools.length} school(s).`
  )
  if (args.execute) {
    console.log(`linked: ${totalLinked}   failed: ${totalFailed}`)
    // Idempotent by construction: the `applicationId: null` filter plus the
    // @unique on Student.applicationId mean a re-run only picks up whatever is
    // still unlinked, and can never double-link a student.
    if (totalFailed > 0) {
      console.log("Re-run to retry the failed batches.")
      process.exitCode = 1
    }
  } else {
    console.log("Dry run — nothing written. Re-run with --execute to apply.")
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
