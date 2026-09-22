// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import type { LiveClassAction } from "./authorization"
import { describeAttendanceSync } from "./actions/attendance-sync"
import type { RequireContextResult } from "./actions/helpers"
import { readLiveClass } from "./actions/read-live-class"
import { isRecordingConfigured } from "./livekit/client"
import {
  getAttendanceSyncEnabled,
  getLessonReferenceContent,
  type LessonReferenceContent,
} from "./queries"

export interface LiveDetailViewer {
  userId: string | null | undefined
  role: string | null | undefined
  schoolId: string | null | undefined
}

/**
 * `/live/[id]` — the session and everything its page decides about it (the
 * student's state line, who may join or end it, the attendance note, the
 * lesson and its references), for the page and for the phone
 * (`/api/mobile/live/sessions/[id]`). Hrefs are locale-less. `null` when the
 * viewer may not see the session.
 */
export async function loadLiveClassDetail(
  id: string,
  viewer: LiveDetailViewer,
  resolve: (action: LiveClassAction) => Promise<RequireContextResult>
) {
  const result = await readLiveClass(id, resolve)
  if (!("success" in result) || !result.success) return null
  const session = result.data


  const canJoin = session.status === "live" || session.status === "scheduled"
  const latestRecording = session.recordings?.[0] ?? null
  const recordingState: "none" | "processing" | "ready" | "failed" =
    !latestRecording
      ? "none"
      : latestRecording.status === "ready"
        ? "ready"
        : latestRecording.status === "failed" ||
            latestRecording.status === "expired"
          ? "failed"
          : "processing"
  // The recorded lesson lives in lumos once the bridge has published it.
  const lessonSlug = session.catalogLesson?.chapter?.subject?.slug ?? null
  const lessonHref =
    latestRecording?.publishedVideoId && session.catalogLesson && lessonSlug
      ? `/lumos/courses/${lessonSlug}/${session.catalogLesson.id}`
      : null
  // "Enabled" on a session that can never produce an MP4 is a lie the teacher
  // discovers on an empty recordings page. The bucket gate decides the label.
  const recordingAvailable = isRecordingConfigured()
  const isExternal = session.provider === "external"

  /** Roles that can open the manual register (mirrors /attendance/manual). */
  const ATTENDANCE_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
  const { schoolId: tenantSchoolId, role: viewerRole } = viewer
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
  const viewerUserId = viewer.userId
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

  return {
    session,
    canJoin,
    recordingState,
    lessonHref,
    recordingAvailable,
    isExternal,
    attendanceMode,
    canMarkAttendance,
    canEnd,
    lessonContent,
    examResources,
    assignmentResources,
    linkResources,
    hasReferences,
  }
}

export type LiveClassDetail = NonNullable<Awaited<ReturnType<typeof loadLiveClassDetail>>>
