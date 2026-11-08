// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The SaaS marketing layout serves its client components a dictionary made
 * of the general file only (client/marketing-{ar,en}.ts), not the whole
 * merged dictionary. That is only safe while every client component the
 * layout renders reads namespaces that live in the general file — a read of
 * a feature namespace would be a silent `undefined` in the UI.
 *
 * This scans the client components that render under the layout and fails
 * on any `dictionary.<namespace>` read the general file does not carry.
 */
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import arGeneral from "@/components/internationalization/ar.json"
import { dictionary as marketingAr } from "@/components/internationalization/client/marketing-ar"
import { dictionary as marketingEn } from "@/components/internationalization/client/marketing-en"
import enGeneral from "@/components/internationalization/en.json"

const root = path.resolve(__dirname, "../../components")

// Client code that renders under src/app/[lang]/(saas-marketing)/layout.tsx.
const SCANNED = [
  "saas-marketing",
  "template/marketing-header",
  "template/mobile-nav",
  "atom/generic-command-menu/index.tsx",
  "auth/user-button.tsx",
]

// Lives under saas-marketing/ but renders only in the school dashboard
// (school-dashboard/dashboard/settings), never under the marketing layout.
const NOT_UNDER_MARKETING = new Set([
  "saas-marketing/pricing/forms/user-role-form.tsx",
])

function files(rel: string): string[] {
  const abs = path.join(root, rel)
  if (!fs.existsSync(abs)) return []
  if (fs.statSync(abs).isFile()) return [rel]
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? files(path.join(rel, e.name))
        : /\.tsx?$/.test(e.name)
          ? [path.join(rel, e.name)]
          : []
    )
}

describe("marketing client dictionary", () => {
  it("is the general file, per locale", () => {
    expect(marketingEn).toEqual(enGeneral)
    expect(marketingAr).toEqual(arGeneral)
  })

  it("covers every namespace the marketing client components read", () => {
    const general = new Set(Object.keys(enGeneral))
    const missing: string[] = []
    for (const rel of SCANNED.flatMap(files)) {
      if (NOT_UNDER_MARKETING.has(rel)) continue
      const src = fs.readFileSync(path.join(root, rel), "utf8")
      if (!src.includes("useDictionary(")) continue
      for (const m of src.matchAll(/\bdictionary\??\.(\w+)/g)) {
        if (!general.has(m[1])) missing.push(`${rel} reads "${m[1]}"`)
      }
    }
    expect(missing, missing.join("\n")).toEqual([])
  })
})
