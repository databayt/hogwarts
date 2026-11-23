// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Ratchet: a school page must not ship a hard-coded English browser title.
 * `export const metadata = { title: "Dashboard: X" }` renders English in an
 * Arabic tab. Use `generateMetadata({ params })` + `getDictionary(lang)`
 * (see (listings)/assignments/page.tsx).
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOTS = [
  "src/app/[lang]/s/[subdomain]",
  "src/app/[lang]/(saas-dashboard)",
]

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return pages(p)
    return name === "page.tsx" ? [p] : []
  })
}

// A static metadata export whose title is a literal containing Latin letters.
const STATIC_ENGLISH_TITLE =
  /export const metadata(?:\s*:\s*Metadata)?\s*=\s*\{[^}]*?title:\s*["'`][^"'`]*[A-Za-z]/s

describe("page titles are translated", () => {
  it("no page.tsx has a static English metadata title", () => {
    const offenders = ROOTS.flatMap(pages).filter((f) =>
      STATIC_ENGLISH_TITLE.test(readFileSync(f, "utf8"))
    )
    expect(offenders).toEqual([])
  })
})
