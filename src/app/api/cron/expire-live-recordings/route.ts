// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: daily — finds recordings past their expiresAt and deletes the S3
// object + marks the row deleted. Per-school retention is set on
// School.conferenceRetentionDays and resolved at egress_ended.

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { deleteRecordingObject } from "@/components/school-dashboard/conference/livekit/recording-urls"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300 // Vercel Pro: up to 500 S3 deletes serially

export async function GET(req: Request) {
  if (!isAuthorizedCron(req, "expire-live-recordings")) {
    return new NextResponse("unauthorized", { status: 401 })
  }

  const now = new Date()
  const due = await db.conferenceRecording.findMany({
    where: {
      status: "ready",
      deletedAt: null,
      expiresAt: { lte: now },
    },
    select: {
      id: true,
      s3Bucket: true,
      s3Key: true,
      s3Region: true,
    },
    take: 500,
  })

  let purged = 0
  for (const r of due) {
    try {
      const deleted = await deleteRecordingObject(r)
      if (!deleted) {
        // S3 delete failed (a missing object counts as success). Keep the row
        // so the next run retries — never flag it deleted while the object lives.
        console.error(
          "[live-class] retention purge: S3 delete failed, keeping row",
          { recordingId: r.id }
        )
        continue
      }
      await db.conferenceRecording.update({
        where: { id: r.id },
        data: { status: "expired", deletedAt: new Date() },
      })
      purged++
    } catch (err) {
      console.error("[live-class] retention purge failed", {
        recordingId: r.id,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return NextResponse.json({ ok: true, purged, candidates: due.length })
}
