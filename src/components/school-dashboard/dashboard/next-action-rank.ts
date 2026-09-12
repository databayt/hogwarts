// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Ranking for the phone dashboard's next-action card.
 *
 * Pure functions over the shapes `getUpcomingDataByRole` already returns, so
 * the card costs the dashboard no query of its own — the same role dispatcher
 * the Upcoming flip card uses feeds this one.
 *
 * Order is the ranking. The card renders index 0 first and flips through the
 * rest in order, so whatever a role should do FIRST has to come first here.
 */

export type NextActionKind =
  | "assignmentOverdue"
  | "assignmentDue"
  | "nextClass"
  | "pendingGrading"
  | "attendanceDue"
  | "childOverdue"
  | "childPending"
  | "pendingPayments"
  | "overdueInvoices"
  | "urgentTask"
  | "pendingRequests"
  | "activeIssues"
  | "pendingApprovals"

export interface NextAction {
  kind: NextActionKind
  /**
   * The phrase the headline sets in bold — an assignment title, a subject, a
   * child's name, a count. It is DATA, never a translated string: the sentence
   * around it comes from the dictionary and splits on `{mark}`, the same
   * arrangement the /live and /library banners use.
   */
  mark: string
  /** Locale-less path; the client prefixes `/${locale}`. */
  href: string
}

/** How many the card will cycle through. More than four is a list, not a card. */
const MAX_ACTIONS = 4

type Unknown = Record<string, unknown>

/**
 * The headline sets the mark in bold inside a ~16ch measure over two lines, and
 * the mark is a phrase INSIDE a sentence — so it may never trail off. An
 * ellipsis in the middle of a line reads as broken data, not as brevity, and
 * the reader is left guessing which assignment the card means.
 *
 * Two things get it short enough without one.
 *
 * First, the tail comes off. Real record titles are a phrase plus their filing
 * ("مهمة مقالية - الحاسوب - الصف الثاني عشر"): the head is what a reader would
 * actually say out loud, and everything after the first dash is the class and
 * the grade, which the sentence around the mark does not need. Every seeded
 * title's head is already inside the cap.
 *
 * Second, whatever is still too long is cut on a SPACE. A whole word short of
 * the cap reads as a name; half a word reads as a bug. A first word longer than
 * the cap on its own is kept whole rather than sliced — one long word setting
 * a line wide is better than a fragment.
 *
 * The cap is load-bearing rather than cosmetic: the card's headline is a FIXED
 * two-line box, so a mark that overruns is not a taller card any more — it is a
 * sentence with its end cut off. Eighteen is what came out of measuring every
 * template in a real browser at 390px against the /live headline it copies —
 * per-CHARACTER spans, the way the card actually renders, because span
 * boundaries shift Chrome's line breaking enough to flip a break.
 */
const MARK_MAX = 18

/**
 * Where a title's own phrase ends and its filing begins. A spaced dash, so a
 * hyphenated word inside the phrase survives.
 */
const TITLE_TAIL = /\s[-–—]\s/

const num = (v: unknown): number => (typeof v === "number" ? v : 0)

const str = (v: unknown): string => {
  if (typeof v !== "string") return ""
  const head = v.split(TITLE_TAIL)[0].trim()
  if (head.length <= MARK_MAX) return head

  const lastFit = head.lastIndexOf(" ", MARK_MAX)
  if (lastFit > 0) return head.slice(0, lastFit)

  const firstWord = head.indexOf(" ")
  return firstWord > 0 ? head.slice(0, firstWord) : head
}

/**
 * Names whose first word is not a name on its own.
 *
 * "عبد" is a word meaning servant, not somebody called Abd — the name is the
 * whole construction, "عبد الرحمن". Same for the kunya and parentage prefixes,
 * and for their Latin spellings. These are ordinary names here rather than edge
 * cases, so a bare first-word split would misname a real child on a real card.
 * Written with a space or without ("عبدالله") — the joined spelling is one word
 * already and needs nothing.
 */
const BOUND_PREFIX = new Set([
  "عبد",
  "أبو",
  "ابو",
  "أم",
  "ام",
  "ابن",
  "بنت",
  "ذو",
  "abdul",
  "abd",
  "abu",
  "umm",
  "bin",
  "ibn",
  "bint",
])

/**
 * A person's given name, for the cards that address a parent about one child.
 *
 * A card that says "Khadija" where the register says "Khadija Alnoor" is how a
 * parent talks about their own child, and it is also what keeps the sentence
 * on two lines — a full name spends the whole mark budget and pushes the tail
 * of the sentence out of the clipped box.
 */
const given = (v: unknown): string => {
  const words = str(v).split(" ")
  const bound = BOUND_PREFIX.has(words[0].toLowerCase())
  return bound && words.length > 1 ? `${words[0]} ${words[1]}` : words[0]
}

/**
 * Rank a role's upcoming data into the actions the card cycles through.
 *
 * Returns an empty array when there is genuinely nothing to do — the card
 * renders nothing rather than an empty banner saying so.
 */
export function rankNextActions(
  role: string | undefined,
  data: unknown
): NextAction[] {
  if (!data || typeof data !== "object") return []
  const d = data as Unknown
  const actions: NextAction[] = []

  switch ((role || "").toUpperCase()) {
    case "STUDENT": {
      const assignments = Array.isArray(d.assignments)
        ? (d.assignments as Unknown[])
        : []
      const unsubmitted = assignments.filter(
        (a) => a.status === "not_submitted"
      )

      // Overdue first, then merely due — an assignment past its date is the
      // one thing on a student's dashboard that gets worse by waiting.
      for (const a of unsubmitted.filter((a) => a.isOverdue === true)) {
        actions.push({
          kind: "assignmentOverdue",
          mark: str(a.title) || str(a.subject),
          href: "/my-assignments",
        })
      }
      for (const a of unsubmitted.filter((a) => a.isOverdue !== true)) {
        actions.push({
          kind: "assignmentDue",
          mark: str(a.title) || str(a.subject),
          href: "/my-assignments",
        })
      }

      const nextClass = d.nextClass as Unknown | undefined
      if (nextClass && str(nextClass.subject)) {
        actions.push({
          kind: "nextClass",
          mark: str(nextClass.subject),
          href: "/timetable",
        })
      }
      break
    }

    case "TEACHER": {
      if (num(d.pendingGrading) > 0) {
        actions.push({
          kind: "pendingGrading",
          mark: String(num(d.pendingGrading)),
          href: "/assignments",
        })
      }
      if (num(d.attendanceDue) > 0) {
        actions.push({
          kind: "attendanceDue",
          mark: String(num(d.attendanceDue)),
          href: "/attendance",
        })
      }
      const nextClass = d.nextClass as Unknown | undefined
      if (nextClass && str(nextClass.subject)) {
        actions.push({
          kind: "nextClass",
          mark: str(nextClass.subject),
          href: "/timetable",
        })
      }
      break
    }

    case "GUARDIAN": {
      const children = Array.isArray(d.children)
        ? (d.children as Unknown[])
        : []
      for (const c of children.filter((c) => num(c.overdueAssignments) > 0)) {
        actions.push({
          kind: "childOverdue",
          mark: given(c.name),
          href: "/parent",
        })
      }
      for (const c of children.filter(
        (c) => num(c.overdueAssignments) === 0 && num(c.pendingAssignments) > 0
      )) {
        actions.push({
          kind: "childPending",
          mark: given(c.name),
          href: "/parent",
        })
      }
      break
    }

    case "ACCOUNTANT": {
      const overdue = d.overdueInvoices as Unknown | undefined
      const pending = d.pendingPayments as Unknown | undefined
      if (num(overdue?.count) > 0) {
        actions.push({
          kind: "overdueInvoices",
          mark: String(num(overdue?.count)),
          href: "/finance",
        })
      }
      if (num(pending?.count) > 0) {
        actions.push({
          kind: "pendingPayments",
          mark: String(num(pending?.count)),
          href: "/finance",
        })
      }
      break
    }

    case "STAFF": {
      const tasks = Array.isArray(d.urgentTasks)
        ? (d.urgentTasks as Unknown[])
        : []
      for (const t of tasks) {
        if (str(t.title)) {
          actions.push({
            kind: "urgentTask",
            mark: str(t.title),
            href: "/notifications",
          })
        }
      }
      if (num(d.pendingRequests) > 0) {
        actions.push({
          kind: "pendingRequests",
          mark: String(num(d.pendingRequests)),
          href: "/notifications",
        })
      }
      break
    }

    // ADMIN, DEVELOPER and PRINCIPAL all read the alert/approval shape;
    // principal's list is named `criticalAlerts` and admin's `activeIssues`.
    default: {
      const critical = Array.isArray(d.criticalAlerts)
        ? (d.criticalAlerts as Unknown[]).length
        : 0
      const issues = num(d.activeIssues) || critical
      if (issues > 0) {
        actions.push({
          kind: "activeIssues",
          mark: String(issues),
          href: "/notifications",
        })
      }
      if (num(d.pendingApprovals) > 0) {
        actions.push({
          kind: "pendingApprovals",
          mark: String(num(d.pendingApprovals)),
          href: "/announcements",
        })
      }
      break
    }
  }

  return actions.filter((a) => a.mark).slice(0, MAX_ACTIONS)
}
