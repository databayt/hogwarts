// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: no client hooks or handlers.

import { auth } from "@/auth"
import { History } from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { LandingSessionCard } from "./session-card"
import type {
  LandingSectionProps,
  LandingSession,
  LandingViewer,
} from "./types"

interface CatchUpShelfProps extends LandingSectionProps {
  sessions: LandingSession[]
  viewer: LandingViewer
}

/**
 * Catch up — the classes that already ran and that this reader was not in.
 *
 * It replaces a "past classes" shelf that listed the last two ended sessions
 * beside a grid of subject tiles. Two problems with that, and this section is
 * the answer to both. It showed the same rows to a student who had sat through
 * every one of them as to one who had missed the week, because nothing in it
 * consulted presence; and the subject tiles answered "what has been taught
 * live", which is a question an admin might ask and a student never does.
 *
 * So the rows are now MISSED classes — `getLiveLandingCatchUp` excludes any
 * session the reader (or, for a guardian, their children) actually joined —
 * and they are one horizontally scrolling row of cards rather than a
 * two-column block. A shelf you scroll is the right shape for a backlog: it
 * holds twelve without pushing the rest of the page down, and it says by its
 * form that there is more to the side.
 *
 * The scroller is the house one, the same markup lumos uses for its course
 * shelves and Continue Watching: `no-scrollbar` with a negative margin and
 * matching padding, so a card's hover ring is not clipped by `overflow-x-auto`
 * while the first card still lines up with the page's edge. Nothing here is
 * direction-aware — `overflow-x-auto` follows the document's `dir`, so an
 * Arabic reader scrolls from the right with no transform of ours.
 */
export async function LiveCatchUpShelf({
  dictionary,
  lang,
  sessions,
  viewer,
}: CatchUpShelfProps) {
  const c = dictionary?.landing?.catchUp
  const homeworkDue = viewer.isHost
    ? new Set<string>()
    : await sessionsWithHomeworkDue(sessions.map((s) => s.id)).catch(
        () => new Set<string>()
      )

  return (
    <section className="mb-16 flex w-full flex-col gap-y-4 border-b pb-16">
      {/* The heading is an ICON and nothing else. The cards under it already
          read as classes that have been and gone — each one carries a past
          date — so a printed "Catch up" over them was labelling what the
          reader could see, and a "More" beside it pointed at the sessions
          table the banner links to twice already.

          The words survive for anyone who cannot see the icon: the section is
          named by a visually-hidden heading, so a screen reader still hears
          which shelf this is instead of an unlabelled list of links. */}
      <h2 className="sr-only mb-0">{c?.title}</h2>
      <History className="size-6 shrink-0" aria-hidden="true" />

      <ul className="no-scrollbar -mx-2 flex gap-4 overflow-x-auto px-2 pb-2">
        {sessions.map((session) => (
          <li key={session.id} className="relative w-56 shrink-0 sm:w-64">
            <LandingSessionCard
              session={session}
              dictionary={dictionary}
              lang={lang}
              viewer={viewer}
            />
            {homeworkDue.has(session.id) && (
              <span className="pointer-events-none absolute end-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-black shadow">
                {c?.homeworkDue ?? "Homework due"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Missed classes that left homework still due — for a student, homework they
 * have not handed in yet. A class you missed is exactly where homework gets
 * missed too, so the shelf says so on the card.
 */
async function sessionsWithHomeworkDue(
  sessionIds: string[]
): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set()
  const [{ schoolId, role }, session] = await Promise.all([
    getTenantContext(),
    auth(),
  ])
  if (!schoolId) return new Set()

  const student =
    role === "STUDENT" && session?.user?.id
      ? await db.student.findFirst({
          where: { schoolId, userId: session.user.id },
          select: { id: true },
        })
      : null

  const rows = await db.conferenceResource.findMany({
    where: {
      schoolId,
      sessionId: { in: sessionIds },
      schoolAssignment: {
        dueDate: { gte: new Date() },
        ...(student
          ? {
              submissions: {
                none: {
                  studentId: student.id,
                  status: {
                    in: ["SUBMITTED", "LATE_SUBMITTED", "GRADED", "RETURNED"],
                  },
                },
              },
            }
          : {}),
      },
    },
    select: { sessionId: true },
  })
  return new Set(rows.map((r) => r.sessionId))
}
