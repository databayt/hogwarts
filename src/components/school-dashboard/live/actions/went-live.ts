// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The one place a session goes `scheduled → live`, and everything that must
// happen exactly once when it does.
//
// Three writers can win that transition: the LiveKit `room_started` webhook,
// a HOST pressing Join on the title card (join-core's auto-start), and the
// teacher's explicit Start action. Until 2026-09-04 only the webhook carried
// the side effects — the "class is live, join now" notification and the
// auto-start of the recording egress — behind ITS status-guarded write. But
// `ensureRoom` creates the SFU room from the app FIRST, so the app's own write
// almost always landed before LiveKit's webhook arrived; the webhook's guarded
// update then matched nothing and silently skipped both. On the real join
// path no class ever notified its roster or started recording — which is why
// production had never produced a recording file.
//
// The rule now: whoever wins the guarded write performs the side effects;
// everyone else sees `transitioned: false` and does nothing. A late or retried
// webhook is a no-op for the same reason.
//
// A plain `server-only` module (not `"use server"`): the webhook runs with no
// user session, and the two actions already hold theirs.
import "server-only"

import { after } from "next/server"

import { db } from "@/lib/db"

import { isRecordingConfigured } from "../livekit/client"
import { startCompositeEgress } from "../livekit/egress"
import { notifyClassStarted } from "./notifications"

export type WentLiveInput = {
  schoolId: string
  sessionId: string
  roomName: string
  recordingEnabled: boolean
  /** The SFU room SID when the caller knows it (the webhook). */
  roomSid?: string | null
}

/**
 * Flip `scheduled → live` and, only if THIS call made the flip, notify the
 * roster and start the recording egress when the session opted in.
 *
 * Both side effects are best-effort: a notification hub or egress failure
 * must never roll back a room that is already open with people in it.
 */
export async function transitionToLive(
  input: WentLiveInput
): Promise<{ transitioned: boolean }> {
  const { schoolId, sessionId, roomName, recordingEnabled, roomSid } = input

  // Status-guarded and tenant-scoped: a late/retried caller — or the second of
  // two racing writers — must not resurrect an ended/cancelled session or
  // re-fire the side effects.
  const { count } = await db.conference.updateMany({
    where: { id: sessionId, schoolId, status: "scheduled" },
    data: {
      status: "live",
      actualStart: new Date(),
      ...(roomSid !== undefined ? { roomSid } : {}),
    },
  })
  if (count === 0) return { transitioned: false }

  // The one notification whose whole point is to get the reader INTO the room.
  defer(() => notifyClassStarted(schoolId, sessionId))

  // Auto-start recording when the session opted in. Create the recording row
  // immediately (status "pending") from the egress result so an early
  // endLiveClass can find + stop the in-flight egress before the SFU's
  // egress_started webhook lands (which flips it to "processing").
  if (recordingEnabled && isRecordingConfigured()) {
    try {
      const eg = await startCompositeEgress({ roomName, schoolId, sessionId })
      await db.conferenceRecording.upsert({
        where: { egressId: eg.egressId },
        create: {
          schoolId,
          sessionId,
          egressId: eg.egressId,
          s3Bucket: eg.s3Bucket,
          s3Region: eg.s3Region,
          s3Key: "",
          status: "pending",
          startedAt: new Date(),
        },
        update: {},
      })
    } catch (err) {
      console.error("[live-class] auto-egress start failed", {
        schoolId,
        sessionId,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { transitioned: true }
}

/**
 * Run post-response work. `after()` throws when there is no request scope
 * (a script, a future queue worker); outside a request there is no response
 * to defer past, so run it now rather than let the transition fail.
 */
function defer(run: () => Promise<unknown>): void {
  try {
    after(run)
  } catch {
    void run()
  }
}
