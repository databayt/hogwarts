// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { typography } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { describeAttendanceSync } from "@/components/school-dashboard/conference/actions/attendance-sync"
import { getLiveClass } from "@/components/school-dashboard/conference/actions/sessions"
import { EndClassButton } from "@/components/school-dashboard/conference/end-class-button"
import { isRecordingConfigured } from "@/components/school-dashboard/conference/livekit/client"
import {
  getAttendanceSyncEnabled,
  getLessonReferenceContent,
  type LessonReferenceContent,
} from "@/components/school-dashboard/conference/queries"

interface Props {
  id: string
  locale: string
  dictionary: Dictionary
}

// Catalog lesson content (videos/attachments/materials) is validated by other
// blocks' weaker schemas — bare `.url()` admits `javascript:`/`data:`, and
// material.externalUrl isn't URL-validated at all. Re-check the scheme here
// before rendering as an <a href> (same threat model as meetingUrl).
function safeHttpUrl(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null
}

function formatWhen(d: Date | string, locale: string): string {
  const date = typeof d === "string" ? new Date(d) : d
  try {
    return date.toLocaleString(locale === "ar" ? "ar-AE" : "en-AE", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return date.toISOString()
  }
}

function formatDay(d: Date | string, locale: string): string {
  const date = typeof d === "string" ? new Date(d) : d
  try {
    return date.toLocaleDateString(locale === "ar" ? "ar-AE" : "en-AE", {
      dateStyle: "medium",
    })
  } catch {
    return date.toISOString()
  }
}

export async function LiveClassDetailContent({
  id,
  locale,
  dictionary,
}: Props) {
  const result = await getLiveClass(id)
  if (!("success" in result) || !result.success) {
    notFound()
  }
  const session = result.data

  const t = dictionary?.liveClasses
  const r = t?.references

  const canJoin = session.status === "live" || session.status === "scheduled"
  // "Enabled" on a session that can never produce an MP4 is a lie the teacher
  // discovers on an empty recordings page. The bucket gate decides the label.
  const recordingAvailable = isRecordingConfigured()
  const isExternal = session.provider === "external"

  /** Roles that can open the manual register (mirrors /attendance/manual). */
  const ATTENDANCE_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
  const at = t?.attendanceNote
  const { schoolId: tenantSchoolId, role: viewerRole } =
    await getTenantContext()
  const attendanceMode = tenantSchoolId
    ? describeAttendanceSync(
        session,
        await getAttendanceSyncEnabled(tenantSchoolId)
      )
    : "disabled"
  // Only the roles that can actually open the manual register get the link.
  const canMarkAttendance = ATTENDANCE_ROLES.includes(viewerRole ?? "")

  // End is offered only while a class is actually running, to the roles the
  // PERMISSION_MATRIX lets end one — and, for a TEACHER, only on their OWN
  // class, mirroring the ownership check inside `endLiveClass`. Rendering a
  // button the server will refuse is worse than rendering none.
  const END_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"]
  const viewerUserId = (await auth())?.user?.id
  const canEnd =
    session.status === "live" &&
    END_ROLES.includes(viewerRole ?? "") &&
    (viewerRole !== "TEACHER" || session.teacher?.userId === viewerUserId)

  // The linked catalog lesson's teachable content (videos, materials,
  // practice questions) — one FK, whole payload.
  let lessonContent: LessonReferenceContent | null = null
  if (session.catalogLessonId) {
    try {
      // schoolId scopes the contributed content: without it the listing
      // showed every school's private and unapproved videos/materials.
      lessonContent = tenantSchoolId
        ? await getLessonReferenceContent(
            session.catalogLessonId,
            tenantSchoolId
          )
        : null
    } catch {
      lessonContent = null
    }
  }

  const examResources = session.resources.filter((x) => x.schoolExam)
  const assignmentResources = session.resources.filter(
    (x) => x.schoolAssignment
  )
  const linkResources = session.resources.filter((x) => x.url)

  const hasReferences =
    Boolean(session.catalogLesson) ||
    examResources.length > 0 ||
    assignmentResources.length > 0 ||
    linkResources.length > 0

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={typography.h2}>{session.title}</h1>
          <p className={typography.muted}>
            {formatWhen(session.scheduledStart, locale)} —{" "}
            {formatWhen(session.scheduledEnd, locale)}
          </p>
        </div>
        <Badge>{t?.status?.[session.status] ?? session.status}</Badge>
      </div>

      {session.description && (
        <p className={typography.p}>{session.description}</p>
      )}

      <dl className="grid grid-cols-2 gap-4 text-sm">
        {session.section && (
          <div>
            <dt className="text-muted-foreground">
              {t?.labels?.section ?? "Section"}
            </dt>
            <dd>{session.section.name}</dd>
          </div>
        )}
        {session.subject && (
          <div>
            <dt className="text-muted-foreground">
              {t?.labels?.subject ?? "Subject"}
            </dt>
            <dd>{session.subject.name}</dd>
          </div>
        )}
        {session.teacher && (
          <div>
            <dt className="text-muted-foreground">
              {t?.labels?.teacher ?? "Teacher"}
            </dt>
            <dd>
              {session.teacher.firstName} {session.teacher.lastName}
            </dd>
          </div>
        )}
        {session.timetable?.classroom?.roomName && (
          <div>
            <dt className="text-muted-foreground">
              {t?.labels?.room ?? "Room"}
            </dt>
            {/* The class still meets here; this session is its online arm. */}
            <dd>{session.timetable.classroom.roomName}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">
            {t?.labels?.visibility ?? "Who can join"}
          </dt>
          <dd>
            {session.visibility === "school"
              ? (t?.labels?.visibilitySchool ?? "Whole school")
              : (t?.labels?.visibilitySection ?? "Section only")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t?.labels?.recording ?? "Recording"}
          </dt>
          <dd>
            {!recordingAvailable
              ? (t?.labels?.recordingUnavailable ?? "Not available")
              : session.recordingEnabled
                ? (t?.labels?.enabled ?? "Enabled")
                : (t?.labels?.disabled ?? "Disabled")}
          </dd>
        </div>
      </dl>

      {/* How attendance is handled for THIS session. An external meeting emits
          no presence, so an online school running on pasted links has manual
          marking as its only path — say so here rather than let a teacher find
          out from an empty register. */}
      {session.sectionId && (
        <div className="text-muted-foreground rounded-lg border p-4 text-sm">
          <p>
            {attendanceMode === "auto"
              ? (at?.auto ??
                "Attendance is marked automatically when this class ends.")
              : attendanceMode === "external_provider"
                ? (at?.external ??
                  "This class runs on an external meeting link, which carries no attendance data. Mark attendance as usual.")
                : attendanceMode === "no_section_or_timetable"
                  ? (at?.unanchored ??
                    "This class is not tied to a timetable period, so attendance is not recorded against one.")
                  : (at?.disabled ??
                    "Automatic attendance is turned off for this school. Mark attendance as usual.")}
          </p>
          {attendanceMode !== "auto" && canMarkAttendance && (
            <Link
              className="mt-2 inline-block underline underline-offset-4"
              href={`/${locale}/attendance/manual`}
            >
              {at?.markLink ?? "Go to attendance"}
            </Link>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {canJoin &&
          (isExternal ? (
            session.meetingUrl ? (
              <Button asChild>
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t?.actions?.openMeeting ?? t?.actions?.join ?? "Join"}
                </a>
              </Button>
            ) : null
          ) : (
            <Button asChild>
              <Link href={`/${locale}/conference/${session.id}/room`}>
                {t?.actions?.join ?? "Join"}
              </Link>
            </Button>
          ))}
        {canEnd && (
          <EndClassButton
            sessionId={session.id}
            label={t?.actions?.end ?? "End class"}
            confirmLabel={t?.actions?.endConfirm ?? "End for everyone?"}
            pendingLabel={t?.actions?.ending ?? "Ending…"}
            errorLabel={t?.actions?.endError ?? "Couldn't end the class"}
          />
        )}
        {session.status === "ended" && (
          <Button asChild variant="outline">
            <Link href={`/${locale}/conference/${session.id}/recordings`}>
              {t?.actions?.viewRecordings ?? "View recordings"}
            </Link>
          </Button>
        )}
      </div>

      {hasReferences && (
        <section className="space-y-4 rounded-lg border p-4">
          <h2 className={typography.h4}>{r?.title ?? "Lesson & references"}</h2>

          {session.catalogLesson && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {t?.labels?.lesson ?? "Lesson"}
                </span>
                <Badge variant="outline">{session.catalogLesson.name}</Badge>
                {lessonContent && lessonContent.questionCount > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {lessonContent.questionCount}{" "}
                    {r?.practiceQuestions ?? "practice questions"}
                  </span>
                )}
              </div>

              {lessonContent && lessonContent.videos.length > 0 && (
                <div>
                  <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                    {r?.videos ?? "Videos"}
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {lessonContent.videos.map((v) => {
                      const href = safeHttpUrl(v.videoUrl)
                      return (
                        <li key={v.id}>
                          {href ? (
                            <a
                              className="underline underline-offset-2"
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {v.title}
                            </a>
                          ) : (
                            <span>{v.title}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {lessonContent &&
                (lessonContent.attachments.length > 0 ||
                  lessonContent.materials.length > 0) && (
                  <div>
                    <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                      {r?.materials ?? "Materials"}
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {lessonContent.attachments.map((a) => {
                        const href = safeHttpUrl(a.url)
                        return (
                          <li key={a.id}>
                            {href ? (
                              <a
                                className="underline underline-offset-2"
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {a.name}
                              </a>
                            ) : (
                              <span>{a.name}</span>
                            )}
                          </li>
                        )
                      })}
                      {lessonContent.materials.map((m) => {
                        const href = safeHttpUrl(m.fileUrl ?? m.externalUrl)
                        return (
                          <li key={m.id}>
                            {href ? (
                              <a
                                className="underline underline-offset-2"
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {m.title}
                              </a>
                            ) : (
                              <span>{m.title}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {examResources.length > 0 && (
            <div>
              <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                {r?.exams ?? "Exams & quizzes"}
              </h3>
              <ul className="space-y-1 text-sm">
                {examResources.map((x) => (
                  <li key={x.id} className="flex items-center gap-2">
                    <span>{x.schoolExam!.title}</span>
                    <Badge variant="secondary">{x.schoolExam!.examType}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDay(x.schoolExam!.examDate, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assignmentResources.length > 0 && (
            <div>
              <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                {r?.assignments ?? "Assignments"}
              </h3>
              <ul className="space-y-1 text-sm">
                {assignmentResources.map((x) => (
                  <li key={x.id} className="flex items-center gap-2">
                    <span>{x.schoolAssignment!.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDay(x.schoolAssignment!.dueDate, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {linkResources.length > 0 && (
            <div>
              <h3 className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                {r?.links ?? "Links"}
              </h3>
              <ul className="space-y-1 text-sm">
                {linkResources.map((x) => (
                  <li key={x.id}>
                    <a
                      className="underline underline-offset-2"
                      href={x.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {x.title || x.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
