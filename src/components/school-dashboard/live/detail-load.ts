// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"

import { describeAttendanceSync } from "./actions/attendance-sync"
import type { RequireContextResult } from "./actions/helpers"
import { readLiveClass } from "./actions/read-live-class"
import type { LiveClassAction } from "./authorization"
import { isRecordingConfigured } from "./livekit/client"
import {
  getAttendanceSyncEnabled,
  getLessonReferenceContent,
  type LessonReferenceContent,
} from "./queries"
import { mayEnterRoom } from "./room-entry"

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

  // Three reads that need only the session (and the viewer): the guardian's
  // observe switch, whether attendance syncs, and the linked lesson's content.
  // They were three round trips in a row; none reads another's result.
  const { schoolId: tenantSchoolId, role: viewerRole } = viewer
  const [guardiansObserve, attendanceEnabled, lessonContent] =
    await Promise.all([
      // Open, AND this reader may enter it — see `room-entry.ts`. For an
      // external session the join href IS the meeting URL, so a reader who may
      // see the session but not enter it (staff on a section class, a guardian
      // where the school does not let guardians watch) must not be handed it.
      viewer.role === "GUARDIAN" && viewer.schoolId
        ? db.school
            .findUnique({
              where: { id: viewer.schoolId },
              select: { conferenceGuardiansObserve: true },
            })
            .then((school) => school?.conferenceGuardiansObserve ?? true)
        : Promise.resolve(true),
      tenantSchoolId
        ? getAttendanceSyncEnabled(tenantSchoolId)
        : Promise.resolve(false),
      // The linked catalog lesson's teachable content (videos, materials,
      // practice questions) — one FK, whole payload. schoolId scopes the
      // contributed content: without it the listing showed every school's
      // private and unapproved videos/materials. A failure is an empty list,
      // never a broken page.
      session.catalogLessonId && tenantSchoolId
        ? getLessonReferenceContent(
            session.catalogLessonId,
            tenantSchoolId
          ).catch((): LessonReferenceContent | null => null)
        : Promise.resolve(null),
    ])
  const canJoin =
    (session.status === "live" || session.status === "scheduled") &&
    mayEnterRoom({
      role: viewer.role,
      visibility: session.visibility,
      guardiansObserve,
      // Open only while the school's switch is on: the room is `cancelled`
      // otherwise, which the status test above already refuses.
      practice: session.isPractice,
    })
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
  const attendanceMode = tenantSchoolId
    ? // A make-up's attendance is written to the ORIGINAL class's date and
      // period, so it counts as tied to a slot (`makeupForId`).
      describeAttendanceSync(
        { ...session, makeupForId: session.makeupForId ?? null },
        attendanceEnabled
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

  // Make-up class («حصة تعويضية»). Who may plan or move one: the class's own
  // teacher, or an admin — what `makeup-core` enforces; this only decides
  // whether to OFFER the button.
  const MAKEUP_ADMIN_ROLES = ["DEVELOPER", "ADMIN"]
  const ownsClass =
    MAKEUP_ADMIN_ROLES.includes(viewerRole ?? "") ||
    (viewerRole === "TEACHER" && session.teacher?.userId === viewerUserId)
  const replaces = session.makeupFor ?? null
  const madeUpBy = session.makeups?.[0] ?? null
  const makeup = {
    /** The viewer is this class's own teacher, or an admin. */
    ownsClass,
    /** This class replaces a missed one. */
    isMakeup: Boolean(session.makeupForId),
    /** The missed class it replaces — the ROOT a re-plan books against. */
    replaces: replaces && {
      id: replaces.id,
      scheduledStart: replaces.scheduledStart,
    },
    /** The make-up standing for this missed class. */
    madeUpBy,
    /** «عوّض الحصة» — a missed class with no make-up yet, for its owner. */
    canPlan:
      ownsClass &&
      session.status === "cancelled" &&
      !session.actualStart &&
      !session.isPractice &&
      !session.makeupForId &&
      Boolean(session.sectionId && session.subjectId) &&
      !madeUpBy,
    /** «غيّر الموعد» / «إلغاء» — a make-up still waiting to start, for its owner. */
    canManage:
      ownsClass &&
      Boolean(session.makeupForId) &&
      session.status === "scheduled",
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
    makeup,
    lessonContent,
    examResources,
    assignmentResources,
    linkResources,
    hasReferences,
  }
}

export type LiveClassDetail = NonNullable<
  Awaited<ReturnType<typeof loadLiveClassDetail>>
>
