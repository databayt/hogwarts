// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// «حصة بلا معلم» — the rule behind the real-time alert, and its words. Pure:
// the cron route loads rows and sends; what counts as a no-show lives here.

/** Minutes past the bell with no teacher before staff are told. */
export const NO_SHOW_AFTER_MINUTES = 5
/** The cron runs every five minutes; a session older than this is not news. */
export const NO_SHOW_LOOKBACK_HOURS = 12

export type NoShowCandidate = {
  id: string
  schoolId: string
  status: string
  isPractice: boolean
  scheduledStart: Date
  scheduledEnd: Date
  coveredByUserId: string | null
  /** True when a HOST / CO_HOST ever joined (joinedAt set). */
  hostEverJoined: boolean
}

/**
 * Sessions that have run `NO_SHOW_AFTER_MINUTES` past their start with nobody
 * teaching, are still inside their time, are not covered and were not told
 * yet. `alreadyNotified` is the set of session ids that already hold a
 * `live_class_no_teacher` notice — once per session.
 */
export function selectNoShowSessions<T extends NoShowCandidate>(
  candidates: readonly T[],
  now: Date,
  alreadyNotified: ReadonlySet<string>
): T[] {
  const t = now.getTime()
  return candidates.filter(
    (s) =>
      (s.status === "scheduled" || s.status === "live") &&
      !s.isPractice &&
      !s.coveredByUserId &&
      !s.hostEverJoined &&
      t >= s.scheduledStart.getTime() + NO_SHOW_AFTER_MINUTES * 60_000 &&
      t < s.scheduledEnd.getTime() &&
      !alreadyNotified.has(s.id)
  )
}

/** The session ids already told, read off the metadata of earlier notices. */
export function notifiedSessionIds(
  rows: readonly { metadata: unknown }[]
): Set<string> {
  const out = new Set<string>()
  for (const r of rows) {
    const m = r.metadata
    if (m && typeof m === "object" && "sessionId" in m) {
      const id = (m as { sessionId?: unknown }).sessionId
      if (typeof id === "string") out.add(id)
    }
  }
  return out
}

export const NO_SHOW_TEXT: Record<
  "ar" | "en",
  { title: string; body: string }
> = {
  ar: {
    title: "حصة بلا معلم",
    body: "{what} — بدأت الساعة {time} ولم يدخل المعلم. ادخل وغطِّها أو احجز تعويضاً.",
  },
  en: {
    title: "Class without a teacher",
    body: "{what} — started at {time} and the teacher has not joined. Cover it or book a make-up.",
  },
}

/** «الرياضيات · 3 أ» — subject and section, whichever exist. */
export function noShowWhat(parts: {
  subject?: string | null
  section?: string | null
  title: string
}): string {
  const what = [parts.subject, parts.section].filter(Boolean).join(" · ")
  return what || parts.title
}

export function noShowNotice(
  lang: "ar" | "en",
  vars: { what: string; time: string }
): { title: string; body: string } {
  const t = NO_SHOW_TEXT[lang]
  return {
    title: t.title,
    body: t.body.replace("{what}", vars.what).replace("{time}", vars.time),
  }
}
