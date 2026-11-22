// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"
import { getTenantContext } from "@/lib/tenant-context"
import { typography } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { requireContext } from "@/components/school-dashboard/live/actions/helpers"
import { AndroidAppCard } from "@/components/school-dashboard/live/android-app-card"
import { AttendanceReview } from "@/components/school-dashboard/live/attendance-review"
import {
  ClassLinkForm,
  RemoveClassLinkButton,
} from "@/components/school-dashboard/live/class-link-form"
import { resolveClassLinkLabels } from "@/components/school-dashboard/live/class-link-labels"
import { ClassWork } from "@/components/school-dashboard/live/class-work"
import { DEFAULT_SCHOOL_TZ } from "@/components/school-dashboard/live/day-window"
import { loadLiveClassDetail } from "@/components/school-dashboard/live/detail-load"
import { EndClassButton } from "@/components/school-dashboard/live/end-class-button"
import { MakeupBadge } from "@/components/school-dashboard/live/makeup-badge"
import { loadNextClassToday } from "@/components/school-dashboard/live/next-class"
import {
  NextClassCard,
  resolveNextClassLabels,
} from "@/components/school-dashboard/live/next-class-card"
import {
  CancelMakeupButton,
  MakeupSheet,
} from "@/components/school-dashboard/live/makeup-sheet"
import { resolveRoomLabels } from "@/components/school-dashboard/live/room/labels"
import { SessionState } from "@/components/school-dashboard/live/session-state"

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

// In the SCHOOL's zone: this renders on the server, whose zone is UTC, so a
// bare toLocaleString printed every class two hours early for Khartoum.
function formatWhen(
  d: Date | string,
  locale: string,
  timeZone: string
): string {
  const date = typeof d === "string" ? new Date(d) : d
  try {
    return date.toLocaleString(locale === "ar" ? "ar-AE" : "en-AE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    })
  } catch {
    return date.toISOString()
  }
}

function formatDay(d: Date | string, locale: string, timeZone: string): string {
  const date = typeof d === "string" ? new Date(d) : d
  try {
    return date.toLocaleDateString(locale === "ar" ? "ar-AE" : "en-AE", {
      dateStyle: "medium",
      timeZone,
    })
  } catch {
    return date.toISOString()
  }
}

export async function LiveClassDetailContent({
  id,
  locale,
  dictionary,
  plain = false,
}: Props & { plain?: boolean }) {
  const tenant = await getTenantContext()
  const viewerId = (await auth())?.user?.id
  const detail = await loadLiveClassDetail(
    id,
    {
      userId: viewerId,
      role: tenant.role,
      schoolId: tenant.schoolId,
    },
    requireContext
  )
  if (!detail) {
    notFound()
  }
  const [nameDisplay, school] = await Promise.all([
    schoolNameDisplay(tenant.schoolId),
    tenant.schoolId
      ? db.school.findUnique({
          where: { id: tenant.schoolId },
          select: { timezone: true },
        })
      : null,
  ])
  const timeZone = school?.timezone || DEFAULT_SCHOOL_TZ
  const {
    session,
    canJoin,
    recordingState,
    recordingAvailable,
    isExternal,
    attendanceMode,
    canMarkAttendance,
    canEnd,
    makeup,
    lessonContent,
    examResources,
    assignmentResources,
    linkResources,
    hasReferences,
  } = detail
  const lessonHref = detail.lessonHref ? `/${locale}${detail.lessonHref}` : null

  // A class that has not ended opens on its room card — the poster, Join, and
  // the shelves under it — for anyone who may walk in. This page used to be
  // where every link to an upcoming class landed, so a reader following the
  // banner or a shared link met a plain fact sheet instead of the class
  // (reported 2026-11-11). What this page is FOR starts when the class ends:
  // the register, the class work, the recording. External sessions have no
  // room card; they stay here.
  if (!plain && canJoin && !isExternal) {
    redirect(`/${locale}/live/${session.id}/room`)
  }

  // A class that is over leads somewhere: the reader's next period today.
  // "Over" includes a class whose bell has rung but whose row is still open —
  // a teacher who steps out at the bell lands here a minute before the row
  // closes, and that minute is when she needs the way to her next class.
  const bellRung =
    !!session.scheduledEnd &&
    new Date(session.scheduledEnd).getTime() <= Date.now()
  const nextClass =
    (session.status === "ended" ||
      session.status === "cancelled" ||
      bellRung) &&
    viewerId &&
    tenant.schoolId
      ? await loadNextClassToday({
          schoolId: tenant.schoolId,
          userId: viewerId,
          role: tenant.role,
          afterTimetableId: session.timetableId,
        }).catch(() => null)
      : null

  const t = dictionary?.liveClasses
  const r = t?.references
  const linkLabels = resolveClassLinkLabels(t?.classLink)
  const st = t?.states
  const at = t?.attendanceNote
  const mk = t?.makeup
  // The missed class a make-up replaces is the ROOT a re-plan books against.
  const rootId = makeup.replaces?.id ?? session.id

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={typography.h2}>{session.title}</h1>
          <p className={typography.muted}>
            {formatWhen(session.scheduledStart, locale, timeZone)} —{" "}
            {formatWhen(session.scheduledEnd, locale, timeZone)}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {makeup.isMakeup ? <MakeupBadge label={mk?.sheetTitle} /> : null}
          <Badge>{t?.status?.[session.status] ?? session.status}</Badge>
        </div>
      </div>

      {nextClass ? (
        <NextClassCard
          next={{
            ...nextClass,
            startsAt: nextClass.startsAt.toISOString(),
            endsAt: nextClass.endsAt.toISOString(),
          }}
          lang={locale}
          timeZone={timeZone}
          labels={resolveNextClassLabels(t?.nextClass)}
          className="max-w-none"
        />
      ) : null}

      {/* Make-up class («حصة تعويضية»): where it came from, or where it went.
          Every role reads these lines; the buttons are the owner's. */}
      {mk && makeup.replaces ? (
        <p className={typography.muted}>
          <Link
            className="underline underline-offset-4"
            href={`/${locale}/live/${makeup.replaces.id}`}
          >
            {mk.replacesNote.replace(
              "{date}",
              formatDay(makeup.replaces.scheduledStart, locale, timeZone)
            )}
          </Link>
        </p>
      ) : null}
      {mk && makeup.madeUpBy ? (
        <p className={typography.muted}>
          <Link
            className="underline underline-offset-4"
            href={`/${locale}/live/${makeup.madeUpBy.id}${
              makeup.ownsClass && makeup.madeUpBy.status === "scheduled"
                ? "?view=details"
                : ""
            }`}
          >
            {mk.madeUp.replace(
              "{date}",
              formatDay(makeup.madeUpBy.scheduledStart, locale, timeZone)
            )}
          </Link>
        </p>
      ) : null}

      {/* The student's one line: where the class is in its life, and the one
          thing to do about it. Upcoming counts down; live carries the big
          Enter; ended says whether a recording is coming, ready, or failed. */}
      <SessionState
        status={session.status}
        scheduledStart={session.scheduledStart.toISOString()}
        timeZone={timeZone}
        recording={recordingState}
        joinHref={
          !canJoin
            ? null
            : isExternal
              ? (session.meetingUrl ?? null)
              : `/${locale}/live/${session.id}/room`
        }
        recordingHref={
          recordingState === "ready"
            ? `/${locale}/live/${session.id}/recordings`
            : null
        }
        lessonHref={lessonHref}
        locale={locale}
        labels={{
          upcoming: st?.upcoming ?? "The class has not started yet",
          startsAt: st?.startsAt ?? "Starts at {time}",
          startsIn: st?.startsIn ?? "Starts in {value}",
          due: st?.due ?? "It's class time — go in now",
          live: st?.live ?? "The class is live now",
          enter: st?.enter ?? "Enter the live class",
          ended: st?.ended ?? "The class has ended",
          cancelled: st?.cancelled ?? "The class was cancelled",
          processing: st?.processing ?? "Preparing the class recording…",
          ready: st?.ready ?? "The recording is available to watch",
          failed: st?.failed ?? "The recording could not be produced",
          noRecording: st?.noRecording ?? "This class was not recorded",
          watchRecording: st?.watchRecording ?? "Watch the recording",
          openLesson: st?.openLesson ?? "Open the recorded lesson",
          minutes: st?.minutes ?? "{n} min",
          hours: st?.hours ?? "{n} h",
        }}
      />

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
              <bdi dir="auto">{displayName(session.teacher, nameDisplay)}</bdi>
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

      <AttendanceReview
        sessionId={session.id}
        locale={locale}
        dictionary={dictionary}
        timeZone={timeZone}
      />

      <ClassWork
        sessionId={session.id}
        locale={locale}
        dictionary={dictionary}
        timeZone={timeZone}
      />

      {canJoin && !isExternal && (
        <AndroidAppCard labels={resolveRoomLabels(t?.room)} />
      )}

      <div className="flex flex-wrap gap-2">
        {canJoin &&
          canEnd &&
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
              <Link href={`/${locale}/live/${session.id}/room`}>
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
        {mk && makeup.canPlan ? (
          <MakeupSheet
            missedId={session.id}
            labels={mk}
            lang={locale}
            description={mk.missedOn.replace(
              "{date}",
              formatDay(session.scheduledStart, locale, timeZone)
            )}
          />
        ) : null}
        {mk && makeup.canManage ? (
          <>
            <MakeupSheet
              mode="replan"
              missedId={rootId}
              makeupId={session.id}
              labels={mk}
              lang={locale}
              variant="outline"
            />
            <CancelMakeupButton makeupId={session.id} labels={mk} />
          </>
        ) : null}
        {session.status === "ended" && (
          <Button asChild variant="outline">
            <Link href={`/${locale}/live/${session.id}/recordings`}>
              {t?.actions?.viewRecordings ?? "View recordings"}
            </Link>
          </Button>
        )}
      </div>

      {(hasReferences || makeup.ownsClass) && (
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
                    <Link
                      className="underline underline-offset-2"
                      href={`/${locale}/exams/${x.schoolExam!.id}`}
                    >
                      {x.schoolExam!.title}
                    </Link>
                    <Badge variant="secondary">{x.schoolExam!.examType}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDay(x.schoolExam!.examDate, locale, timeZone)}
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
                    <Link
                      className="underline underline-offset-2"
                      href={`/${locale}/assignments/${x.schoolAssignment!.id}`}
                    >
                      {x.schoolAssignment!.title}
                    </Link>
                    <span className="text-muted-foreground text-xs">
                      {formatDay(x.schoolAssignment!.dueDate, locale, timeZone)}
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
                  <li key={x.id} className="flex items-center gap-2">
                    <a
                      className="inline-flex min-h-11 min-w-0 items-center break-all underline underline-offset-2"
                      href={x.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* Falling back to the raw URL: isolate its direction so
                          trailing neutrals (`/`, `?`, `=`) don't get pulled
                          into the surrounding RTL run. The title case (the
                          common one) keeps its natural direction. */}
                      {x.title || <span dir="ltr">{x.url}</span>}
                    </a>
                    {makeup.ownsClass ? (
                      <RemoveClassLinkButton
                        sessionId={session.id}
                        resourceId={x.id}
                        labels={linkLabels}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* The class's teacher (or an admin) adds a link at any time —
              after the class too: the lesson she recorded, for whoever
              missed it. */}
          {makeup.ownsClass ? (
            <ClassLinkForm sessionId={session.id} labels={linkLabels} />
          ) : null}
        </section>
      )}
    </div>
  )
}
