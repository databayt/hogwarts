// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import {
  applyLessonProgress,
  completeLessonCore,
} from "@/components/lumos/lib/progress-core"

import { authenticate, isAuthError } from "../../../../../lib/authenticate"

/**
 * Record how far through a lesson this reader is.
 *
 * Both halves are the web's own: a watch sample goes to
 * `applyLessonProgress`, which refuses to let a replayed older sample regress
 * a newer row, and a finished lesson goes to `completeLessonCore`, which is
 * what counts the subject's published lessons and issues the certificate when
 * the last one lands. Neither is reimplemented here.
 *
 * POST /api/mobile/courses/:courseId/lessons/:lessonId/progress
 * Body: the app's LessonProgressDto — status, watched_seconds, total_seconds.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { userId } = auth
    const { lessonId } = await params

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const status = String(body.status ?? "").toUpperCase()
    const watchedSeconds = Number(body.watched_seconds ?? 0)
    const totalSeconds = Number(body.total_seconds ?? 0)

    // When the sample was taken, not when it arrived. A phone that watched a
    // lesson on a plane drains its outbox hours later, out of order with
    // samples taken since; `applyLessonProgress` uses this to refuse to let
    // the older one overwrite the newer row. Omitted means "just now", which
    // is what a live player means.
    const sampledAt = body.sampled_at ? new Date(body.sampled_at) : undefined
    const at =
      sampledAt && !Number.isNaN(sampledAt.getTime()) ? sampledAt : undefined

    const outcome =
      status === "COMPLETED"
        ? await completeLessonCore({ userId, lessonId, at })
        : await applyLessonProgress({
            userId,
            lessonId,
            watchedSeconds: Number.isFinite(watchedSeconds) ? watchedSeconds : 0,
            totalSeconds: Number.isFinite(totalSeconds) ? totalSeconds : 0,
            at,
          })

    if (outcome.status === "notFound") {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }
    if (outcome.status === "noEnrollment") {
      return NextResponse.json({ error: "not_enrolled" }, { status: 409 })
    }

    // `stale` is not an error — a replayed sample older than what is stored.
    // The reader's true position is whatever the row already held, so the
    // answer is the row either way.
    const row = await db.lessonProgress.findUnique({
      where: { userId_catalogLessonId: { userId, catalogLessonId: lessonId } },
      select: {
        isCompleted: true,
        watchedSeconds: true,
        totalSeconds: true,
        completedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      lesson_id: lessonId,
      status: row?.isCompleted
        ? "COMPLETED"
        : (row?.watchedSeconds ?? 0) > 0
          ? "IN_PROGRESS"
          : "NOT_STARTED",
      watched_seconds: row?.watchedSeconds ?? 0,
      total_seconds: row?.totalSeconds ?? 0,
      started_at: row?.createdAt.toISOString() ?? null,
      completed_at: row?.completedAt?.toISOString() ?? null,
    })
  } catch (error) {
    console.error("[mobile/courses/lessons/progress] POST failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
