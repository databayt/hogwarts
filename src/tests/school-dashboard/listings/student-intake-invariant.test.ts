// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Intake invariant: every student is born from an Application.
 *
 * `content/docs-en/admission.mdx` ("Student intake — four channels, one
 * pipeline") promises that a student can enter four ways and that all four
 * funnel through `provisionStudent`, which mints (or reuses) an Application,
 * tags it with an `AdmissionChannel`, and links it via `Student.applicationId`.
 * Downstream code already banks on it — `deriveIsSelfOnboarded` in
 * `listings/students/actions.ts` reads `student.application.channel` and gets
 * `undefined` for any student created behind the core's back.
 *
 * `eslint.config.mjs` enforces this with `no-restricted-syntax`. This test is
 * the backstop for the two ways lint can be defeated: an inline
 * `eslint-disable`, or the config drifting. It shares ONE allowlist with the
 * lint rule (imported below) so the two cannot disagree.
 */
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { STUDENT_CREATE_ALLOWLIST } from "../../../../eslint.config.mjs"

const REPO_ROOT = path.resolve(__dirname, "../../../..")

/** `db.student.create(` / `tx.student.upsert(` / `prisma.student.createMany(` */
const DIRECT_CREATE = /\.student\.(create|upsert|createMany)\s*\(/

/**
 * Block/line comments are stripped first: several files document the core's
 * API with `db.student.create({ ... })` inside a JSDoc @example (see
 * `src/components/form/actions.ts`, `src/lib/spotlight-cache.ts`). ESLint works
 * on the AST and never sees those; a naive grep would flag them.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
}

function globToRegExp(glob: string): RegExp {
  // Escape regex metacharacters EXCEPT `*`, then expand the two glob forms in
  // a single pass. Deliberately no placeholder substitution: the first version
  // parked `**` on a sentinel character between passes, that sentinel was a
  // literal NUL byte, and git consequently stored this whole file as binary --
  // undiffable and unreviewable.
  const body = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*|\*/g, (match) => (match === "**" ? ".*" : "[^/]*"))
  return new RegExp(`^${body}$`)
}

const ALLOWED = STUDENT_CREATE_ALLOWLIST.map(globToRegExp)

function isAllowed(relPath: string): boolean {
  return ALLOWED.some((re) => re.test(relPath))
}

function trackedFiles(...patterns: string[]): string[] {
  // `git ls-files` rather than a directory walk: it respects .gitignore, so
  // node_modules / .next / build output never enter the scan.
  return execFileSync("git", ["ls-files", "-z", ...patterns], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })
    .split("\0")
    .filter(Boolean)
}

describe("student intake invariant", () => {
  it("only provisionStudent (and declared exceptions) creates Student rows", () => {
    const tracked = trackedFiles("*.ts", "*.tsx")

    // Sanity: if the listing ever comes back tiny, the scan is silently
    // passing on nothing. Fail loudly instead.
    expect(tracked.length).toBeGreaterThan(500)

    const violations: string[] = []

    for (const relPath of tracked) {
      if (isAllowed(relPath)) continue
      // `git ls-files` lists the INDEX; a file another session deleted from the
      // working tree but has not yet committed is still tracked and would throw
      // ENOENT here, failing the invariant for a reason unrelated to it.
      const absPath = path.join(REPO_ROOT, relPath)
      if (!fs.existsSync(absPath)) continue
      const source = fs.readFileSync(absPath, "utf8")
      if (!DIRECT_CREATE.test(source)) continue

      stripComments(source)
        .split("\n")
        .forEach((line, i) => {
          if (DIRECT_CREATE.test(line)) violations.push(`${relPath}:${i + 1}`)
        })
    }

    expect(
      violations,
      `These create Student rows outside provisionStudent, so the students ` +
        `they make have no Application, no channel, no student code and no ` +
        `fee assignments:\n  ${violations.join("\n  ")}\n\n` +
        `Call provisionStudent() from @/lib/student-provisioning instead. If ` +
        `it is a genuine exception, add it to STUDENT_CREATE_ALLOWLIST in ` +
        `eslint.config.mjs with a comment saying why.`
    ).toEqual([])
  })

  it("every allowlist entry still matches a tracked file", () => {
    // A stale entry silently widens the hole — e.g. a file gets renamed and
    // the allowlist keeps exempting a path that no longer exists.
    const tracked = trackedFiles()

    const stale = STUDENT_CREATE_ALLOWLIST.filter((glob) => {
      const re = globToRegExp(glob)
      return !tracked.some((f) => re.test(f))
    })

    expect(
      stale,
      `Allowlist entries in eslint.config.mjs matching no tracked file — ` +
        `remove them or fix the path: ${stale.join(", ")}`
    ).toEqual([])
  })
})
