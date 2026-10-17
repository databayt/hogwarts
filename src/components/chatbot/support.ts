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

const INDEX = SUPPORT_TOPICS.map((topic) => ({
  topic,
  phrases: topic.keywords.map((k) => normalize(k).split(" ").filter(Boolean)),
}))

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
 * follow-up ("and then?") keeps the topic under discussion.
 */
export function matchTopics(
  texts: string[],
  n = 2,
  role?: SupportRole
): SupportTopic[] {
  const normalized = texts.map(normalize)
  return INDEX.map(({ topic, phrases }) => {
    const hits = normalized.reduce(
      (sum, text, i) => sum + score(text, phrases) / (i + 1) ** 2,
      0
    )
    // A signed-in teacher asking about "grades" means entering marks, not
    // the admin's grade setup: ties go to the guides written for them.
    const boost = hits && role && topic.roles?.includes(role) ? 0.5 : 0
    return { topic, score: hits + boost }
  })
    .filter((s) => s.score > 0)
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
