// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"
import { differenceInCalendarDays } from "date-fns"
import { ChevronDown, ClipboardList } from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
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

import type { MyAssignment } from "./my-assignments"
import { StudentSubmissionCard } from "./submission-card"

interface Props {
  assignments: MyAssignment[]
  dictionary: Dictionary
  lang: string
}

type Text = Record<string, string | undefined>

/**
 * `AssessmentType` enum values (`FINAL_EXAM`, `LAB_REPORT`, …) as the
 * dictionary's camelCase keys (`finalExam`, `labReport`). A plain
 * `.toLowerCase()` left the underscore in place, so these two types never
 * matched a key and fell back to the raw enum string in both languages.
 */
function typeKey(type: string): string {
  return type
    .toLowerCase()
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function isGraded(a: MyAssignment) {
  return (
    a.submission?.status === "GRADED" || a.submission?.status === "RETURNED"
  )
}

/**
 * `/my-assignments` (واجباتي), in the vocabulary /library, /live, /lumos and
 * the student's /exams already speak — the saas-marketing green banner, one
 * grey stat panel, then records as rows (see `shared/README.md`, "Phone
 * pattern").
 *
 * The page used to be a column of bordered cards, each followed by an open
 * hand-in form, so every assignment the student ever had cost two cards and a
 * textarea of height: on a phone the one due tomorrow sat several screens down
 * under ones marked months ago. Now it is sorted by what the student has to DO:
 *
 *   banner    the next thing due (or that everything is handed in)
 *   panel     to do · overdue · handed in · graded
 *   To do     overdue first, then by due date
 *   Handed in waiting for a mark
 *   Graded    with the score on the row
 *
 * Each row is a `<details>`: tapping it opens the brief and the same hand-in
 * card as before, in place. Native disclosure keeps the whole page a server
 * component — the hand-in card stays the only client piece on it.
 *
 * Layout is logical (`ms-`/`me-`, `text-start`) and the chevron turns on the
 * vertical axis, so /ar and /en need no direction branches.
 */
export function MyAssignmentsContent({ assignments, dictionary, lang }: Props) {
  const school = dictionary?.school as Record<string, any> | undefined
  const my = (school?.myAssignments ?? {}) as Record<string, any>
  const t = my as Text
  const stats = (my.stats ?? {}) as Text
  const sections = (my.sections ?? {}) as Text
  const when = (my.when ?? {}) as Text
  const detail = (school?.assignments?.detail ?? {}) as Record<string, unknown>
  const types = (detail.types ?? {}) as Text
  const locale = lang as Locale

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
    if (a.dueDate.getTime() < now.getTime()) return when.overdue ?? "Overdue"
    if (days <= 0) return when.today ?? "Due today"
    if (days === 1) return when.tomorrow ?? "Due tomorrow"
    return (when.inDays ?? "In {count} days").replace("{count}", String(days))
  }

  const next = upcoming[0]

  // What every row needs besides its own assignment.
  const rowProps = {
    lang: locale,
    detail,
    typeLabel: (type: string) => types[typeKey(type)] ?? type,
    pointsLabel: t.points ?? "pts",
  }

  return (
    <div className="space-y-8">
      <BrandBanner
        eyebrow={
          next
            ? `${t.title ?? "My assignments"} · ${t.nextDue ?? "Next due"} · ${whenOf(next)}`
            : (t.title ?? "My assignments")
        }
        actions={
          toDo.length > 0 ? (
            <BrandPill href={`#assignment-${(next ?? toDo[0]).id}`}>
              {t.open ?? "Open"}
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
                  formatDate(next.dueDate, locale, {
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
              {(
                t.overdueHeadline ??
                "{count} overdue — you can still hand them in"
              ).replace("{count}", String(overdue.length))}
            </strong>
          ) : (
            <>
              <strong className="font-bold">
                {t.allCaughtUp ?? "You're all caught up"}
              </strong>
              <span className="mt-1 block text-lg">
                {assignments.length === 0
                  ? (t.empty ?? "No assignments yet.")
                  : (t.allCaughtUpHint ?? "Nothing left to hand in right now.")}
              </span>
            </>
          )}
        </h1>
      </BrandBanner>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[36px] border border-dashed py-16 text-center">
          <ClipboardList
            className="text-muted-foreground size-8"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-muted-foreground max-w-[42ch] text-sm">
            {t.description ??
              "Everything your classes have set, and what you handed in."}
          </p>
        </div>
      ) : (
        <>
          <StatPanel
            className="md:max-w-2xl"
            items={[
              {
                key: "toDo",
                label: stats.toDo ?? "To do",
                value: upcoming.length,
              },
              {
                key: "overdue",
                label: stats.overdue ?? "Overdue",
                value: overdue.length,
                tone: overdue.length > 0 ? "negative" : "default",
              },
              {
                key: "handedIn",
                label: stats.handedIn ?? "Handed in",
                value: handedIn.length,
                tone: "info",
              },
              {
                key: "graded",
                label: stats.graded ?? "Graded",
                value: graded.length,
                tone: "positive",
              },
            ]}
          />

          <AssignmentSection
            title={sections.toDo ?? "To do"}
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
                defaultOpen={a.id === next?.id}
                {...rowProps}
              />
            )}
          />

          <AssignmentSection
            title={sections.handedIn ?? "Handed in"}
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
                      ? ((detail.submittedLate as string) ?? "Submitted late")
                      : ((detail.submitted as string) ?? "Submitted")}
                  </Badge>
                }
                {...rowProps}
              />
            )}
          />

          <AssignmentSection
            title={sections.graded ?? "Graded"}
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
 * is the brief and the hand-in card.
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
  typeLabel,
  pointsLabel,
}: {
  assignment: MyAssignment
  badge?: ReactNode
  trailing?: ReactNode
  defaultOpen?: boolean
  lang: Locale
  detail: Record<string, unknown>
  typeLabel: (type: string) => string
  pointsLabel: string
}) {
  return (
    <details
      id={`assignment-${a.id}`}
      open={defaultOpen}
      className="group scroll-mt-24 py-0.5"
    >
      <summary className="focus-visible:ring-ring cursor-pointer list-none rounded-[10px] outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
        <ListRow
          art={
            <DateTile
              weekday={formatDate(a.dueDate, lang, { weekday: "short" })}
              day={formatDate(a.dueDate, lang, { day: "numeric" })}
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
          <p className="whitespace-pre-wrap">{a.description}</p>
        ) : null}
        {a.instructions ? (
          <p
            className={cn(
              "text-muted-foreground text-sm whitespace-pre-wrap",
              !a.description && "pt-1"
            )}
          >
            {a.instructions}
          </p>
        ) : null}
        <StudentSubmissionCard
          assignmentId={a.id}
          existing={a.submission}
          labels={detail}
          locale={lang}
          className="bg-muted rounded-xl border-0 shadow-none"
        />
      </div>
    </details>
  )
}
