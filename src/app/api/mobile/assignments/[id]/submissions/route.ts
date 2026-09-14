// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import {
  getStudentSubmission,
  submitAssignmentCore,
  submitAssignmentSchema,
} from "@/components/school-dashboard/listings/assignments/submit-core"

import { authenticate, isAuthError } from "../../../lib/authenticate"
import { hasRole } from "../../../lib/roles"
import {
  isTenantStorageUrl,
  signAttachmentUrls,
} from "../../../lib/tenant-storage"
import {
  pageParams,
  resolveAssignmentAccess,
  submissionDto,
} from "../../shared"

const SUBMISSION_STATUSES = [
  "NOT_SUBMITTED",
  "DRAFT",
  "SUBMITTED",
  "LATE_SUBMITTED",
  "GRADED",
  "RETURNED",
] as const

/**
 * GET /api/mobile/assignments/:id/submissions — teacher / admin view
 *
 * Every submission for the assignment, newest first. Query: page, per_page,
 * status. A TEACHER must teach the assignment's class.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (!hasRole(auth, "TEACHER", "ADMIN", "DEVELOPER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const access = await resolveAssignmentAccess(auth, id, null)
    if (!access.ok) return access.response

    const url = new URL(request.url)
    const { page, perPage } = pageParams(url)
    const status = url.searchParams.get("status")
    if (
      status &&
      !(SUBMISSION_STATUSES as readonly string[]).includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const where = {
      schoolId: auth.schoolId,
      assignmentId: id,
      ...(status
        ? { status: status as (typeof SUBMISSION_STATUSES)[number] }
        : {}),
    }

    const [rows, total] = await Promise.all([
      db.assignmentSubmission.findMany({
        where,
        orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          content: true,
          attachments: true,
          score: true,
          feedback: true,
          gradedAt: true,
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      db.assignmentSubmission.count({ where }),
    ])

    return NextResponse.json({
      data: await Promise.all(
        rows.map(async (r) => ({
          id: r.id,
          student_id: r.student.id,
          student_name: `${r.student.firstName} ${r.student.lastName}`.trim(),
          status: r.status,
          submitted_at: r.submittedAt,
          content: r.content,
          attachments: r.attachments,
          attachment_urls: await signAttachmentUrls(r.attachments),
          score: r.score === null ? null : Number(r.score),
          feedback: r.feedback,
          graded_at: r.gradedAt,
        }))
      ),
      total,
      page,
      per_page: perPage,
    })
  } catch (error) {
    console.error("Mobile assignment submissions list error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/** submitAssignmentCore outcome → HTTP status + stable error code. */
const REFUSALS: Record<string, [number, string]> = {
  notStudent: [403, "NOT_STUDENT"],
  notFound: [404, "NOT_FOUND"],
  notInClass: [403, "NOT_IN_CLASS"],
  notOpen: [403, "NOT_OPEN"],
  alreadyGraded: [409, "ALREADY_GRADED"],
  stale: [409, "STALE"],
}

/**
 * POST /api/mobile/assignments/:id/submissions — student hands in
 *
 * Body: { content?: string, attachments?: string[] } — attachments are URLs
 * minted by POST /api/mobile/upload/presign (this school's bucket objects).
 * Resubmitting overwrites until the work is graded. Same core as the web
 * action and the offline outbox: late detection, class membership, draft and
 * already-graded guards.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (!hasRole(auth, "STUDENT")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    const b = (body ?? {}) as { content?: unknown; attachments?: unknown }
    const parsed = submitAssignmentSchema.safeParse({
      assignmentId: id,
      content: b.content ?? undefined,
      attachments: b.attachments ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const content = parsed.data.content?.trim() || null
    const attachments = parsed.data.attachments ?? []
    if (!content && attachments.length === 0) {
      return NextResponse.json(
        { error: "content or attachments required" },
        { status: 400 }
      )
    }
    if (!attachments.every((u) => isTenantStorageUrl(u, auth.schoolId))) {
      return NextResponse.json(
        { error: "Attachments must be files uploaded to this school" },
        { status: 400 }
      )
    }

    const out = await submitAssignmentCore({
      userId: auth.userId,
      schoolId: auth.schoolId,
      assignmentId: id,
      content,
      attachments,
      submittedAt: new Date(),
    })

    if (out.status !== "submitted") {
      const [status, code] = REFUSALS[out.status] ?? [400, "REJECTED"]
      return NextResponse.json({ error: code }, { status })
    }

    const student = await db.student.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })
    const submission = student
      ? await getStudentSubmission(auth.schoolId, student.id, id)
      : null

    return NextResponse.json(await submissionDto(submission), {
      status: 201,
    })
  } catch (error) {
    console.error("Mobile assignment submit error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
