// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The chatbot's support knowledge: one topic per help guide under
 * `content/docs-{ar,en}/support/`, generated into support-index.json by
 * scripts/build-support-index.mjs. The bot answers how-to questions from
 * `answer` only — the guide's own Steps section — and attaches the guide + the
 * flow's published media (see support-media.ts). The guide is the one source:
 * edit the MDX, never the JSON.
 *
 * Adding a topic: write the guide MDX (ar + en) with `summary`, `keywords` and
 * `roles` frontmatter, list it in support/meta.json, and set `flow` to the
 * /shoot flow slug when one exists — its video and screenshots then attach
 * themselves as soon as they land in media-manifest.json.
 */
import supportIndex from "./support-index.json"
import type { SupportRole } from "./type"

export interface SupportTopic {
  slug: string
  /** /shoot flow slug — the media-manifest.json prefix (`add-student/…`). */
  flow?: string
  /** Extra media-manifest ids to attach (another flow's still, a page shot). */
  media?: string[]
  title: { ar: string; en: string }
  /** One line for the index the bot sees on every turn. */
  summary: { ar: string; en: string }
  /** Condensed steps/facts the bot answers from — the guide has the rest. */
  answer: { ar: string; en: string }
  /**
   * Match phrases. Every space-separated part must appear in the question
   * (substring, after normalisation), so Arabic roots like «ضيف» catch
   * أضيف / يضيف / إضافة alike.
   */
  keywords: string[]
  /** Locale-less guide path, e.g. `/docs/support/add-student`. */
  guide: string
  /** A pre-sale question (getting started): keep the trial ask on. */
  sales?: boolean
  /** The audiences the guide serves — also its docs sidebar groups. */
  roles?: ("admin" | "teacher" | "parent")[]
}

export const SUPPORT_TOPICS = supportIndex as SupportTopic[]

const TASHKEEL = /[ً-ٰٟـ]/g

/** Lower-case, strip tashkeel/tatweel, fold alef/ta-marbuta/ya variants. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(TASHKEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Words that say nothing about which guide a question wants. Normalised
 * forms (see `normalize`), so Arabic is listed without hamza or ta-marbuta.
 */
const STOP_WORDS = new Set(
  (
    "how what when where which who why can could would should does did " +
    "the and for with you your yours this that these those there then " +
    "after before about from into have has had are was were will not " +
    "please help want need get make know tell show some any all " +
    "كيف ماذا متي اين هل لماذا ممكن اريد ابي ابغي عايز اعرف عندي لدي " +
    "هذا هذه ذلك تلك التي الذي الذين على الي الى عن من في مع بعد قبل " +
    "انا انت نحن هو هي كل اي او ثم لكن يمكن يمكنني استطيع ساعدني لو"
  ).split(" ")
)

/**
 * Fold the Arabic article, its prefixed particles and the sound feminine
 * plural (امتحانات → امتحان), and English plurals.
 */
function stem(word: string): string {
  if (/^[a-z0-9]+$/.test(word)) {
    return word.length > 4 ? word.replace(/(es|s)$/, "") : word
  }
  return word
    .replace(/^(وال|بال|كال|فال|لل|ال)(?=.{3,})/, "")
    .replace(/(?<=.{3,})ات$/, "")
}

/** The content words of a text, stemmed — what the term score compares. */
export function terms(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    .map(stem)
}

const INDEX = SUPPORT_TOPICS.map((topic) => ({
  topic,
  phrases: topic.keywords.map((k) => normalize(k).split(" ").filter(Boolean)),
  // The guide's own name and one-line summary in both languages: a
  // question that uses the guide's words lands on it even when no
  // keyword phrase was written for that wording.
  terms: new Set(
    terms(
      [
        topic.slug.replace(/-/g, " "),
        topic.title.ar,
        topic.title.en,
        topic.summary.ar,
        topic.summary.en,
      ].join(" ")
    )
  ),
}))

/**
 * How much one shared word says: a word in one guide's summary points at
 * it; a word in every summary ("school", "student") says almost nothing.
 */
const IDF = (() => {
  const df = new Map<string, number>()
  for (const { terms } of INDEX)
    for (const t of terms) df.set(t, (df.get(t) ?? 0) + 1)
  const n = INDEX.length
  return new Map([...df].map(([t, d]) => [t, Math.log(n / d)]))
})()

/** Term score of one text against one guide (IDF-weighted overlap). */
function termScore(text: string, topicTerms: Set<string>): number {
  let total = 0
  for (const t of new Set(terms(text)))
    if (topicTerms.has(t)) total += IDF.get(t) ?? 0
  return total
}

/**
 * Keywords stay the main signal; terms are the fallback. With a keyword
 * hit, terms only break ties — capped below the role boost (0.5) so a
 * teacher still gets the teacher's guide. Without one, a guide needs
 * MIN_TERM_SCORE to count, and scores under one keyword part (1) so it
 * never outranks a real keyword match.
 */
const TERM_TIEBREAK = 0.4
const MIN_TERM_SCORE = 1
const TERM_ONLY_CAP = 0.9

/** Score of one text: each matched phrase counts its number of parts. */
function score(text: string, phrases: string[][]): number {
  // Pad so a short English keyword ("app", "test") only matches whole words.
  const padded = ` ${text} `
  let total = 0
  for (const parts of phrases) {
    const hit = parts.every((p) =>
      /^[a-z0-9]+$/.test(p) && p.length <= 4
        ? padded.includes(` ${p} `) || padded.includes(` ${p}s `)
        : text.includes(p)
    )
    if (hit) total += parts.length
  }
  return total
}

/**
 * The guides a question is about, best first. `texts` is the latest user
 * message first, then earlier ones as context (weighted lower), so a
 * follow-up ("and then?") keeps the topic under discussion. Keyword phrases
 * decide; the guide's own words (title + summary, both languages) catch
 * wordings no keyword was written for.
 */
export function matchTopics(
  texts: string[],
  n = 2,
  role?: SupportRole
): SupportTopic[] {
  const normalized = texts.map(normalize)
  const scored = INDEX.map(({ topic, phrases, terms: topicTerms }) => {
    let hits = 0
    let termHits = 0
    normalized.forEach((text, i) => {
      const weight = 1 / (i + 1) ** 2
      hits += score(text, phrases) * weight
      termHits += termScore(text, topicTerms) * weight
    })
    const total =
      hits > 0
        ? hits + Math.min(termHits * 0.1, TERM_TIEBREAK)
        : termHits >= MIN_TERM_SCORE
          ? Math.min(termHits * 0.3, TERM_ONLY_CAP)
          : 0
    // A signed-in teacher asking about "grades" means entering marks, not
    // the admin's grade setup: ties go to the guides written for them.
    const boost = total && role && topic.roles?.includes(role) ? 0.5 : 0
    return { topic, keyword: hits > 0, score: total + boost }
  }).filter((s) => s.score > 0)
  // Guides found by their words alone only stand in when no keyword hit.
  const anyKeyword = scored.some((s) => s.keyword)
  return scored
    .filter((s) => s.keyword || !anyKeyword)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((s) => s.topic)
}

const HELP_INDEX = [
  "تساعدني",
  "تساعد في",
  "ماذا تستطيع",
  "بماذا تساعد",
  "ايش تقدر",
  "مركز المساعده",
  "help me with",
  "can you help",
  "what can you",
  "help center",
  "what guides",
].map(normalize)

/**
 * "What can you help me with?" — the Support chip's own question. No single
 * guide answers it: the bot lists the guides and attaches the help center.
 */
export function isHelpIndexQuestion(text: string): boolean {
  const t = normalize(text)
  return HELP_INDEX.some((k) => t.includes(k))
}

/** A how-to question about using the product — not a pre-sale one. */
export function isSupportQuestion(matched: SupportTopic[]): boolean {
  return matched.length > 0 && !matched[0]!.sales
}

/**
 * The help-center audience of a signed-in user's `UserRole`. Students read
 * the parent guides (same portal, same screens); every staff role that
 * isn't a teacher reads the admin ones.
 */
export function supportRoleOf(userRole: string | undefined): SupportRole {
  if (userRole === "TEACHER") return "teacher"
  if (userRole === "GUARDIAN" || userRole === "STUDENT") return "parent"
  return "admin"
}

/**
 * The `{support}` block of a prompt: every guide's title + summary (so the
 * bot can list what it helps with), then the full answer of the guides this
 * question matched. With a `role`, the index lists only that audience's
 * guides. `attached` names the media cards shown under the answer, so the
 * bot can point at "the screenshots below" without ever seeing a URL.
 */
export function formatSupport(
  locale: string,
  matched: SupportTopic[],
  options: { role?: SupportRole; attached?: string[] } = {}
): string {
  const lang = locale === "ar" ? "ar" : "en"
  const { role, attached = [] } = options
  const index = SUPPORT_TOPICS.filter(
    (t) => !role || !t.roles?.length || t.roles.includes(role)
  )
    .map((t) => `- ${t.title[lang]}: ${t.summary[lang]}`)
    .join("\n")
  if (!matched.length) return index
  const media = attached.length
    ? `\n${lang === "ar" ? "مرفق أدناه" : "Attached below"}: ${attached.join("; ")}`
    : ""
  const guides = matched
    .map(
      (t, i) => `### ${t.title[lang]}\n${t.answer[lang]}${i === 0 ? media : ""}`
    )
    .join("\n\n")
  const heading =
    lang === "ar"
      ? "### الأدلة المطابقة لهذا السؤال"
      : "### Guides matching this question"
  return `${index}\n\n${heading}\n\n${guides}`
}
