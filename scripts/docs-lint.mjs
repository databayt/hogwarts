#!/usr/bin/env node
// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Lints content/docs-en/*.mdx against docs/STYLE.md rules.
// Reports duplicate body H1, placeholder descriptions, hardcoded text-* / font-* classes,
// broken /docs/<slug> links, and files over category caps.
//
// Usage: pnpm docs:lint
//        pnpm docs:lint --json (machine output)
//        pnpm docs:lint --audit (also writes tmp/docs-link-audit.json)
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const DOCS_DIR = join(ROOT, "content", "docs-en")
const META_PATH = join(DOCS_DIR, "meta.json")
const TMP_DIR = join(ROOT, "tmp")
const AUDIT_PATH = join(TMP_DIR, "docs-link-audit.json")

const args = process.argv.slice(2)
const JSON_MODE = args.includes("--json")
const AUDIT_MODE = args.includes("--audit")

const CATEGORY_CAPS = {
  guide: 250,
  feature: 500,
  pattern: 600,
  reference: 800,
  business: 800,
  unknown: 1000,
}

// Heuristic categorizer. Keep simple — used only for length check.
function inferCategory(slug) {
  const guide = new Set([
    "contributing",
    "code-of-conduct",
    "localhost",
    "get-started",
    "newcomers",
    "team-workflow",
    "community",
    "playwright",
    "github",
    "claude-code",
    "vibe-coding",
    "prompt",
    "rebound",
    "benchmark",
    "demo",
    "issue",
    "issues",
    "invitation",
    "domain",
    "credit",
    "resume",
    "upwork",
    "incubators",
    "inspiration",
  ])
  const business = new Set([
    "pitch",
    "sales",
    "business-model",
    "competitors",
    "shared-economy",
    "business",
    "pilot",
  ])
  const reference = new Set([
    "catalog",
    "books-catalog",
    "multi-tenancy",
    "multi-tenancy-tests",
    "database",
    "stack",
    "documentation",
    "concept",
    "structure",
    "flow-diagrams",
    "integration-flow",
    "dashboard",
    "atoms-factory",
    "templates-factory",
    "icons",
    "typography",
    "accordion",
    "awesome-shadcn",
    "clickview",
    "clickview-elementary",
    "clickview-middle",
    "clickview-high",
    "sudan-curriculum",
    "curriculum-engineering",
    "library",
    "internationalization",
    "translation",
    "seeds",
    "safe-seeds",
    "accounts",
    "eslint",
    "prettier",
    "readme",
    "file",
    "ai-document-processing",
    "document-intelligence",
    "cdn",
  ])
  const pattern = new Set([
    "page",
    "layout",
    "content",
    "client",
    "types",
    "config",
    "actions",
    "queries",
    "authorization",
    "validation",
    "form",
    "table",
    "detail",
    "card",
    "util",
    "hooks",
    "list-params",
    "views",
    "pattern",
    "architecture",
  ])
  if (guide.has(slug)) return "guide"
  if (business.has(slug)) return "business"
  if (reference.has(slug)) return "reference"
  if (pattern.has(slug)) return "pattern"
  // Default features (attendance, exams, students, etc.)
  return "feature"
}

function parseFrontmatter(text) {
  if (!text.startsWith("---"))
    return { frontmatter: null, body: text, fmEnd: 0 }
  const end = text.indexOf("\n---", 3)
  if (end === -1) return { frontmatter: null, body: text, fmEnd: 0 }
  const raw = text.slice(3, end).trim()
  const fm = {}
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!m) continue
    const [, key, value] = m
    fm[key] = value.trim().replace(/^["']|["']$/g, "")
  }
  const body = text.slice(end + 4).replace(/^\n/, "")
  return { frontmatter: fm, body, fmEnd: end + 4 }
}

function stripCodeFences(body) {
  // Remove fenced code blocks so we don't false-positive inside examples.
  return body.replace(/```[\s\S]*?```/g, "")
}

function normalizeTitle(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function loadMeta() {
  if (!existsSync(META_PATH)) return { pages: [] }
  return JSON.parse(readFileSync(META_PATH, "utf8"))
}

function listMdxFiles() {
  return readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => ({
      slug: basename(f, ".mdx"),
      path: join(DOCS_DIR, f),
    }))
}

function lintFile(file, knownSlugs) {
  const text = readFileSync(file.path, "utf8")
  const { frontmatter: fm, body } = parseFrontmatter(text)
  const issues = []
  const lineCount = text.split("\n").length

  if (!fm) {
    issues.push({
      rule: "frontmatter-missing",
      message: "No frontmatter block",
    })
    return { file, issues, lineCount, links: [], frontmatter: null }
  }

  if (!fm.title)
    issues.push({ rule: "frontmatter-title-missing", message: "Missing title" })
  if (!fm.description) {
    issues.push({
      rule: "frontmatter-description-missing",
      message: "Missing description",
    })
  } else if (/^documentation for /i.test(fm.description)) {
    issues.push({
      rule: "frontmatter-description-placeholder",
      message: `Placeholder description: "${fm.description}"`,
    })
  } else if (fm.description.length < 30) {
    issues.push({
      rule: "frontmatter-description-too-short",
      message: `Description too short (${fm.description.length} chars): "${fm.description}"`,
    })
  } else if (fm.description.length > 200) {
    issues.push({
      rule: "frontmatter-description-too-long",
      message: `Description too long (${fm.description.length} chars)`,
    })
  }

  // Duplicate body H1: first non-empty body line is `# Title` matching frontmatter title.
  const bodyTrimmed = body.replace(/^\s*\n+/, "")
  const firstLine = bodyTrimmed.split("\n", 1)[0] ?? ""
  const h1Match = firstLine.match(/^#\s+(.+?)\s*$/)
  if (h1Match && fm.title) {
    if (normalizeTitle(h1Match[1]) === normalizeTitle(fm.title)) {
      issues.push({
        rule: "duplicate-h1",
        message: `Body H1 duplicates frontmatter title: "${h1Match[1]}"`,
      })
    }
  }

  const cat = inferCategory(file.slug)
  const bodyNoCode = stripCodeFences(body)

  // Hardcoded styling classes — check outside code fences only.
  // Business-group docs are exempt: marketing/landing-style content is the point.
  if (cat !== "business") {
    const hardcodedStylePatterns = [
      /className\s*=\s*"[^"]*\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)\b/g,
      /className\s*=\s*"[^"]*\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g,
      /className\s*=\s*"[^"]*\btext-(?:red|blue|green|yellow|amber|orange|purple|pink|gray|slate|zinc|neutral|stone)-\d+/g,
    ]
    for (const re of hardcodedStylePatterns) {
      const matches = bodyNoCode.match(re)
      if (matches) {
        issues.push({
          rule: "hardcoded-style-class",
          message: `Hardcoded style class found (${matches.length} occurrence${matches.length > 1 ? "s" : ""})`,
          sample: matches[0].slice(0, 80),
        })
        break
      }
    }
  }

  // Internal links: collect /docs/<slug> references for the audit.
  const linkPattern = /\(\/docs\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)(?:#[^\s)]*)?\)/g
  const links = []
  let m
  while ((m = linkPattern.exec(bodyNoCode)) !== null) {
    const target = m[1]
    const baseSlug = target.split("/")[0]
    const exists = knownSlugs.has(target) || knownSlugs.has(baseSlug)
    links.push({ target, exists })
    if (!exists) {
      issues.push({
        rule: "broken-internal-link",
        message: `Broken link: /docs/${target}`,
      })
    }
  }

  // Length cap.
  const cap = CATEGORY_CAPS[cat] ?? CATEGORY_CAPS.unknown
  if (lineCount > cap) {
    issues.push({
      rule: "length-over-cap",
      message: `${lineCount} lines exceeds ${cat} cap (${cap})`,
    })
  }

  return { file, issues, lineCount, links, frontmatter: fm, category: cat }
}

function main() {
  const meta = loadMeta()
  const files = listMdxFiles()
  const knownSlugs = new Set([
    ...files.map((f) => f.slug),
    ...(meta.pages || []),
  ])

  const results = files.map((f) => lintFile(f, knownSlugs))
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
  const filesWithIssues = results.filter((r) => r.issues.length > 0)

  const byRule = {}
  for (const r of results) {
    for (const i of r.issues) {
      byRule[i.rule] = (byRule[i.rule] || 0) + 1
    }
  }

  if (AUDIT_MODE) {
    if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })
    const audit = {
      generatedAt: new Date().toISOString(),
      knownSlugs: [...knownSlugs].sort(),
      links: results.flatMap((r) =>
        r.links.map((l) => ({
          from: r.file.slug,
          to: l.target,
          exists: l.exists,
        }))
      ),
      orphans: files.map((f) => f.slug).filter((s) => !meta.pages?.includes(s)),
    }
    writeFileSync(AUDIT_PATH, JSON.stringify(audit, null, 2))
  }

  if (JSON_MODE) {
    console.log(
      JSON.stringify(
        {
          totalFiles: results.length,
          totalLines: results.reduce((s, r) => s + r.lineCount, 0),
          totalIssues,
          byRule,
          filesWithIssues: filesWithIssues.map((r) => ({
            slug: r.file.slug,
            lineCount: r.lineCount,
            category: r.category,
            issues: r.issues,
          })),
        },
        null,
        2
      )
    )
    process.exit(totalIssues > 0 ? 1 : 0)
  }

  console.log(
    `\nDocs lint — ${results.length} files, ${results.reduce((s, r) => s + r.lineCount, 0)} lines\n`
  )

  if (totalIssues === 0) {
    console.log("✓ All clean.\n")
    process.exit(0)
  }

  console.log(`Rule summary:`)
  for (const [rule, count] of Object.entries(byRule).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${count.toString().padStart(4)}  ${rule}`)
  }
  console.log("")

  for (const r of filesWithIssues) {
    console.log(`${r.file.slug}.mdx (${r.lineCount} lines, ${r.category}):`)
    for (const i of r.issues) {
      console.log(`  • ${i.rule}: ${i.message}`)
      if (i.sample) console.log(`    sample: ${i.sample}`)
    }
  }

  console.log(
    `\n${totalIssues} issue${totalIssues > 1 ? "s" : ""} across ${filesWithIssues.length} file${filesWithIssues.length > 1 ? "s" : ""}.\n`
  )
  process.exit(1)
}

main()
