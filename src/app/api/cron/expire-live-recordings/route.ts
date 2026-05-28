// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: daily — finds recordings past their expiresAt and deletes the S3
// object + marks the row deleted. Per-school retention is set on
// School.liveClassRecordingRetentionDays and resolved at egress_ended.

import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { deleteRecordingObject } from "@/lib/livekit/recording-urls"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 })
  }

  const now = new Date()
  const due = await db.liveClassRecording.findMany({
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
      await deleteRecordingObject(r)
      await db.liveClassRecording.update({
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
