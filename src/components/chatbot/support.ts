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
  roles?: SupportRole[]
  /** The dashboard pages it is about, without the locale (`/attendance`). */
  routes?: string[]
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
    // Screen words every guide uses: "the page is blank" isn't the
    // security guide because its summary says "the security page".
    "page pages screen button click link open " +
    "صفحه الصفحه شاشه الشاشه زر اضغط رابط افتح " +
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

/**
 * Term score of one text against one guide (IDF-weighted overlap), with the
 * number of distinct shared words and the rarest one's weight — what the
 * term-only floor reads.
 */
function termScore(
  text: string,
  topicTerms: Set<string>
): { score: number; count: number; rarest: number } {
  let score = 0
  let count = 0
  let rarest = 0
  for (const t of new Set(terms(text)))
    if (topicTerms.has(t)) {
      const idf = IDF.get(t) ?? 0
      score += idf
      count += 1
      rarest = Math.max(rarest, idf)
    }
  return { score, count, rarest }
}

/**
 * Keywords stay the main signal; terms are the fallback. With a keyword
 * hit, terms only break ties — capped below the role boost (0.5) so a
 * teacher still gets the teacher's guide. Without one, a guide counts only
 * when the question shares two of its words, or one word that at most two
 * guides use: a single common word ("school", "change") attached unrelated
 * guides — "change the school logo" landed on get-started. A term-only
 * score stays under one keyword part (1), so it never outranks a real
 * keyword match.
 */
const TERM_TIEBREAK = 0.4
const MIN_TERM_SCORE = 1
const TERM_ONLY_CAP = 0.9
const RARE_TERM_IDF = Math.log(INDEX.length / 2)

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
  role?: SupportRole,
  options: { excludeSales?: boolean } = {}
): SupportTopic[] {
  const pool = options.excludeSales
    ? INDEX.filter(({ topic }) => !topic.sales)
    : INDEX
  // Earlier messages only fill in for a follow-up that names no topic of its
  // own ("and after that?"). A new question that does — attendance after an
  // add-student chat — is about itself: the earlier question's many keyword
  // hits used to outvote it.
  const latest = normalize(texts[0] ?? "")
  const ownTopic = pool.some(({ phrases }) => score(latest, phrases) > 0)
  const normalized = ownTopic ? [latest] : texts.map(normalize)
  const scored = pool.map(({ topic, phrases, terms: topicTerms }) => {
    let hits = 0
    let termHits = 0
    let strong = false
    normalized.forEach((text, i) => {
      const weight = 1 / (i + 1) ** 2
      hits += score(text, phrases) * weight
      const t = termScore(text, topicTerms)
      termHits += t.score * weight
      // The floor reads the latest message only: an earlier one is context.
      if (i === 0) strong = t.count >= 2 || t.rarest >= RARE_TERM_IDF
    })
    const total =
      hits > 0
        ? hits + Math.min(termHits * 0.1, TERM_TIEBREAK)
        : strong && termHits >= MIN_TERM_SCORE
          ? Math.min(termHits * 0.3, TERM_ONLY_CAP)
          : 0
    // A signed-in teacher asking about "grades" means entering marks, not
    // the admin's grade setup: ties go to the guides written for them.
    const boost = total && role && writtenFor(topic, role) ? 0.5 : 0
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
 * Words that don't turn "what can you help with?" into a real question:
 * the product's name, "using", "do". Normalised and stemmed like `terms`
 * («بالقلم» → «قلم»).
 */
const HELP_FILLER = new Set(
  (
    "balqalam using use app platform system assistant bot " +
    "قلم استخدام منصه نظام تطبيق مساعد تسوي تعمل تفعل"
  ).split(" ")
)

/**
 * "What can you help me with?" — the Support chip's own question. No single
 * guide answers it: the bot lists the guides and attaches the help center.
 *
 * Only the question itself counts: the chip's exact text, or a help phrase
 * with nothing else in it. "Can you help me add a student?" carries a real
 * question after the phrase and goes to the guides like any other.
 */
export function isHelpIndexQuestion(
  text: string,
  chipQuestions: string[] = []
): boolean {
  const t = normalize(text)
  if (chipQuestions.some((q) => normalize(q) === t)) return true
  const phrase = HELP_INDEX.find((k) => t.includes(k))
  if (!phrase) return false
  return terms(t.replace(phrase, " ")).every((w) => HELP_FILLER.has(w))
}

/** A how-to question about using the product — not a pre-sale one. */
export function isSupportQuestion(matched: SupportTopic[]): boolean {
  return matched.length > 0 && !matched[0]!.sales
}

/**
 * The help-center audience of a signed-in user's `UserRole`. Students have
 * their own guides (joining a live class, handing in homework) and still read
 * the parent ones — same portal, same screens. Every staff role that isn't a
 * teacher reads the admin ones.
 */
export function supportRoleOf(userRole: string | undefined): SupportRole {
  if (userRole === "TEACHER") return "teacher"
  if (userRole === "STUDENT") return "student"
  if (userRole === "GUARDIAN") return "parent"
  return "admin"
}

/** Is this guide for this audience? A student also reads parent guides. */
export function writtenFor(
  topic: { roles?: SupportRole[] },
  role: SupportRole
): boolean {
  const roles = topic.roles ?? []
  return (
    roles.includes(role) || (role === "student" && roles.includes("parent"))
  )
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
    (t) => !role || !t.roles?.length || writtenFor(t, role)
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
