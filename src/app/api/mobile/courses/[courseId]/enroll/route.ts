// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"
import { findCatalogSubject } from "../../lib/subject"

/**
 * Enrol this reader in a catalog subject — the free half of
 * `catalog-actions.ts#enrollInSubject`, which is the half a phone can finish.
 *
 * A paid subject on the web opens a Stripe checkout page and waits for the
 * webhook to flip the enrolment ACTIVE. Minting a checkout session here would
 * mean inventing success and cancel URLs for a screen that does not exist, so
 * a paid subject answers 402 with its price and the app sends the reader to
 * the web to pay. The enrolment the webhook then activates is the same row
 * this route would have created.
 *
 * POST /api/mobile/courses/:courseId/enroll
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    // The JWT's school is authoritative; the app also sends `?schoolId=` and
    // it is ignored, as every other mobile route ignores it.
    const { schoolId, userId } = auth
    const { courseId } = await params

    const subject = await findCatalogSubject(courseId)
    if (!subject) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (subject.price && Number(subject.price) > 0) {
      return NextResponse.json(
        {
          error: "payment_required",
          price: Number(subject.price),
          currency: subject.currency,
          checkout_path: `/lumos/courses/${subject.slug}`,
        },
        { status: 402 }
      )
    }

    const existing = await db.enrollment.findFirst({
      where: { userId, catalogSubjectId: subject.id },
      select: { id: true, isActive: true, schoolId: true },
    })

    if (existing?.isActive) {
      return NextResponse.json({ error: "already_enrolled" }, { status: 409 })
    }

    const enrollment = existing
      ? await db.enrollment.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            status: "ACTIVE",
            ...(existing.schoolId ? {} : { schoolId }),
          },
          select: ENROLLMENT_SELECT,
        })
      : await db.enrollment.create({
          data: {
            userId,
            catalogSubjectId: subject.id,
            schoolId,
            isActive: true,
            status: "ACTIVE",
          },
          select: ENROLLMENT_SELECT,
        })

    return NextResponse.json(await toEnrollmentDto(enrollment), { status: 201 })
  } catch (error) {
    console.error("[mobile/courses/:id/enroll] POST failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const ENROLLMENT_SELECT = {
  id: true,
  userId: true,
  catalogSubjectId: true,
  createdAt: true,
  updatedAt: true,
  certificate: { select: { completedAt: true } },
} as const

type EnrollmentRow = {
  id: string
  userId: string
  catalogSubjectId: string
  createdAt: Date
  updatedAt: Date
  certificate: { completedAt: Date } | null
}

/**
 * `progress` is the share of the subject's published lessons this reader has
 * finished — counted, not stored, because nothing on `Enrollment` holds it.
 */
async function toEnrollmentDto(enrollment: EnrollmentRow) {
  const [total, done] = await Promise.all([
    db.lesson.count({
      where: { chapter: { subjectId: enrollment.catalogSubjectId }, status: "PUBLISHED" },
    }),
    db.lessonProgress.count({
      where: { userId: enrollment.userId, enrollmentId: enrollment.id, isCompleted: true },
    }),
  ])

  return {
    id: enrollment.id,
    course_id: enrollment.catalogSubjectId,
    user_id: enrollment.userId,
    progress: total > 0 ? Math.round((done / total) * 1000) / 1000 : 0,
    started_at: enrollment.createdAt.toISOString(),
    last_accessed_at: enrollment.updatedAt.toISOString(),
    completed_at: enrollment.certificate?.completedAt.toISOString() ?? null,
  }
}
