// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"

import { getDictionary } from "@/components/internationalization/dictionaries"
import { checkLiveClassPermission } from "@/components/school-dashboard/live/authorization"
import { loadLiveClassDetail } from "@/components/school-dashboard/live/detail-load"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * `/live/[id]` as data — the page's own loader (`live/detail-load.ts`) with the
 * token's actor, and every word the page prints resolved from the same
 * dictionary, so the phone draws the page rather than re-deciding it.
 *
 * GET /api/mobile/live/sessions/:id?lang=ar|en
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { id } = await params
    const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "ar"
    const actor = { userId: auth.userId, role: auth.role as UserRole, schoolId: auth.schoolId }

    const detail = await loadLiveClassDetail(id, actor, async (action) =>
      checkLiveClassPermission(actor, action)
        ? { ok: true as const, ...actor }
        : { ok: false as const, response: actionError(ACTION_ERRORS.UNAUTHORIZED) }
    )
    if (!detail) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const dictionary = await getDictionary(lang)
    const t = dictionary?.liveClasses
    const st = t?.states
    const r = t?.references
    const at = t?.attendanceNote
    const { session } = detail
    const locale = lang === "ar" ? "ar-AE" : "en-AE"
    const when = (d: Date) =>
      d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })
    const day = (d: Date) => d.toLocaleDateString(locale, { dateStyle: "medium" })

    const rows: { label: string; value: string }[] = []
    if (session.section) rows.push({ label: t?.labels?.section ?? "Section", value: session.section.name })
    if (session.subject) rows.push({ label: t?.labels?.subject ?? "Subject", value: session.subject.name })
    if (session.teacher)
      rows.push({
        label: t?.labels?.teacher ?? "Teacher",
        value: `${session.teacher.firstName} ${session.teacher.lastName}`,
      })
    if (session.timetable?.classroom?.roomName)
      rows.push({ label: t?.labels?.room ?? "Room", value: session.timetable.classroom.roomName })
    rows.push({
      label: t?.labels?.visibility ?? "Who can join",
      value:
        session.visibility === "school"
          ? (t?.labels?.visibilitySchool ?? "Whole school")
          : (t?.labels?.visibilitySection ?? "Section only"),
    })
    rows.push({
      label: t?.labels?.recording ?? "Recording",
      value: !detail.recordingAvailable
        ? (t?.labels?.recordingUnavailable ?? "Not available")
        : session.recordingEnabled
          ? (t?.labels?.enabled ?? "Enabled")
          : (t?.labels?.disabled ?? "Disabled"),
    })

    const attendanceNote = !session.sectionId
      ? null
      : detail.attendanceMode === "auto"
        ? (at?.auto ?? "Attendance is marked automatically when this class ends.")
        : detail.attendanceMode === "external_provider"
          ? (at?.external ??
            "This class runs on an external meeting link, which carries no attendance data. Mark attendance as usual.")
          : detail.attendanceMode === "no_section_or_timetable"
            ? (at?.unanchored ??
              "This class is not tied to a timetable period, so attendance is not recorded against one.")
            : (at?.disabled ??
              "Automatic attendance is turned off for this school. Mark attendance as usual.")

    const lc = detail.lessonContent
    const http = (u: string | null | undefined) => (u && /^https?:\/\//i.test(u) ? u : null)

    return NextResponse.json({
      id: session.id,
      title: session.title,
      when: `${when(session.scheduledStart)} — ${when(session.scheduledEnd)}`,
      status: session.status,
      status_label: (t?.status as Record<string, string> | undefined)?.[session.status] ?? session.status,
      scheduled_start: session.scheduledStart.toISOString(),
      description: session.description,
      recording: detail.recordingState,
      can_join: detail.canJoin,
      is_external: detail.isExternal,
      meeting_url: detail.isExternal && detail.canJoin ? (session.meetingUrl ?? null) : null,
      lesson_path: detail.lessonHref,
      can_end: detail.canEnd,
      rows,
      attendance_note: attendanceNote,
      attendance_link:
        detail.attendanceMode !== "auto" && detail.canMarkAttendance && Boolean(session.sectionId)
          ? (at?.markLink ?? "Go to attendance")
          : null,
      labels: {
        upcoming: st?.upcoming ?? "The class has not started yet",
        starts_at: st?.startsAt ?? "Starts at {time}",
        starts_in: st?.startsIn ?? "Starts in {value}",
        live: st?.live ?? "The class is live now",
        enter: st?.enter ?? "Enter the live class",
        ended: st?.ended ?? "The class has ended",
        cancelled: st?.cancelled ?? "The class was cancelled",
        processing: st?.processing ?? "Preparing the class recording…",
        ready: st?.ready ?? "The recording is available to watch",
        failed: st?.failed ?? "The recording could not be produced",
        no_recording: st?.noRecording ?? "This class was not recorded",
        watch_recording: st?.watchRecording ?? "Watch the recording",
        open_lesson: st?.openLesson ?? "Open the recorded lesson",
        minutes: st?.minutes ?? "{n} min",
        hours: st?.hours ?? "{n} h",
        join: t?.actions?.join ?? "Join",
        open_meeting: t?.actions?.openMeeting ?? t?.actions?.join ?? "Join",
        end: t?.actions?.end ?? "End class",
        view_recordings: t?.actions?.viewRecordings ?? "View recordings",
      },
      references: detail.hasReferences
        ? {
            title: r?.title ?? "Lesson & references",
            lesson_label: t?.labels?.lesson ?? "Lesson",
            lesson: session.catalogLesson?.name ?? null,
            practice:
              lc && lc.questionCount > 0
                ? `${lc.questionCount} ${r?.practiceQuestions ?? "practice questions"}`
                : null,
            videos_title: r?.videos ?? "Videos",
            videos: (lc?.videos ?? []).map((v) => ({ title: v.title, url: http(v.videoUrl) })),
            materials_title: r?.materials ?? "Materials",
            materials: [
              ...(lc?.attachments ?? []).map((a) => ({ title: a.name, url: http(a.url) })),
              ...(lc?.materials ?? []).map((m) => ({ title: m.title, url: http(m.fileUrl ?? m.externalUrl) })),
            ],
            exams_title: r?.exams ?? "Exams & quizzes",
            exams: detail.examResources.map((x) => ({
              title: x.schoolExam!.title,
              path: `/exams/${x.schoolExam!.id}`,
              badge: x.schoolExam!.examType,
              date: day(x.schoolExam!.examDate),
            })),
            assignments_title: r?.assignments ?? "Assignments",
            assignments: detail.assignmentResources.map((x) => ({
              title: x.schoolAssignment!.title,
              path: `/assignments/${x.schoolAssignment!.id}`,
              date: day(x.schoolAssignment!.dueDate),
            })),
            links_title: r?.links ?? "Links",
            links: detail.linkResources.map((x) => ({ title: x.title || x.url!, url: x.url! })),
          }
        : null,
    })
  } catch (error) {
    console.error("[mobile/live/sessions/:id] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
