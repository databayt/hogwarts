"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import {
  deleteRecordingObject,
  getRecordingPlaybackUrl,
} from "@/components/school-dashboard/conference/livekit/recording-urls"

import {
  canAccessSession,
  conferenceRevalidatePath,
  requireContext,
} from "./helpers"

/**
 * List recordings for a session. Tenant-scoped AND enrollment-scoped:
 * a STUDENT/GUARDIAN may only list recordings for a session whose section
 * they (or their ward) belong to. Soft-deleted hidden.
 */
export async function listRecordings(sessionId: string) {
  const ctx = await requireContext("view_recordings")
  if (!ctx.ok) return ctx.response
  try {
    const session = await db.conference.findFirst({
      where: { id: sessionId, schoolId: ctx.schoolId, deletedAt: null },
      select: { sectionId: true, visibility: true },
    })
    if (!session) return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)
    if (!(await canAccessSession(ctx, session.sectionId, session.visibility))) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }
    const recordings = await db.conferenceRecording.findMany({
      where: {
        schoolId: ctx.schoolId,
        sessionId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true as const, data: recordings }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Generate a short-lived signed URL for playback. Never bake the URL into
 * the DB — every play request gets a fresh signature.
 */
export async function getRecordingUrl(recordingId: string) {
  const ctx = await requireContext("view_recordings")
  if (!ctx.ok) return ctx.response
  try {
    const recording = await db.conferenceRecording.findFirst({
      where: {
        id: recordingId,
        schoolId: ctx.schoolId,
        status: "ready",
        deletedAt: null,
      },
      select: {
        s3Bucket: true,
        s3Key: true,
        s3Region: true,
        mimeType: true,
        session: { select: { sectionId: true, visibility: true } },
      },
    })
    if (!recording) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_RECORDING_NOT_FOUND)
    }
    // Enrollment gate: staff school-wide; STUDENT/GUARDIAN only their section
    // (or any member for a school-wide session).
    if (
      !(await canAccessSession(
        ctx,
        recording.session?.sectionId ?? null,
        recording.session?.visibility ?? "section"
      ))
    ) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_RECORDING_NOT_FOUND)
    }
    const url = await getRecordingPlaybackUrl(recording, 300)
    return { success: true as const, data: { url } }
  } catch {
    return actionError(ACTION_ERRORS.LIVE_CLASS_RECORDING_FAILED)
  }
}

/**
 * Hard-delete a recording (S3 object + DB row → soft-deleted with status).
 */
export async function deleteRecording(recordingId: string) {
  const ctx = await requireContext("delete_recording")
  if (!ctx.ok) return ctx.response
  try {
    const recording = await db.conferenceRecording.findFirst({
      where: {
        id: recordingId,
        schoolId: ctx.schoolId,
        deletedAt: null,
      },
      select: {
        id: true,
        sessionId: true,
        s3Bucket: true,
        s3Key: true,
        s3Region: true,
      },
    })
    if (!recording) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_RECORDING_NOT_FOUND)
    }
    const deleted = await deleteRecordingObject(recording)
    if (!deleted) {
      // Don't mark the row deleted while the S3 object still exists.
      return actionError(ACTION_ERRORS.LIVE_CLASS_RECORDING_FAILED)
    }
    await db.conferenceRecording.update({
      where: { id: recording.id },
      data: { status: "expired", deletedAt: new Date() },
    })
    revalidatePath(
      conferenceRevalidatePath(`${recording.sessionId}/recordings`)
    )
    return { success: true as const, data: { id: recording.id } }
  } catch {
    return actionError(ACTION_ERRORS.LIVE_CLASS_RECORDING_FAILED)
  }
}
