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

import { tokenizeName } from "@/lib/name-utils"

export type NextActionKind =
  | "assignmentOverdue"
  | "assignmentDue"
  | "nextClass"
  | "liveClass"
  | "liveClassSoon"
  | "childLiveClass"
  | "childLiveClassSoon"
  | "liveNow"
  | "liveBlocked"
  | "liveToday"
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
  /**
   * A second piece of data the sentence names, substituted for `{time}` — the
   * class's start ("10:20") on the class items. Like `mark`, it is data: a
   * wall-clock time formatted on the server in the SCHOOL's zone, never the
   * reader's device clock.
   */
  detail?: string
  /** Locale-less path; the client prefixes `/${locale}`. */
  href: string
  /**
   * The class's join window, on a class item (`liveClass` or `nextClass`).
   * The client re-ranks against its own clock every half minute: a
   * `nextClass` becomes `liveClass` (opening `href` of the join link) when
   * the window opens, and a `liveClass` leaves once it closes — so a banner
   * rendered before the bell flips without a reload.
   */
  live?: { fromMs: number; untilMs: number; joinHref: string }
  /**
   * Carried for the client only: hidden until its `live` window opens by the
   * reader's clock. The server render (and the first client render) never
   * shows it.
   */
  pending?: boolean
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
 * A person's given name, for the cards that address a parent about one child.
 *
 * A card that says "Khadija" where the register says "Khadija Alnoor" is how a
 * parent talks about their own child, and it is also what keeps the sentence
 * on two lines — a full name spends the whole mark budget and pushes the tail
 * of the sentence out of the clipped box.
 */
const given = (v: unknown): string => tokenizeName(str(v))[0] ?? ""

/**
 * Rank a role's upcoming data into the actions the card cycles through.
 *
 * Returns an empty array when there is genuinely nothing to do — the card
 * renders nothing rather than an empty banner saying so.
 */
export function rankNextActions(
  role: string | undefined,
  data: unknown,
  /** The clock the live window is checked against (tests pin it). */
  nowMs: number = Date.now()
): NextAction[] {
  if (!data || typeof data !== "object") return []
  const d = data as Unknown
  const actions: NextAction[] = []

  switch ((role || "").toUpperCase()) {
    case "STUDENT": {
      // Today's online class outranks everything, ALL DAY (Abdout,
      // 2026-11-09): live (or about to be) it opens the room; before its
      // window it is "Math live at 10:20", and the client turns it into Join
      // at the bell. It is the one thing on the dashboard that is over in
      // minutes and cannot be done later.
      const live = liveAction(d.nextClass, nowMs)
      const soon = live ? null : soonAction(d.nextClass, nowMs)
      if (live) actions.push(live)
      if (soon) actions.push(soon)

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
      if (!live && !soon && nextClass && str(nextClass.subject)) {
        actions.push({
          kind: "nextClass",
          mark: str(nextClass.subject),
          href: "/timetable",
          live: joinWindowOf(nextClass),
        })
      }
      break
    }

    case "TEACHER": {
      const live = liveAction(d.nextClass, nowMs)
      const soon = live ? null : soonAction(d.nextClass, nowMs)
      if (live) actions.push(live)
      if (soon) actions.push(soon)
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
      if (!live && !soon && nextClass && str(nextClass.subject)) {
        actions.push({
          kind: "nextClass",
          mark: str(nextClass.subject),
          href: "/timetable",
          live: joinWindowOf(nextClass),
        })
      }
      break
    }

    case "GUARDIAN": {
      const children = Array.isArray(d.children)
        ? (d.children as Unknown[])
        : []
      // A child's online class leads the card all day — live now, or "at
      // 10:20" before its window. Only present when the school lets guardians
      // watch (the loader checks the switch).
      for (const c of children) {
        const nc = c.nextClass as Unknown | undefined
        const live = liveAction(nc, nowMs, "childLiveClass", given(c.name))
        if (live) {
          actions.push(live)
        } else if (nc && (joinWindowOf(nc)?.untilMs ?? 0) >= nowMs) {
          // Ranked, not hidden: "Khadija's class is live at 10:20" leads the
          // card all day, and the client flips it to Join at the bell.
          actions.push({
            kind: "childLiveClassSoon",
            mark: given(c.name),
            detail: str(nc.startsAt) || undefined,
            href: "/parent",
            live: joinWindowOf(nc),
          })
        }
      }
      // Live first, then the soon ones, whatever order the children came in.
      actions.sort(
        (a, b) =>
          Number(b.kind === "childLiveClass") -
          Number(a.kind === "childLiveClass")
      )
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
      actions.push(...liveTodayActions(d.liveToday, false))
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
      actions.push(...liveTodayActions(d.liveToday, true))
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

/**
 * Today's online classes as the school's people see them. A class running now
 * comes first; then a class nobody can start (its teacher has no login), which
 * only an admin can fix; then the day's count with its first start.
 */
function liveTodayActions(raw: unknown, canFix: boolean): NextAction[] {
  const t = raw as Unknown | undefined
  if (!t || t.deliveryMode === "physical") return []
  const out: NextAction[] = []
  if (num(t.liveNow) > 0) {
    out.push({ kind: "liveNow", mark: String(num(t.liveNow)), href: "/live" })
  }
  if (canFix && num(t.onlineToday) > 0 && num(t.noTeacherLogin) > 0) {
    out.push({
      kind: "liveBlocked",
      mark: String(num(t.noTeacherLogin)),
      href: "/school/configuration/teaching-mode",
    })
  }
  if (num(t.liveNow) === 0 && num(t.onlineToday) > 0 && str(t.nextStart)) {
    out.push({
      kind: "liveToday",
      mark: String(num(t.onlineToday)),
      detail: str(t.nextStart),
      href: "/live",
    })
  }
  return out
}

/**
 * Today's online class before its window opens: ranked first all day, with
 * its start time. Carries the window, so the client promotes it to the pinned
 * Join at the bell.
 */
function soonAction(raw: unknown, nowMs: number): NextAction | null {
  const c = raw as Unknown | undefined
  if (!c || !str(c.subject)) return null
  const live = joinWindowOf(c)
  if (!live || nowMs > live.untilMs) return null
  return {
    kind: "liveClassSoon",
    mark: str(c.subject),
    detail: str(c.startsAt) || undefined,
    href: "/timetable",
    live,
  }
}

/**
 * The join window a class payload carries (`upcoming-queries.ts` →
 * `liveFields`), or undefined when the class cannot be joined today.
 */
function joinWindowOf(c: Unknown | undefined): NextAction["live"] | undefined {
  if (!c) return undefined
  const slotId = typeof c.slotId === "string" ? c.slotId : ""
  const fromMs = typeof c.liveFromMs === "number" ? c.liveFromMs : NaN
  const untilMs = typeof c.liveUntilMs === "number" ? c.liveUntilMs : NaN
  if (!slotId || !Number.isFinite(fromMs) || !Number.isFinite(untilMs)) {
    return undefined
  }
  return { fromMs, untilMs, joinHref: `/live/join/${slotId}` }
}

/**
 * The live item for a class, when it is joinable NOW: through its join link
 * inside the window (which writes the room if the sweep has not), or — for an
 * older payload without a window — straight to an existing room.
 */
function liveAction(
  raw: unknown,
  nowMs: number,
  kind: "liveClass" | "childLiveClass" = "liveClass",
  markOverride?: string
): NextAction | null {
  const c = raw as Unknown | undefined
  if (!c || !str(c.subject)) return null
  const mark = markOverride || str(c.subject)
  const live = joinWindowOf(c)
  if (live) {
    if (nowMs < live.fromMs || nowMs > live.untilMs) return null
    return { kind, mark, href: live.joinHref, live }
  }
  const id = str(c.liveSessionId)
  if (!id) return null
  return { kind, mark, href: `/live/${id}/room` }
}
