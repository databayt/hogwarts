// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { loadLiveLanding } from "@/components/school-dashboard/live/landing/load"
import type { LandingSession } from "@/components/school-dashboard/live/landing/types"
import { canOpenLanding } from "@/components/school-dashboard/live/landing/viewer"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * Mobile Live landing — the `/live` page, as data.
 *
 * The page and this route both call `loadLiveLanding`, so a phone gets exactly
 * what the browser shows the same reader: the school's online state for the
 * hero, the live and coming-up strip with each class's phase and progress,
 * the classes this reader missed, and the two recordings ranked for them —
 * plus the viewer rules that decide which of those a card names and which
 * doors it offers. Times arrive formatted in the school's own zone, as the
 * web prints them.
 *
 * The admin readiness band is not here: its coverage read is a server action
 * that authorises against the web session, and a phone hands an admin to the
 * settings page for it.
 *
 * GET /api/mobile/live/landing?lang=ar|en
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId, userId, role } = auth

    // The web redirects anyone else to the dashboard.
    if (!canOpenLanding(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "ar"
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { domain: true },
    })

    const landing = await loadLiveLanding({
      schoolId,
      userId,
      role,
      lang,
      isDemo: school?.domain === "demo",
    })

    const { viewer, policy } = landing
    return NextResponse.json({
      viewer: {
        role: viewer.role,
        can_schedule: viewer.canSchedule,
        can_configure: viewer.canConfigure,
        is_host: viewer.isHost,
        can_join: viewer.canJoin,
        can_view_recordings: viewer.canViewRecordings,
        shows_teacher: viewer.showsTeacher,
        shows_section: viewer.showsSection,
      },
      policy: {
        delivery_mode: policy.deliveryMode,
        is_online: policy.isOnline,
        window_active: policy.windowActive,
        provider: policy.provider,
        degraded: policy.degraded,
      },
      live: landing.live.map(toDto),
      upcoming: landing.upcoming.map(toDto),
      catch_up: landing.catchUp.map(toDto),
      recordings: landing.recordings.map(toDto),
    })
  } catch (error) {
    console.error("[mobile/live/landing] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function toDto(s: LandingSession) {
  return {
    id: s.id,
    title: s.title,
    teacher_name: s.teacherName,
    teacher_photo_url: s.teacherPhotoUrl,
    subject_name: s.subjectName,
    section_name: s.sectionName,
    grade_name: s.gradeName,
    chapter_name: s.chapterName,
    lesson_name: s.lessonName,
    scheduled_start: s.scheduledStart,
    is_live: s.isLive,
    phase: s.phase,
    progress: s.progress,
    image_url: s.imageUrl,
    color: s.color,
    has_recording: s.hasRecording,
  }
}
