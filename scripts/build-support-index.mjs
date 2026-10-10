// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The chatbot's support knowledge, generated from the help-center guides.
 *
 * Reads every guide in content/docs-{ar,en}/support/ (order from the English
 * meta.json), merges each ar/en pair into one topic and writes
 * src/components/chatbot/support-index.json — so the bot answers from exactly
 * what the guide says, and a guide edit reaches the chat on the next build.
 *
 * A guide is a topic when its frontmatter has `summary` (index and faq don't).
 * The bot's answer is the guide's Steps + Good to know sections, plain text,
 * unless frontmatter `answer` overrides it (pricing: the live figures are in
 * the prompt). Committed, not built at runtime: Workers have no file system.
 *
 *   node scripts/build-support-index.mjs          write the index
 *   node scripts/build-support-index.mjs --check  fail if it is out of date
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import fm from "front-matter"

const ROOT = new URL("..", import.meta.url).pathname
const DIR = (lang) => join(ROOT, "content", `docs-${lang}`, "support")
const OUT = join(ROOT, "src/components/chatbot/support-index.json")
const ROLES = new Set(["admin", "teacher", "parent"])

// The sections the bot answers from, per language. Related links and media
// stay on the page.
const SECTIONS = {
  en: ["Steps", "Good to know"],
  ar: ["الخطوات", "معلومات مفيدة"],
}

const errors = []
const fail = (msg) => errors.push(msg)

function read(lang, slug) {
  const file = join(DIR(lang), `${slug}.mdx`)
  if (!existsSync(file)) return null
  return fm(readFileSync(file, "utf8"))
}

/** `## Heading` sections → { heading: body }. */
function sections(body) {
  const out = {}
  let current = null
  for (const line of body.split("\n")) {
    const h = line.match(/^##\s+(.+?)\s*(\[#.+\])?\s*$/)
    if (h) {
      current = h[1]
      out[current] = []
    } else if (current) {
      out[current].push(line)
    }
  }
  return Object.fromEntries(
    Object.entries(out).map(([k, v]) => [k, v.join("\n")])
  )
}

/** MDX → the plain text the bot repeats: no JSX, links become their text. */
function plain(text) {
  return text
    .replace(/<[A-Z][\s\S]*?\/>/g, "")
    .replace(/<\/?[A-Z][^>]*>/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function answerOf(lang, slug, doc) {
  if (doc.attributes.answer) return String(doc.attributes.answer).trim()
  const s = sections(doc.body)
  const [steps, extra] = SECTIONS[lang]
  if (!s[steps]?.trim()) {
    fail(`${lang}/${slug}.mdx: no "## ${steps}" section`)
    return ""
  }
  return plain([s[steps], s[extra] ?? ""].join("\n\n"))
}

const order = JSON.parse(
  readFileSync(join(DIR("en"), "meta.json"), "utf8")
).pages
const topics = []

for (const slug of order) {
  const en = read("en", slug)
  const ar = read("ar", slug)
  if (!en || !ar) {
    fail(`${slug}: missing the ${en ? "ar" : "en"} guide`)
    continue
  }
  if (!en.attributes.summary && !ar.attributes.summary) continue
  for (const [lang, doc] of [
    ["en", en],
    ["ar", ar],
  ]) {
    for (const key of ["title", "summary"]) {
      if (!doc.attributes[key]) fail(`${lang}/${slug}.mdx: no ${key}`)
    }
    if (!doc.attributes.keywords?.length) {
      fail(`${lang}/${slug}.mdx: no keywords`)
    }
  }
  const roles = en.attributes.roles ?? []
  if (!roles.length || roles.some((r) => !ROLES.has(r))) {
    fail(
      `en/${slug}.mdx: roles must be a non-empty subset of admin, teacher, parent`
    )
  }
  if (JSON.stringify(roles) !== JSON.stringify(ar.attributes.roles ?? [])) {
    fail(`${slug}: en and ar roles differ`)
  }

  const topic = {
    slug,
    ...(en.attributes.flow ? { flow: en.attributes.flow } : {}),
    roles,
    title: { ar: ar.attributes.title, en: en.attributes.title },
    summary: { ar: ar.attributes.summary, en: en.attributes.summary },
    answer: {
      ar: answerOf("ar", slug, ar),
      en: answerOf("en", slug, en),
    },
    // Arabic first, as written; duplicates (shared Latin terms) dropped.
    keywords: [
      ...new Set([
        ...(ar.attributes.keywords ?? []),
        ...(en.attributes.keywords ?? []),
      ]),
    ],
    guide: en.attributes.guide ?? `/docs/support/${slug}`,
    ...(en.attributes.sales ? { sales: true } : {}),
  }
  topics.push(topic)
}

if (!topics.length) fail("no guides with a summary found")
if (errors.length) {
  console.error(
    `✗ support index: ${errors.length} problem(s)\n  ${errors.join("\n  ")}`
  )
  process.exit(1)
}

const json = JSON.stringify(topics, null, 2) + "\n"
if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : ""
  if (current !== json) {
    console.error(
      "✗ support-index.json is out of date — run: node scripts/build-support-index.mjs"
    )
    process.exit(1)
  }
  console.log(`✓ support index up to date (${topics.length} guides)`)
} else {
  writeFileSync(OUT, json)
  console.log(
    `✓ support index: ${topics.length} guides → ${OUT.replace(ROOT, "")}`
  )
}
