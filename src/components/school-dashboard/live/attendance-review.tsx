// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"

import { schoolNameDisplay } from "@/lib/school-name-format"
import { getTenantContext } from "@/lib/tenant-context"
import { typography } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { loadAttendanceReview } from "./attendance-review-load"
import { AttendanceReviewStatus } from "./attendance-review-status"

function formatTime(d: Date | null, locale: string): string {
  if (!d) return ""
  try {
    return d.toLocaleTimeString(locale === "ar" ? "ar-AE" : "en-AE", {
      timeStyle: "short",
    })
  } catch {
    return d.toISOString().slice(11, 16)
  }
}

/**
 * After the class, for its host and the school's admins: the roster with when
 * each student joined and left, how long they were connected, and the
 * period's mark — correctable inline. Renders nothing for anyone else.
 *
 * Replaces the teacher's only path before it: a link to the whole-school
 * manual register, where they had to find the section, the day and the period
 * again, with no presence to go on.
 */
export async function AttendanceReview({
  sessionId,
  locale,
  dictionary,
}: {
  sessionId: string
  locale: string
  dictionary: Dictionary
}) {
  const [tenant, session] = await Promise.all([getTenantContext(), auth()])
  // A section of the class page, not the page: a failed read hides the
  // register instead of taking the session down with it.
  const review = await loadAttendanceReview(
    sessionId,
    {
      userId: session?.user?.id,
      role: tenant.role,
      schoolId: tenant.schoolId,
    },
    await schoolNameDisplay(tenant.schoolId)
  ).catch((err) => {
    console.error("[conference] attendance review failed", {
      sessionId,
      err: err instanceof Error ? err.message : err,
    })
    return null
  })
  if (!review) return null

  const t = dictionary?.liveClasses?.attendanceReview
  const statusLabels: Record<string, string> = {
    PRESENT: t?.statuses?.PRESENT ?? "Present",
    LATE: t?.statuses?.LATE ?? "Late",
    ABSENT: t?.statuses?.ABSENT ?? "Absent",
    EXCUSED: t?.statuses?.EXCUSED ?? "Excused",
    SICK: t?.statuses?.SICK ?? "Sick",
    HOLIDAY: t?.statuses?.HOLIDAY ?? "Holiday",
  }
  const joinedCount = review.rows.filter((r) => r.joinedAt).length

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={typography.h4}>{t?.title ?? "Attendance"}</h2>
        {review.hasPresence && (
          <p className={typography.muted}>
            {(t?.joinedOf ?? "{joined} of {total} joined")
              .replace("{joined}", String(joinedCount))
              .replace("{total}", String(review.rows.length))}
          </p>
        )}
      </div>

      {review.hasPresence && review.emptyRoom && (
        <p className="text-muted-foreground text-sm">
          {t?.emptyRoom ??
            "No student joined this class, so attendance was not written automatically. Mark it below or in the register."}
        </p>
      )}
      {!review.periodId && (
        <p className="text-muted-foreground text-sm">
          {t?.noPeriod ??
            "This class is not tied to a timetable period, so marks are kept in the register."}{" "}
          <Link
            className="underline underline-offset-4"
            href={`/${locale}/attendance/manual`}
          >
            {dictionary?.liveClasses?.attendanceNote?.markLink ??
              "Go to attendance"}
          </Link>
        </p>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t?.student ?? "Student"}</TableHead>
              {review.hasPresence && (
                <>
                  <TableHead>{t?.joined ?? "Joined"}</TableHead>
                  <TableHead>{t?.left ?? "Left"}</TableHead>
                  <TableHead>{t?.minutes ?? "Minutes"}</TableHead>
                </>
              )}
              <TableHead>{t?.status ?? "Status"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {review.rows.map((r) => (
              <TableRow key={r.studentId}>
                <TableCell>
                  <bdi dir="auto">{r.name}</bdi>
                </TableCell>
                {review.hasPresence && (
                  <>
                    <TableCell className="tabular-nums">
                      {r.joinedAt ? formatTime(r.joinedAt, locale) : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.joinedAt
                        ? r.leftAt
                          ? formatTime(r.leftAt, locale)
                          : (t?.stillIn ?? "Still in")
                        : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.joinedAt ? r.minutes : "—"}
                    </TableCell>
                  </>
                )}
                <TableCell>
                  {review.canEdit ? (
                    <AttendanceReviewStatus
                      sessionId={review.sessionId}
                      studentId={r.studentId}
                      studentName={r.name}
                      status={r.status}
                      statusLabels={statusLabels}
                      placeholder={t?.notMarked ?? "Not marked"}
                      savedLabel={t?.saved ?? "Attendance updated"}
                      errorLabel={t?.failed ?? "Could not update attendance"}
                    />
                  ) : r.status ? (
                    <Badge variant="outline">
                      {statusLabels[r.status] ?? r.status}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">
                      {t?.notMarked ?? "Not marked"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
