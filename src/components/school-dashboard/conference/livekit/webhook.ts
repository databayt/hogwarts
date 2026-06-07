// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { Prisma } from "@prisma/client"
import { WebhookReceiver, type WebhookEvent } from "livekit-server-sdk"

import { db } from "@/lib/db"
import {
  notifyClassRecordingReady,
  notifyClassStarted,
} from "@/components/school-dashboard/conference/actions/notifications"

import { getLiveKitConfig, isLiveKitConfigured } from "./client"
import { startCompositeEgress } from "./egress"
import { parseRoomName } from "./room-naming"

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

  await db.conferenceEvent.create({
    data: {
      schoolId,
      sessionId,
      eventType: event.event ?? "unknown",
      actorUserId: event.participant?.identity ?? null,
      payload: truncatePayload(event) as unknown as Prisma.InputJsonValue,
      eventId: event.id,
    },
  })

  switch (event.event) {
    case "room_started":
      await db.conference.update({
        where: { id: sessionId },
        data: {
          status: "live",
          actualStart: new Date(),
          roomSid: event.room?.sid ?? null,
        },
      })
      // Best-effort fan-out to enrolled students + guardians + teacher.
      void notifyClassStarted(schoolId, sessionId)
      // Auto-start recording when the session opted in. The SFU emits
      // `egress_started` back to this webhook, which creates the
      // ConferenceRecording row — so we only kick off egress here. Best-effort:
      // an egress failure must never roll back the room going live.
      if (session.recordingEnabled && isLiveKitConfigured()) {
        try {
          await startCompositeEgress({ roomName, schoolId, sessionId })
        } catch (err) {
          console.error("[webhook] auto-egress start failed:", err)
        }
      }
      break

    case "room_finished":
      await db.conference.update({
        where: { id: sessionId },
        data: { status: "ended", actualEnd: new Date() },
      })
      break

    case "participant_joined": {
      const identity = event.participant?.identity
      if (identity) {
        await db.conferenceParticipant.updateMany({
          where: { sessionId, userId: identity },
          data: { joinedAt: new Date(), status: "joined" },
        })
      }
      break
    }

    case "participant_left": {
      const identity = event.participant?.identity
      if (identity) {
        const existing = await db.conferenceParticipant.findFirst({
          where: { sessionId, userId: identity },
          select: { id: true, joinedAt: true },
        })
        if (existing) {
          const leftAt = new Date()
          const durationSeconds = existing.joinedAt
            ? Math.max(
                0,
                Math.floor(
                  (leftAt.getTime() - existing.joinedAt.getTime()) / 1000
                )
              )
            : null
          await db.conferenceParticipant.update({
            where: { id: existing.id },
            data: { leftAt, durationSeconds, status: "left" },
          })
        }
      }
      break
    }

    case "egress_started": {
      const egressId = event.egressInfo?.egressId
      if (egressId) {
        // Populate s3Bucket + s3Region from config so playback can sign
        // URLs immediately on egress_ended without a separate update.
        // s3Key stays blank until egress_ended carries the final filename.
        let s3Bucket = ""
        let s3Region = "me-central-1"
        try {
          const cfg = getLiveKitConfig()
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
        const filename = fileInfo?.filename ?? ""
        const size = fileInfo?.size ? Number(fileInfo.size) : null
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
        const hasFile = filename.length > 0
        await db.conferenceRecording.updateMany({
          where: { egressId },
          data: {
            ...(hasFile ? { status: "ready", s3Key: filename, expiresAt } : {}),
            completedAt: new Date(),
            fileSizeBytes: size ? BigInt(size) : null,
            durationSeconds: duration,
          },
        })
        // Only announce a playable recording when one actually exists.
        if (hasFile) {
          void notifyClassRecordingReady(schoolId, sessionId)
        }
      }
      break
    }
  }

  return true
}
