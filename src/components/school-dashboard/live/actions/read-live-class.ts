// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// NOT a "use server" module: `readLiveClass` takes the identity resolver as an
// argument, and a server action must never accept a caller-supplied identity.
// The web action (`getLiveClass`) passes `requireContext` (NextAuth session +
// subdomain); the mobile route passes the Bearer token's actor.

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import type { LiveClassAction } from "../authorization"
import { canAccessSession, type RequireContextResult } from "./helpers"

type Ctx = Extract<RequireContextResult, { ok: true }>

/**
 * One live class for the viewer the resolver names — the session page's
 * read, shared by the web action and `/api/mobile/live/sessions/[id]`.
 */
export async function readLiveClass(
  id: string,
  resolve: (action: LiveClassAction) => Promise<RequireContextResult>
) {
  // Try every role bucket — each requireContext call enforces auth +
  // schoolId + role. The first one that succeeds gives us the context.
  const dashboardCtx = await resolve("read_school_dashboard")
  let ctx: Ctx | null = dashboardCtx.ok ? dashboardCtx : null
  if (!ctx) {
    const studentCtx = await resolve("join_as_participant")
    ctx = studentCtx.ok ? studentCtx : null
  }
  if (!ctx) {
    const guardianCtx = await resolve("join_as_observer")
    ctx = guardianCtx.ok ? guardianCtx : null
  }
  if (!ctx) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    const session = await db.conference.findFirst({
      where: { id, schoolId: ctx.schoolId, deletedAt: null },
      include: {
        // `userId` so the detail page can match the viewer against the HOST:
        // End is gated on it, because a TEACHER may only end their OWN class.
        teacher: {
          select: { id: true, userId: true, firstName: true, lastName: true },
        },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        catalogLesson: {
          select: {
            id: true,
            name: true,
            chapter: { select: { subject: { select: { slug: true } } } },
          },
        },
        // The physical room the anchored class ALSO meets in. Online is
        // additive — a hybrid school's staff need to see both halves here.
        timetable: {
          select: { classroom: { select: { roomName: true } } },
        },
        // Recording lifecycle for the page's "processing… / ready / failed"
        // states, and the lesson video it was published into.
        recordings: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            failureReason: true,
            publishedVideoId: true,
            durationSeconds: true,
          },
        },
        resources: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            url: true,
            title: true,
            schoolExam: {
              select: {
                id: true,
                title: true,
                examType: true,
                examDate: true,
              },
            },
            schoolAssignment: {
              select: { id: true, title: true, type: true, dueDate: true },
            },
          },
        },
      },
    })
    if (!session) return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)
    // Enrollment gate: same-school is not enough for STUDENT/GUARDIAN — the
    // row (incl. meetingUrl) only leaves the server for a session they may
    // actually attend. NOT_FOUND (not UNAUTHORIZED) so other sections'
    // sessions aren't revealed to exist. Staff roles (incl. ACCOUNTANT via
    // read_school_dashboard) keep whole-school read.
    if (
      (ctx.role === "STUDENT" || ctx.role === "GUARDIAN") &&
      !(await canAccessSession(ctx, session.sectionId, session.visibility))
    ) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)
    }
    return { success: true as const, data: session }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
