// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Default Auto-Provision Seed for the Demo School (prebuild)
 *
 * Runs on EVERY Vercel deployment (via the `prebuild` script) against the
 * production demo school. It drives the FULL heavy seed (`seedMain` in
 * ./index.ts) — the same data a real onboarded school gets, unified on the
 * production provisioning pipeline (setupDefaultsForSchool + setupCatalogForSchool).
 *
 * Optimized + build-safe:
 *  - FAST PATH: when the demo is already fully seeded (≥500 students AND
 *    ≥100 classes) it skips the heavy seed entirely and only re-asserts the
 *    critical accounts — a couple of queries, a few seconds.
 *  - SLOW PATH: an empty or partially-seeded demo runs `seedMain`, which is
 *    fully idempotent (per-phase count-guards + upserts) so it resumes only
 *    the missing work and never duplicates rows on re-runs.
 *  - NEVER fails the build: every DB error (Neon quota, cold start, network)
 *    is swallowed and the process exits 0.
 *
 * Usage:
 *   tsx prisma/seeds/ensure-demo.ts        (automatic during `pnpm build`)
 */

// dotenv first — ./index transitively imports the @/lib/db singleton, which
// reads DATABASE_URL at import time. No-op on Vercel (env already injected).
import "dotenv/config"

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import { DEMO_PASSWORD, DEMO_SCHOOL } from "./constants"
import { getDemoSeedStatus, seedMain } from "./index"

const prisma = new PrismaClient()

/**
 * Re-assert the accounts that MUST always exist/stay correct on the demo,
 * even when the heavy seed is skipped. Cheap; runs only on the fast path.
 * - admin@databayt.org must exist (school login for QA + docs).
 * - dev@databayt.org must keep its DEVELOPER role (see .claude/rules/accounts.md
 *   — a bulk updateMany must never strip it; this is a belt-and-suspenders guard).
 */
async function ensureCriticalAccounts(schoolId: string): Promise<void> {
  const admin = await prisma.user.findFirst({
    where: { email: "admin@databayt.org", schoolId },
    select: { id: true },
  })
  if (!admin) {
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10)
    await prisma.user.upsert({
      where: { email_schoolId: { email: "admin@databayt.org", schoolId } },
      update: {},
      create: {
        email: "admin@databayt.org",
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: new Date(),
        schoolId,
      },
    })
    console.log("✅ Admin user restored")
  }

  const dev = await prisma.user.findFirst({
    where: { email: "dev@databayt.org" },
    select: { id: true, role: true },
  })
  if (dev && dev.role !== "DEVELOPER") {
    await prisma.user.update({
      where: { id: dev.id },
      data: { role: "DEVELOPER" },
    })
    console.warn("⚠️ dev@databayt.org DEVELOPER role was corrupted — restored")
  }
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🌱 ENSURE DEMO — Full Auto-Provision Seed")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  try {
    const school = await prisma.school.findUnique({
      where: { domain: DEMO_SCHOOL.domain },
      select: { id: true, name: true },
    })

    if (school) {
      const status = await getDemoSeedStatus(prisma, school.id)

      if (status.fullySeeded) {
        // ── FAST PATH ──────────────────────────────────────────────────
        console.log(
          `✅ Demo already fully seeded: ${school.name} (${status.students} students, ${status.classes} classes)`
        )
        console.log(
          "⏭️  Skipping heavy seed — re-asserting critical accounts only"
        )
        await ensureCriticalAccounts(school.id)
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        console.log("✅ Demo environment verified (fast path)")
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        return
      }

      console.log(
        `⚠️ Demo partially seeded (${status.students} students, ${status.classes} classes) — running full seed to fill gaps`
      )
    } else {
      console.log("⚠️ Demo school missing — running full seed")
    }

    // ── SLOW PATH ────────────────────────────────────────────────────────
    // seedMain is idempotent: per-phase guards + upserts mean already-seeded
    // phases skip cheaply and only missing work runs. Share our connection.
    await seedMain(prisma)

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("✅ Demo environment fully seeded")
    console.log("🌐 URL: https://demo.databayt.org")
    console.log(`📧 Admin: admin@databayt.org / ${DEMO_PASSWORD}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  } catch (error) {
    // Database errors (quota exceeded, connection issues) must NOT fail the
    // build. The app still works; the demo just might not be provisioned.
    console.warn(
      "⚠️ Demo seed skipped (database unavailable):",
      (error as Error).message || error
    )
    console.log("⏭️ Continuing build without demo verification...")
  } finally {
    try {
      await prisma.$disconnect()
    } catch {
      // Ignore disconnect errors
    }
  }
}

// Handle unhandled rejections gracefully — never crash the build.
process.on("unhandledRejection", (reason) => {
  console.warn("⚠️ Unhandled rejection in ensure-demo (ignored):", reason)
})

main().then(() => {
  // Force a clean exit after completion (open connections can hang tsx).
  process.exit(0)
})
