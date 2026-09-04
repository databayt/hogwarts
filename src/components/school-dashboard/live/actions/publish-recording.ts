// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Live Class → Recorded Lesson.
//
// When egress finishes for a session anchored to a catalog lesson, the MP4 is
// published as that lesson's video in lumos, so the student's "recorded
// lesson" carries everything the lesson page already has — resume, progress,
// the PDFs, the summary, the practice questions, the quiz. Called from the
// webhook's `egress_ended` branch, off the response path.
//
// Not a `"use server"` action: there is no user session in a webhook.
import "server-only"

import { revalidatePath } from "next/cache"

import { toCloudFrontUrl } from "@/lib/cloudfront-url"
import { db } from "@/lib/db"
import { copyObject, deleteObject, getObjectSize } from "@/lib/s3"
import {
  checkSchoolVideoQuota,
  incrementSchoolVideoUsage,
} from "@/components/lumos/lib/quota"
import { prewarm } from "@/components/translation/prewarm"

export type PublishOutcome =
  | { published: true; videoId: string }
  | {
      published: false
      reason:
        | "not_found"
        | "not_ready"
        | "already_published"
        | "no_lesson"
        | "disabled"
        | "no_uploader"
        | "copy_failed"
        | "quota"
        | "error"
    }

/**
 * Idempotent on `ConferenceRecording.publishedVideoId`: a retried webhook, a
 * second egress_ended, or a manual re-run publishes nothing twice.
 *
 * The object is COPIED, not linked. Egress writes under `schools/…` with the
 * school's retention (`expiresAt` + the purge cron); the lesson video lives
 * under `stream/<schoolId>/video/` with none, so the recorded lesson outlives
 * the recording's retention window — which is the point of publishing it.
 */
export async function publishRecordingAsLessonVideo(
  schoolId: string,
  sessionId: string,
  egressId: string
): Promise<PublishOutcome> {
  try {
    const recording = await db.conferenceRecording.findFirst({
      where: { egressId, schoolId, sessionId, deletedAt: null },
      select: {
        id: true,
        status: true,
        s3Bucket: true,
        s3Key: true,
        fileSizeBytes: true,
        durationSeconds: true,
        publishedVideoId: true,
        session: {
          select: {
            id: true,
            title: true,
            lang: true,
            catalogLessonId: true,
            school: { select: { conferenceAutoPublishRecordings: true } },
            scheduledStart: true,
            teacher: { select: { userId: true } },
            subject: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
    })
    if (!recording) return { published: false, reason: "not_found" }
    if (recording.publishedVideoId) {
      return { published: false, reason: "already_published" }
    }
    if (recording.status !== "ready" || !recording.s3Key) {
      return { published: false, reason: "not_ready" }
    }
    const session = recording.session
    // Assemblies, PD, town halls: nothing to attach a recorded lesson to.
    if (!session.catalogLessonId)
      return { published: false, reason: "no_lesson" }
    const uploaderId = session.teacher?.userId ?? null
    if (!uploaderId) return { published: false, reason: "no_uploader" }

    // Both checks below run BEFORE the S3 copy — nothing is copied unless it
    // will actually be published. Order: the switch first (no S3 call at
    // all), then quota (usually answerable from the row itself, see below).
    if (!session.school?.conferenceAutoPublishRecordings) {
      // School setting: keep the recording on the session page only.
      return { published: false, reason: "disabled" }
    }

    const key = `stream/${schoolId}/video/live-${recording.id}.mp4`

    // egress_ended writes `fileSizeBytes` alongside `status: "ready"`
    // (webhook.ts), so the common case never needs an S3 round-trip to know
    // whether this publish fits the school's quota. Only an egress payload
    // that omitted the size (fileSizeBytes null) falls back to a post-copy
    // HEAD below.
    let fileSize =
      recording.fileSizeBytes != null ? Number(recording.fileSizeBytes) : 0
    if (recording.fileSizeBytes != null) {
      const quota = await checkSchoolVideoQuota(
        schoolId,
        recording.fileSizeBytes
      )
      if (!quota.allowed) {
        console.warn("[conference] recording publish blocked by quota", {
          schoolId,
          sessionId,
        })
        return { published: false, reason: "quota" }
      }
    }

    const copied = await copyObject(
      recording.s3Bucket,
      recording.s3Key,
      key,
      "video/mp4"
    )
    if (!copied) return { published: false, reason: "copy_failed" }

    if (recording.fileSizeBytes == null) {
      fileSize = (await getObjectSize(key)) ?? 0
      if (fileSize > 0) {
        const quota = await checkSchoolVideoQuota(schoolId, fileSize)
        if (!quota.allowed) {
          console.warn("[conference] recording publish blocked by quota", {
            schoolId,
            sessionId,
          })
          // The size was only knowable post-copy, so the copy already
          // happened — unlike the pre-copy quota path above, this one must
          // clean up after itself.
          await deleteObject(key).catch(() => undefined)
          return { published: false, reason: "quota" }
        }
      }
    }

    const lang = session.lang === "en" ? "en" : "ar"
    const day = session.scheduledStart.toISOString().slice(0, 10)
    const title = `${session.title} — ${day}`
    const description =
      lang === "ar"
        ? `تسجيل الحصة المباشرة بتاريخ ${day}.`
        : `Recording of the live class on ${day}.`

    // APPROVED, deliberately. Every other writer of a Video row is a catalog
    // CONTRIBUTION and enters the platform's review queue as PENDING. This is
    // the school's own class, recorded for its own students; there is nothing
    // for the platform to review and a student should not wait on it. It stays
    // school-visible (`SCHOOL`) — it never leaves the tenant.
    //
    // Access note: conference recordings are SECTION-scoped; publishing widens
    // this one to the whole school on that lesson (lumos has no section tier).
    // This is the CURRENT behavior, not a reviewed trade-off — nothing in
    // conference/ISSUE.md records it as a deliberate decision (checked
    // 2026-09-04). Open item: record it there, or narrow lumos Video
    // visibility to a section, once lumos grows a section tier.
    const video = await db.video.create({
      data: {
        catalogLessonId: session.catalogLessonId,
        userId: uploaderId,
        schoolId,
        title,
        description,
        lang,
        // Guarded: falls back to a raw S3 URL rather than rewriting onto a
        // CloudFront distribution that may not front `AWS_S3_BUCKET` — see
        // toCloudFrontUrl's own doc comment for the 403 this once caused.
        videoUrl: toCloudFrontUrl(
          process.env.AWS_S3_BUCKET
            ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`
            : key
        ),
        provider: "self-hosted",
        storageProvider: "s3",
        storageKey: key,
        fileSize: fileSize > 0 ? fileSize : null,
        durationSeconds: recording.durationSeconds ?? null,
        visibility: "SCHOOL",
        approvalStatus: "APPROVED",
        approvedBy: uploaderId,
        approvedAt: new Date(),
        // School policy: recordings are watched in the app, never downloaded.
        allowDownload: false,
        tags: ["live-class"],
      },
      select: { id: true },
    })

    // Guarded: if a concurrent publish won the race, keep the first video and
    // leave this row pointing at it.
    const { count } = await db.conferenceRecording.updateMany({
      where: { id: recording.id, publishedVideoId: null },
      data: { publishedVideoId: video.id },
    })
    if (count === 0) {
      await db.video.delete({ where: { id: video.id } }).catch(() => undefined)
      return { published: false, reason: "already_published" }
    }

    if (fileSize > 0) await incrementSchoolVideoUsage(schoolId, fileSize)
    void prewarm("Video", { title, description }, { schoolId }).catch(
      () => undefined
    )
    // Route PATTERNS, never a concrete slug — see video-actions.ts.
    revalidatePath(
      "/[lang]/s/[subdomain]/lumos/dashboard/[slug]/[lessonId]",
      "page"
    )
    revalidatePath(
      "/[lang]/s/[subdomain]/lumos/courses/[slug]/[lessonId]",
      "page"
    )
    revalidatePath("/[lang]/s/[subdomain]/live/[id]", "page")

    return { published: true, videoId: video.id }
  } catch (err) {
    console.error("[conference] publishRecordingAsLessonVideo failed", {
      schoolId,
      sessionId,
      egressId,
      err: err instanceof Error ? err.message : String(err),
    })
    return { published: false, reason: "error" }
  }
}
