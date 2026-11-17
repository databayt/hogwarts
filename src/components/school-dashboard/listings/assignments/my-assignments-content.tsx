// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"
import Link from "next/link"
import { differenceInCalendarDays } from "date-fns"
import { ChevronDown, ClipboardList } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  BrandBanner,
  BrandPill,
  DateTile,
  ListRow,
  SectionHeader,
  StatPanel,
} from "@/components/school-dashboard/shared"

import { AssignmentAttachments } from "./assignment-attachments"
import { formatAssignmentDate } from "./date"
import { typeLabel as lookupType } from "./labels"
import type { MyAssignment } from "./my-assignments"
import { FamilySubmissionStatus } from "./family-submission"
import { StudentSubmissionCard } from "./submission-card"

interface Props {
  assignments: MyAssignment[]
  dictionary: Dictionary
  lang: string
  /** `student` hands in; `guardian` reads a child's list and cannot. */
  mode?: "student" | "guardian"
  /** The child being read (guardian mode) — named in the banner. */
  childName?: string
  /** Appended to detail links so the detail page opens for the same child. */
  childId?: string
  /** The child switcher, rendered between the banner and the list. */
  switcher?: ReactNode
}

type Text = Record<string, string | undefined>

function isGraded(a: MyAssignment) {
  return (
    a.submission?.status === "GRADED" || a.submission?.status === "RETURNED"
  )
}

/**
 * The student's (and, read-only, a guardian's) side of `/assignments`, in the
 * vocabulary /library, /live, /lumos and the student's /exams already speak —
 * the saas-marketing green banner, one grey stat panel, then records as rows
 * (see `shared/README.md`, "Phone pattern").
 *
 * Sorted by what there is to DO:
 *
 *   banner    the next thing due (or that everything is handed in)
 *   panel     to do · overdue · handed in · graded
 *   To do     overdue first, then by due date
 *   Handed in waiting for a mark
 *   Graded    with the score on the row
 *
 * Each row is a `<details>`: tapping it opens the brief and — for a student —
 * the hand-in card, in place. Native disclosure keeps the whole page a server
 * component; the hand-in card is the only client piece on it.
 *
 * Layout is logical (`ms-`/`me-`, `text-start`) and the chevron turns on the
 * vertical axis, so /ar and /en need no direction branches. Copy comes from
 * `school.assignments.student`, with `school.assignments.guardian` laid over
 * it for the guardian's wording.
 */
export function MyAssignmentsContent({
  assignments,
  dictionary,
  lang,
  mode = "student",
  childName,
  childId,
  switcher,
}: Props) {
  const school = dictionary?.school as Record<string, any> | undefined
  const root = (school?.assignments ?? {}) as Record<string, any>
  const own = (root.student ?? {}) as Record<string, any>
  const over = (mode === "guardian" ? (root.guardian ?? {}) : {}) as Record<
    string,
    any
  >
  const t = { ...own, ...over } as Text
  const stats = { ...(own.stats ?? {}), ...(over.stats ?? {}) } as Text
  const sections = { ...(own.sections ?? {}), ...(over.sections ?? {}) } as Text
  const when = { ...(own.when ?? {}) } as Text
  const detail = (root.detail ?? {}) as Record<string, unknown>
  const types = (detail.types ?? {}) as Text
  const locale = lang as Locale
  const readOnly = mode === "guardian"

  // A guardian with no linked child has no name to put in the title.
  const noChild = readOnly && !childId
  const title = childName
    ? (t.title ?? "").replace("{name}", childName)
    : (root.title ?? "")

  const now = new Date()
  const daysUntil = (a: MyAssignment) =>
    differenceInCalendarDays(a.dueDate, now)

  const pending = assignments.filter((a) => !a.submission?.submittedAt)
  const overdue = pending
    .filter((a) => a.dueDate.getTime() < now.getTime())
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  const upcoming = pending
    .filter((a) => a.dueDate.getTime() >= now.getTime())
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  const toDo = [...overdue, ...upcoming]
  const graded = assignments.filter(isGraded)
  const handedIn = assignments.filter(
    (a) => a.submission?.submittedAt && !isGraded(a)
  )

  const whenOf = (a: MyAssignment) => {
    const days = daysUntil(a)
    if (a.dueDate.getTime() < now.getTime()) return when.overdue ?? ""
    if (days <= 0) return when.today ?? ""
    if (days === 1) return when.tomorrow ?? ""
    return (when.inDays ?? "").replace("{count}", String(days))
  }

  const next = upcoming[0]
  const detailQuery = childId ? `?child=${encodeURIComponent(childId)}` : ""

  // What every row needs besides its own assignment.
  const rowProps = {
    lang: locale,
    detail,
    readOnly,
    detailHref: (id: string) => `/${lang}/assignments/${id}${detailQuery}`,
    typeLabel: (type: string) => lookupType(types, type),
    pointsLabel: t.points ?? "",
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <BrandBanner
        className="px-5 py-8 sm:px-8 sm:py-10"
        eyebrow={
          next ? `${title} · ${t.nextDue ?? ""} · ${whenOf(next)}` : title
        }
        actions={
          toDo.length > 0 ? (
            <BrandPill href={`#assignment-${(next ?? toDo[0]).id}`}>
              {t.open ?? ""}
            </BrandPill>
          ) : undefined
        }
      >
        <h1>
          {next ? (
            <>
              <strong className="font-bold">{next.title}</strong>
              <span className="mt-1 block text-lg">
                {[
                  next.subjectName ?? next.className,
                  formatAssignmentDate(next.dueDate, lang, {
                    day: "numeric",
                    month: "long",
                  }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </>
          ) : overdue.length > 0 ? (
            <strong className="font-bold">
              {(t.overdueHeadline ?? "").replace(
                "{count}",
                String(overdue.length)
              )}
            </strong>
          ) : (
            <>
              <strong className="font-bold">{t.allCaughtUp ?? ""}</strong>
              <span className="mt-1 block text-lg">
                {assignments.length === 0
                  ? noChild
                    ? t.noChildren
                    : t.empty
                  : t.allCaughtUpHint}
              </span>
            </>
          )}
        </h1>
      </BrandBanner>

      {switcher}

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[36px] border border-dashed px-4 py-12 text-center sm:py-16">
          <ClipboardList
            className="text-muted-foreground size-8"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-muted-foreground max-w-[42ch] text-sm">
            {noChild ? t.noChildren : t.description}
          </p>
        </div>
      ) : (
        <>
          <StatPanel
            className="md:max-w-2xl"
            items={[
              {
                key: "toDo",
                label: stats.toDo ?? "",
                value: upcoming.length,
              },
              {
                key: "overdue",
                label: stats.overdue ?? "",
                value: overdue.length,
                tone: overdue.length > 0 ? "negative" : "default",
              },
              {
                key: "handedIn",
                label: stats.handedIn ?? "",
                value: handedIn.length,
                tone: "info",
              },
              {
                key: "graded",
                label: stats.graded ?? "",
                value: graded.length,
                tone: "positive",
              },
            ]}
          />

          <AssignmentSection
            title={sections.toDo ?? ""}
            description={sections.toDoHint}
            rows={toDo}
            renderRow={(a) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                badge={
                  <Badge
                    variant={
                      a.dueDate.getTime() < now.getTime() || daysUntil(a) <= 0
                        ? "destructive"
                        : "secondary"
                    }
                    className="font-normal"
                  >
                    {whenOf(a)}
                  </Badge>
                }
                defaultOpen={!readOnly && a.id === next?.id}
                {...rowProps}
              />
            )}
          />

          <AssignmentSection
            title={sections.handedIn ?? ""}
            description={sections.handedInHint}
            rows={handedIn}
            renderRow={(a) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                badge={
                  <Badge
                    variant={
                      a.submission?.status === "LATE_SUBMITTED"
                        ? "destructive"
                        : "secondary"
                    }
                    className="font-normal"
                  >
                    {a.submission?.status === "LATE_SUBMITTED"
                      ? (detail.submittedLate as string)
                      : (detail.submitted as string)}
                  </Badge>
                }
                {...rowProps}
              />
            )}
          />

          <AssignmentSection
            title={sections.graded ?? ""}
            rows={graded}
            renderRow={(a) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                trailing={
                  a.submission?.score != null ? (
                    <span className="text-lg leading-6 font-bold">
                      {a.submission.score}
                      <span className="text-muted-foreground text-xs font-normal">
                        /{a.totalPoints}
                      </span>
                    </span>
                  ) : undefined
                }
                {...rowProps}
              />
            )}
          />
        </>
      )}
    </div>
  )
}

function AssignmentSection({
  title,
  description,
  rows,
  renderRow,
}: {
  title: string
  description?: string
  rows: MyAssignment[]
  renderRow: (a: MyAssignment) => ReactNode
}) {
  // An empty section is not rendered: "Graded" with nothing under it is a
  // heading that says nothing, the same rule /live applies to its shelves.
  if (rows.length === 0) return null
  return (
    <section>
      <SectionHeader title={title} description={description} />
      <div className="divide-border flex flex-col divide-y">
        {rows.map(renderRow)}
      </div>
    </section>
  )
}

/**
 * One assignment: the kit's `ListRow` (due-date tile, title with its status
 * badge, subject, type · points) as the `<summary>` of a disclosure whose body
 * is the brief and the hand-in card (a guardian gets the status instead).
 *
 * `id` is the banner pill's anchor; `scroll-mt` keeps the row clear of the
 * sticky header when the pill jumps to it.
 */
function AssignmentRow({
  assignment: a,
  badge,
  trailing,
  defaultOpen = false,
  lang,
  detail,
  readOnly,
  detailHref,
  typeLabel,
  pointsLabel,
}: {
  assignment: MyAssignment
  badge?: ReactNode
  trailing?: ReactNode
  defaultOpen?: boolean
  lang: Locale
  detail: Record<string, unknown>
  readOnly: boolean
  detailHref: (id: string) => string
  typeLabel: (type: string) => string
  pointsLabel: string
}) {
  return (
    <details
      id={`assignment-${a.id}`}
      open={defaultOpen}
      className="group scroll-mt-24 py-0.5"
    >
      <summary className="focus-visible:ring-ring min-h-11 cursor-pointer list-none rounded-[10px] outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
        <ListRow
          art={
            <DateTile
              weekday={formatAssignmentDate(a.dueDate, lang, {
                weekday: "short",
              })}
              day={formatAssignmentDate(a.dueDate, lang, { day: "numeric" })}
            />
          }
          title={a.title}
          badge={badge}
          description={
            [a.subjectName, a.className].filter(Boolean).join(" · ") ||
            undefined
          }
          meta={
            <span className="tabular-nums">
              {typeLabel(a.type)} · {a.totalPoints} {pointsLabel}
            </span>
          }
          trailing={
            <span className="flex items-center gap-2">
              {trailing}
              <ChevronDown
                className="text-muted-foreground/60 size-4 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </span>
          }
          className="hover:bg-muted/60"
        />
      </summary>

      <div className="space-y-3 pt-2 pb-4 md:ps-[68px]">
        {a.description ? (
          <p className="break-words whitespace-pre-wrap">{a.description}</p>
        ) : null}
        {a.instructions ? (
          <p
            className={cn(
              "text-muted-foreground text-sm break-words whitespace-pre-wrap",
              !a.description && "pt-1"
            )}
          >
            {a.instructions}
          </p>
        ) : null}
        <AssignmentAttachments
          links={a.attachmentLinks}
          label={detail?.attachments as string | undefined}
        />
        {readOnly ? (
          <FamilySubmissionStatus
            submission={a.submission}
            labels={detail}
            lang={lang}
            totalPoints={a.totalPoints}
          />
        ) : (
          <StudentSubmissionCard
            assignmentId={a.id}
            existing={a.submission}
            labels={detail}
            locale={lang}
            className="bg-muted rounded-xl border-0 shadow-none"
          />
        )}
        <Link
          href={detailHref(a.id)}
          className="text-primary focus-visible:ring-ring inline-flex min-h-11 items-center rounded-md text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2"
        >
          {(detail.viewDetails as string) ?? ""}
        </Link>
      </div>
    </details>
  )
}
