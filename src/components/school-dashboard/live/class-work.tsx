// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { typography } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { loadClassWork, type HomeworkItem } from "./class-work-load"
import { SetHomeworkDialog } from "./set-homework-dialog"

function formatDue(d: Date, locale: string): string {
  try {
    return d.toLocaleString(locale === "ar" ? "ar-AE" : "en-AE", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return d.toISOString()
  }
}

/**
 * The class page's "Class work": homework and quick checks linked to the
 * class with the student's own status (or, for staff, how many handed in),
 * the polls closed in the room, and — for the host — Set homework, which the
 * page also asks by itself right after the class ends. Renders nothing when
 * there is nothing to show and nothing to do.
 */
export async function ClassWork({
  sessionId,
  locale,
  dictionary,
}: {
  sessionId: string
  locale: string
  dictionary: Dictionary
}) {
  const [tenant, session] = await Promise.all([getTenantContext(), auth()])
  // A section of the class page, not the page: a failed read hides it.
  const work = await loadClassWork(sessionId, {
    userId: session?.user?.id,
    role: tenant.role,
    schoolId: tenant.schoolId,
  }).catch(() => null)
  if (!work) return null
  const { homework, quickChecks, polls, canSetHomework, isStudent } = work
  if (
    !canSetHomework &&
    homework.length === 0 &&
    quickChecks.length === 0 &&
    polls.length === 0
  )
    return null

  const t = dictionary?.liveClasses?.classWork
  const L = {
    title: t?.title ?? "Class work",
    homework: t?.homework ?? "Homework",
    quickChecks: t?.quickChecks ?? "Quick checks",
    polls: t?.polls ?? "Class polls",
    votes: t?.votes ?? "{n} votes",
    due: t?.due ?? "Due {date}",
    notSubmitted: t?.notSubmitted ?? "Not handed in",
    submitted: t?.submitted ?? "Handed in",
    graded: t?.graded ?? "Graded: {score}/{total}",
    score: t?.score ?? "{correct} of {total} correct",
    notTaken: t?.notTaken ?? "Not taken",
    openEnded: t?.openEnded ?? "Answered",
    handedIn: t?.handedIn ?? "{n} handed in",
    responses: t?.responses ?? "{n} responses",
  }

  const homeworkStatus = (h: HomeworkItem) => {
    if (!isStudent) return L.handedIn.replace("{n}", String(h.handedIn ?? 0))
    const s = h.mine
    if (!s || s.status === "NOT_SUBMITTED" || s.status === "DRAFT")
      return L.notSubmitted
    if ((s.status === "GRADED" || s.status === "RETURNED") && s.score !== null)
      return L.graded
        .replace("{score}", String(s.score))
        .replace("{total}", String(h.totalPoints))
    return L.submitted
  }

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={typography.h4}>{L.title}</h2>
        {canSetHomework && (
          <SetHomeworkDialog
            sessionId={sessionId}
            labels={{
              setHomework: t?.setHomework ?? "Set homework",
              dialogTitle: t?.dialogTitle ?? "Set homework for this class",
              dialogHint:
                t?.dialogHint ??
                "Students in the class see it on this page and in their assignments.",
              fieldTitle: t?.fieldTitle ?? "What to do",
              fieldTitlePlaceholder: t?.fieldTitlePlaceholder ?? "",
              fieldInstructions:
                t?.fieldInstructions ?? "Instructions (optional)",
              fieldDue: t?.fieldDue ?? "Due",
              fieldPoints: t?.fieldPoints ?? "Points",
              save: t?.save ?? "Set homework",
              skip: t?.skip ?? "Not now",
              saving: t?.saving ?? "Saving…",
              saved: t?.saved ?? "Homework set",
              failed: t?.failed ?? "Couldn't set the homework",
              noAudience:
                t?.noAudience ??
                "This class has no section, so there is no one to set homework for.",
            }}
          />
        )}
      </div>

      {homework.length > 0 && (
        <div>
          <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
            {L.homework}
          </h3>
          <ul className="space-y-2 text-sm">
            {homework.map((h) => {
              const status = homeworkStatus(h)
              const missing = isStudent && status === L.notSubmitted
              return (
                <li key={h.id} className="flex flex-wrap items-center gap-2">
                  <Link
                    className="underline underline-offset-2"
                    href={`/${locale}/assignments/${h.id}`}
                  >
                    {h.title}
                  </Link>
                  <Badge variant={missing ? "destructive" : "secondary"}>
                    {status}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {L.due.replace("{date}", formatDue(h.dueDate, locale))}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {quickChecks.length > 0 && (
        <div>
          <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
            {L.quickChecks}
          </h3>
          <ul className="space-y-2 text-sm">
            {quickChecks.map((q) => {
              let status: string
              if (!isStudent)
                status = L.responses.replace("{n}", String(q.responses ?? 0))
              else if (!q.mine) status = L.notTaken
              else if (q.mine.keyed === 0) status = L.openEnded
              else
                status = L.score
                  .replace("{correct}", String(q.mine.correct))
                  .replace("{total}", String(q.mine.keyed))
              return (
                <li key={q.id} className="flex flex-wrap items-center gap-2">
                  <span>{q.title}</span>
                  <Badge variant="secondary">{status}</Badge>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {polls.length > 0 && (
        <div>
          <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
            {L.polls}
          </h3>
          <ul className="space-y-4 text-sm">
            {polls.map((p) => (
              <li key={p.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{p.question}</span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {L.votes.replace("{n}", String(p.total))}
                  </span>
                </div>
                {p.options.map((opt, i) => {
                  const count = p.counts[i] ?? 0
                  const pct = p.total ? Math.round((count / p.total) * 100) : 0
                  return (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-md border px-3 py-1.5"
                    >
                      <div
                        aria-hidden
                        className="bg-primary/15 absolute inset-y-0 start-0"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex justify-between gap-2">
                        <span>{opt}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {count} · {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
