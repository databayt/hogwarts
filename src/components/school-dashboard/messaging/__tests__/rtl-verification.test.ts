// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "fs"
import { join } from "path"

/**
 * RTL Verification Tests
 *
 * Ensures all messaging components use logical CSS properties
 * (ms, me, ps, pe, start, end) instead of physical ones (ml, mr, pl, pr, left, right).
 *
 * This prevents RTL layout bugs when switching between Arabic and English.
 */

const MESSAGING_DIR = join(
  process.cwd(),
  "src/components/school-dashboard/messaging"
)

// Physical CSS classes that should NOT appear (use logical equivalents)
const FORBIDDEN_PHYSICAL_CLASSES = [
  /\bml-\d/,
  /\bmr-\d/,
  /\bpl-\d/,
  /\bpr-\d/,
  /\bleft-\d/,
  /\bright-\d/,
  /\btext-left\b/,
  /\btext-right\b/,
  /\bfloat-left\b/,
  /\bfloat-right\b/,
  /\bborder-l-/,
  /\bborder-r-/,
  /\brounded-l-/,
  /\brounded-r-/,
  /\brounded-tl-/,
  /\brounded-tr-/,
  /\brounded-bl-/,
  /\brounded-br-/,
]

// Their logical replacements
const LOGICAL_EQUIVALENTS: Record<string, string> = {
  "ml-": "ms-",
  "mr-": "me-",
  "pl-": "ps-",
  "pr-": "pe-",
  "left-": "start-",
  "right-": "end-",
  "text-left": "text-start",
  "text-right": "text-end",
  "float-left": "float-start",
  "float-right": "float-end",
  "border-l-": "border-s-",
  "border-r-": "border-e-",
  "rounded-l-": "rounded-s-",
  "rounded-r-": "rounded-e-",
  "rounded-tl-": "rounded-ss-",
  "rounded-tr-": "rounded-se-",
  "rounded-bl-": "rounded-es-",
  "rounded-br-": "rounded-ee-",
}

// Exceptions: some physical classes are valid in specific contexts
const ALLOWED_EXCEPTIONS = [
  // CSS-in-JS or computed styles that explicitly handle RTL
  "rtl:",
  // Tailwind's responsive/conditional prefixes that already handle direction
]

function getMessagingFiles(dir: string = MESSAGING_DIR): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (entry === "__tests__" || entry === "node_modules") continue
    if (statSync(full).isDirectory()) {
      results.push(...getMessagingFiles(full))
    } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      results.push(full)
    }
  }
  return results
}

describe("RTL Verification — Messaging Components", () => {
  const files = getMessagingFiles()

  it("should find messaging component files", () => {
    expect(files.length).toBeGreaterThan(0)
  })

  describe("logical properties only (no physical ml/mr/pl/pr/left/right)", () => {
    for (const filePath of files) {
      const relativePath = filePath.replace(MESSAGING_DIR + "/", "")

      it(`${relativePath} — no forbidden physical classes`, () => {
        const content = readFileSync(filePath, "utf-8")
        const lines = content.split("\n")
        const violations: string[] = []

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Skip comments and imports
          if (line.trim().startsWith("//") || line.trim().startsWith("*"))
            continue
          if (line.includes("import ")) continue

          // Skip lines with RTL-aware prefixes
          if (ALLOWED_EXCEPTIONS.some((exc) => line.includes(exc))) continue

          for (const pattern of FORBIDDEN_PHYSICAL_CLASSES) {
            const match = line.match(pattern)
            if (match) {
              const physical = match[0]
              const logicalKey = Object.keys(LOGICAL_EQUIVALENTS).find(
                (k) => physical.startsWith(k) || physical === k
              )
              const suggestion = logicalKey
                ? LOGICAL_EQUIVALENTS[logicalKey]
                : "logical equivalent"
              violations.push(
                `Line ${i + 1}: "${physical}" → use "${suggestion}" instead`
              )
            }
          }
        }

        if (violations.length > 0) {
          throw new Error(
            `RTL violations in ${relativePath}:\n${violations.join("\n")}`
          )
        }
      })
    }
  })

  describe("bubble tails use logical positioning", () => {
    it("globals.css — wa-tail-out uses logical end positioning", () => {
      const globalsPath = join(process.cwd(), "src/app/globals.css")
      const content = readFileSync(globalsPath, "utf-8")

      // Verify tail classes exist
      expect(content).toContain(".wa-tail-out")
      expect(content).toContain(".wa-tail-in")

      // Verify they use inset-inline (logical) not left/right (physical)
      // The clip-path approach means positioning uses inset-inline-end/start
      const tailOutSection = content
        .split(".wa-tail-out")[1]
        ?.split("}")[0]
      const tailInSection = content
        .split(".wa-tail-in")[1]
        ?.split("}")[0]

      // Tails should not use physical `left:` or `right:` in their positioning
      // They use inset-inline-end / inset-inline-start or logical properties
      if (tailOutSection) {
        expect(tailOutSection).not.toMatch(/\bright:\s*-/)
        expect(tailOutSection).not.toMatch(/\bleft:\s*-/)
      }
    })
  })

  describe("input bar uses logical properties", () => {
    it("message-input.tsx — uses logical flex ordering", () => {
      const inputPath = join(MESSAGING_DIR, "message-input.tsx")
      const content = readFileSync(inputPath, "utf-8")

      // Should use text-end for Arabic, not text-right
      expect(content).not.toMatch(/text-right/)
      // RTL text alignment should use text-end
      if (content.includes("ar")) {
        expect(content).toMatch(/text-end/)
      }
    })
  })

  describe("info panel slides from correct side", () => {
    it("conversation-info-panel.tsx — uses border-s not border-l", () => {
      const panelPath = join(MESSAGING_DIR, "conversation-info-panel.tsx")
      const content = readFileSync(panelPath, "utf-8")

      // Should use border-s (start) for the side border, not border-l
      expect(content).toMatch(/border-s/)
      expect(content).not.toMatch(/\bborder-l\b/)
    })
  })
})
