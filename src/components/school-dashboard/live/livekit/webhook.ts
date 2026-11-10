// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { after } from "next/server"
import { Prisma } from "@prisma/client"
import { WebhookReceiver, type WebhookEvent } from "livekit-server-sdk"

import { db } from "@/lib/db"
import { syncLiveAttendance } from "@/components/school-dashboard/live/actions/attendance-sync"
import { notifyClassRecordingReady } from "@/components/school-dashboard/live/actions/notifications"

import { publishRecordingAsLessonVideo } from "../actions/publish-recording"
import { nudgeWaiting } from "../actions/waiting-nudge"
import { transitionToLive } from "../actions/went-live"
import { JOIN_GRACE_AFTER_END_MIN } from "../join-window"
import { getLiveKitConfig, getLiveKitRecordingConfig } from "./client"
import { parseRoomName } from "./room-naming"
import { removeParticipant } from "./rooms"

let receiver: WebhookReceiver | null = null

function getReceiver(): WebhookReceiver {
  if (receiver) return receiver
  const { apiKey, apiSecret } = getLiveKitConfig()
  receiver = new WebhookReceiver(apiKey, apiSecret)
  return receiver
}

/**
 * Verify the HMAC signature on a LiveKit webhook payload and parse it.
 * Throws on bad signature — caller should respond 401.
 */
export async function verifyWebhook(
  body: string,
  authHeader: string | null
): Promise<WebhookEvent> {
  if (!authHeader) throw new Error("missing authorization header")
  return getReceiver().receive(body, authHeader)
}

/**
 * Truncate a webhook payload so we don't bloat the audit table with full
 * SFU dumps. Keeps the top-level keys but drops nested arrays/blobs.
 */
function truncatePayload(event: WebhookEvent): Record<string, unknown> {
  return {
    event: event.event,
    roomName: event.room?.name,
    roomSid: event.room?.sid,
    participantIdentity: event.participant?.identity,
    egressId: event.egressInfo?.egressId,
    egressStatus: event.egressInfo?.status,
    createdAt: event.createdAt ? String(event.createdAt) : undefined,
  }
}

/**
 * Process a verified webhook event. Routes to the right session and writes
 * a `ConferenceEvent` row for audit + idempotency. Returns `true` if the
 * event was new, `false` if it was a duplicate (already seen by eventId).
 */
/**
 * The S3 object key an ended egress wrote, from its FileInfo.
 *
 * For S3 output LiveKit reports `filename` as the storage path we asked for
 * (`schools/…/x.mp4`), and `location` as the object's full URL. Never verified
 * against a real file in production, so this does not trust either blindly: a
 * bare basename (no `/`) would sign playback URLs against the bucket root, so
 * it falls back to the key inside `location`. Returns "" when neither carries
 * a usable key — the caller treats that as "no file produced".
 */
export function egressObjectKey(
  fileInfo: { filename?: string; location?: string } | null | undefined
): string {
  const filename = fileInfo?.filename ?? ""
  if (filename.includes("/")) return filename.replace(/^\/+/, "")
  const location = fileInfo?.location ?? ""
  if (location) {
    try {
      // Virtual-hosted (bucket.s3.region.amazonaws.com/key) → the path is the
      // key. Path-style URLs carry the bucket first; s3:// carries it as host.
      const url = new URL(location)
      let path = decodeURIComponent(url.pathname).replace(/^\/+/, "")
      const bucket = process.env.LIVEKIT_RECORDING_BUCKET
      if (bucket && path.startsWith(`${bucket}/`)) {
        path = path.slice(bucket.length + 1)
      }
      if (path.includes("/")) return path
    } catch {
      // not a URL — fall through
    }
  }
  return filename
}

export async function handleWebhookEvent(
  event: WebhookEvent
): Promise<boolean> {
  const roomName = event.room?.name
  if (!roomName) return false
  const parsed = parseRoomName(roomName)
  if (!parsed) return false
  const { schoolId, sessionId } = parsed

  // Confirm the session exists + actually belongs to this school.
  const session = await db.conference.findFirst({
    where: { id: sessionId, schoolId },
    select: {
      id: true,
      recordingEnabled: true,
      timetableId: true,
      scheduledEnd: true,
      school: { select: { conferenceRetentionDays: true } },
    },
  })
  if (!session) return false

  // Idempotency: every event must carry an id we can dedupe on. Without one,
  // replay protection is impossible (Postgres allows multiple NULLs in a UNIQUE
  // column), so we'd re-fire non-idempotent notifications on every redelivery.
  // Drop id-less events (non-spec per the SDK type) rather than reprocess them.
  if (!event.id) return false
  const existing = await db.conferenceEvent.findUnique({
    where: { eventId: event.id },
    select: { id: true },
  })
  if (existing) return false

  // This row is both the audit trail and the CLAIM on the event: a second
  // delivery finds it above and is dropped.
  const claim = await db.conferenceEvent.create({
    data: {
      schoolId,
      sessionId,
      eventType: event.event ?? "unknown",
      actorUserId: event.participant?.identity ?? null,
      payload: truncatePayload(event) as unknown as Prisma.InputJsonValue,
      eventId: event.id,
    },
    select: { id: true },
  })

  try {
    await applyEvent(event, { schoolId, sessionId, roomName, session })
  } catch (err) {
    // Give the claim back. The route answers 500 and LiveKit redelivers; with
    // the claim left in place that retry was dropped as a duplicate, so one
    // database blip during `room_finished` meant the class never closed and
    // its register was never written.
    await db.conferenceEvent.delete({ where: { id: claim.id } }).catch(() => {})
    throw err
  }

  return true
}

/**
 * When the SFU says the event HAPPENED, not when we processed it. A retried
 * delivery — retries are processed now — would otherwise stamp a leave minutes
 * late and lengthen the student's time in the room. `createdAt` is epoch
 * seconds; absent on a non-spec event, hence the fallback.
 */
function eventTime(event: WebhookEvent): Date {
  const at = Number(event.createdAt ?? 0) * 1000
  // Only a plausible moment is trusted: the SFU retries for minutes, never
  // days, and a wrong unit or a zero must not write a date into presence.
  return Math.abs(at - Date.now()) < 24 * 60 * 60 * 1000
    ? new Date(at)
    : new Date()
}

type EventContext = {
  schoolId: string
  sessionId: string
  roomName: string
  session: {
    recordingEnabled: boolean
    timetableId: string | null
    scheduledEnd: Date | null
    school: { conferenceRetentionDays: number }
  }
}

/** The work one event asks for. Throws on failure — the caller un-claims. */
async function applyEvent(
  event: WebhookEvent,
  { schoolId, sessionId, roomName, session }: EventContext
): Promise<void> {
  switch (event.event) {
    case "room_started": {
      // Whoever wins the guarded `scheduled → live` write notifies the roster
      // and starts the egress — see actions/went-live.ts. The app's own
      // writers (Join as HOST, the Start action) usually beat this webhook, in
      // which case this is a no-op that only records the room SID below.
      const { transitioned } = await transitionToLive({
        schoolId,
        sessionId,
        roomName,
        recordingEnabled: session.recordingEnabled,
        roomSid: event.room?.sid ?? null,
      })
      if (!transitioned && event.room?.sid) {
        // The app flipped the row first and had no SID to write; capture it
        // now so the row still names the SFU room it is running in.
        await db.conference.updateMany({
          where: { id: sessionId, schoolId, status: "live", roomSid: null },
          data: { roomSid: event.room.sid },
        })
      }
      break
    }

    case "room_finished": {
      // A TIMETABLE class closes by the clock, not by an empty room: everyone
      // stepping out for a few minutes (the SFU's departure/empty timeout) is
      // a break, not the end of the class. Inside the slot's window the row
      // stays as it is and the next arrival re-opens the room (join-core);
      // after the window the end-stale cron (or this event) closes it.
      if (
        session.timetableId &&
        session.scheduledEnd &&
        Date.now() <
          session.scheduledEnd.getTime() + JOIN_GRACE_AFTER_END_MIN * 60_000
      ) {
        break
      }
      // Only act on a session still in a pre-finished state — never clobber a
      // cancelled/ended row (which would corrupt audit + jitter actualEnd).
      const { count } = await db.conference.updateMany({
        where: {
          id: sessionId,
          schoolId,
          status: { in: ["scheduled", "live"] },
        },
        data: { status: "ended", actualEnd: new Date() },
      })
      if (count > 0) {
        // Best-effort: auto-mark attendance from participant presence (opt-in
        // per-school, LiveKit-only). An attendance failure must never affect
        // the webhook's at-least-once delivery semantics.
        after(() => syncLiveAttendance(schoolId, sessionId))
      }
      break
    }

    case "participant_joined": {
      const identity = event.participant?.identity
      if (identity) {
        const now = eventTime(event)
        const existing = await db.conferenceParticipant.findFirst({
          where: { sessionId, userId: identity, schoolId },
          select: { id: true, joinedAt: true, activeSince: true, status: true },
        })
        // A participant the host REMOVED stays removed: a join must not flip
        // the row back to `joined` — `removed` is what refuses their next
        // attempt. And if they are really back in the room (a token issued
        // before the removal is good for up to five minutes), put them out
        // again. Best-effort: a late event for someone already gone is a no-op.
        if (existing?.status === "removed") {
          await removeParticipant(roomName, identity).catch(() => {})
        }
        if (existing && existing.status !== "removed") {
          // Presence accumulates across reconnects. `joinedAt` is the FIRST
          // join and is never overwritten; `activeSince` marks the span that is
          // open right now. A join while a span is already open (a duplicate or
          // reordered webhook) leaves that span alone rather than restarting it.
          await db.conferenceParticipant.update({
            where: { id: existing.id },
            data: {
              status: "joined",
              joinedAt: existing.joinedAt ?? now,
              activeSince: existing.activeSince ?? now,
              ...(existing.joinedAt && !existing.activeSince
                ? { reconnectCount: { increment: 1 } }
                : {}),
            },
            select: { id: true },
          })
          // Someone is in the room now. If their other side is not, tell it
          // (actions/waiting-nudge.ts). After the response and best-effort:
          // a notice must never cost the presence write its delivery.
          after(() =>
            nudgeWaiting({ schoolId, sessionId, joinerUserId: identity }).catch(
              (err) =>
                console.error("[live-class] waiting nudge failed", {
                  schoolId,
                  sessionId,
                  err: err instanceof Error ? err.message : err,
                })
            )
          )
        }
      }
      break
    }

    // The SFU reports a participant whose connection died without a clean
    // leave the same way a leave is reported — close their open span.
    case "participant_connection_aborted":
    case "participant_left": {
      const identity = event.participant?.identity
      if (identity) {
        const existing = await db.conferenceParticipant.findFirst({
          where: { sessionId, userId: identity, schoolId },
          select: {
            id: true,
            joinedAt: true,
            activeSince: true,
            durationSeconds: true,
            status: true,
          },
        })
        if (existing) {
          const leftAt = eventTime(event)
          // Close the open span and ADD it to the running total. With no open
          // span (a duplicate leave) nothing is added — the total never double
          // counts.
          const spanStart = existing.activeSince ?? null
          const spanSeconds = spanStart
            ? Math.max(
                0,
                Math.floor((leftAt.getTime() - spanStart.getTime()) / 1000)
              )
            : 0
          await db.conferenceParticipant.update({
            where: { id: existing.id },
            data: {
              leftAt,
              activeSince: null,
              durationSeconds: (existing.durationSeconds ?? 0) + spanSeconds,
              // Being removed is itself followed by this event. Writing
              // `left` over `removed` here is what let a kicked student walk
              // straight back in.
              ...(existing.status === "removed" ? {} : { status: "left" }),
            },
            select: { id: true },
          })
        }
      }
      break
    }

    case "egress_started": {
      const egressId = event.egressInfo?.egressId
      if (egressId) {
        // Defense-in-depth: drop the event if this egressId is already owned by
        // a different tenant (the upsert key is the global egressId unique
        // index, so we can't scope the upsert itself by schoolId).
        const conflict = await db.conferenceRecording.findFirst({
          where: { egressId, NOT: { schoolId } },
          select: { id: true },
        })
        if (conflict) return
        // Populate s3Bucket + s3Region from config so playback can sign
        // URLs immediately on egress_ended without a separate update.
        // s3Key stays blank until egress_ended carries the final filename.
        let s3Bucket = ""
        let s3Region = "me-central-1"
        try {
          const cfg = getLiveKitRecordingConfig()
          s3Bucket = cfg.recordingBucket
          s3Region = cfg.recordingRegion
        } catch {
          // LiveKit env missing — still write the row so we don't drop the event.
        }
        await db.conferenceRecording.upsert({
          where: { egressId },
          create: {
            schoolId,
            sessionId,
            egressId,
            s3Bucket,
            s3Region,
            s3Key: "",
            status: "processing",
            startedAt: new Date(),
          },
          update: {
            status: "processing",
            startedAt: new Date(),
            s3Bucket,
            s3Region,
          },
        })
      }
      break
    }

    case "egress_updated": {
      // Intermediate egress states. The one that matters is failure/abort:
      // without this handler a recording that died mid-class sat at
      // "processing" forever, because egress_ended never follows a failed
      // egress with a file. Names per @livekit/protocol EgressStatus.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const info = event.egressInfo as any
      const egressId = info?.egressId as string | undefined
      const status = String(info?.status ?? "")
      if (egressId && /FAILED|ABORTED|LIMIT_REACHED/.test(status)) {
        await db.conferenceRecording.updateMany({
          where: {
            egressId,
            schoolId,
            deletedAt: null,
            status: { in: ["pending", "processing"] },
          },
          data: {
            status: "failed",
            failureReason: String(info?.error ?? status),
            completedAt: new Date(),
          },
        })
      }
      break
    }

    case "egress_ended": {
      const egressId = event.egressInfo?.egressId
      if (egressId) {
        const retention = session.school.conferenceRetentionDays
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + retention)
        // EgressInfo.fileResults carries the final S3 key + size in newer SDKs.
        // Older field name is `file`. Be defensive: try both.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const info = event.egressInfo as any
        const fileInfo = info?.fileResults?.[0] ?? info?.file
        const filename = egressObjectKey(fileInfo)
        // size is an int64 (bigint) in the LiveKit SDK — convert directly to
        // BigInt; the Number() round-trip was lossy above 2^53 bytes.
        const fileSizeBytes =
          fileInfo?.size != null ? BigInt(fileInfo.size) : null
        const duration =
          info?.endedAt && info?.startedAt
            ? Math.max(
                0,
                Math.floor(
                  (Number(info.endedAt) - Number(info.startedAt)) /
                    1_000_000_000
                )
              )
            : null
        // Only mark "ready" when egress actually produced an object key —
        // otherwise getRecordingUrl would sign a URL against an empty s3Key.
        // No file → keep prior status (processing) + record metadata only.
        // Guarded to in-flight rows only: a late/retried egress_ended must
        // never resurrect a row an admin already deleted (deletedAt set,
        // status "expired") — that would leave an invisible "ready" row whose
        // S3 object the retention cron can never purge.
        const hasFile = filename.length > 0
        const { count } = await db.conferenceRecording.updateMany({
          where: {
            egressId,
            schoolId,
            deletedAt: null,
            status: { in: ["pending", "processing"] },
          },
          data: {
            // An egress that ENDED with no object is a failure, not "still
            // processing": egress_ended is terminal, nothing follows it. Say
            // so, so the session page stops promising a recording.
            ...(hasFile
              ? { status: "ready", s3Key: filename, expiresAt }
              : {
                  status: "failed",
                  failureReason: String(
                    info?.error ?? info?.status ?? "no file produced"
                  ),
                }),
            completedAt: new Date(),
            fileSizeBytes,
            durationSeconds: duration,
          },
        })
        // Only announce a playable recording when one actually exists AND the
        // row transitioned here (a guarded no-op must not re-notify).
        if (hasFile && count > 0) {
          // Publish it as the lesson's recorded video first (idempotent on
          // publishedVideoId) so the "recording ready" notification points at
          // a lesson that already carries it.
          after(async () => {
            await publishRecordingAsLessonVideo(schoolId, sessionId, egressId)
            await notifyClassRecordingReady(schoolId, sessionId)
          })
        }
      }
      break
    }
  }
}
