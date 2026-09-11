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
 * The headline sets the mark in bold inside a ~16ch measure over two lines.
 * Real assignment titles carry the class and the grade ("مهمة مقالية - Islamic
 * - الصف الثاني عشر"), which pushes the line to three or four, so the mark is
 * capped at a phrase rather than a record name. It happens to cut seeded titles
 * about where the subject ends and the grade suffix begins.
 *
 * The cap is load-bearing rather than cosmetic: the card's headline is a FIXED
 * two-line box, so a mark that overruns is not a taller card any more — it is a
 * sentence with its end cut off. Twelve is what came out of measuring every
 * template in a real browser at 420px against the /live headline it copies —
 * per-CHARACTER spans, the way the card actually renders, because span
 * boundaries shift Chrome's line breaking enough to flip a break. At twelve,
 * every sentence in both languages sets as at most two lines whose widths are
 * within about a tenth of each other, which is the balance /live's own headline
 * has. Fourteen pushed the two assignment templates onto a third line, and the
 * tail was lost.
 */
const MARK_MAX = 12

const num = (v: unknown): number => (typeof v === "number" ? v : 0)

const str = (v: unknown): string => {
  if (typeof v !== "string") return ""
  const trimmed = v.trim()
  return trimmed.length > MARK_MAX
    ? `${trimmed.slice(0, MARK_MAX - 1).trimEnd()}…`
    : trimmed
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
          mark: str(c.name),
          href: "/parent",
        })
      }
      for (const c of children.filter(
        (c) => num(c.overdueAssignments) === 0 && num(c.pendingAssignments) > 0
      )) {
        actions.push({
          kind: "childPending",
          mark: str(c.name),
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
