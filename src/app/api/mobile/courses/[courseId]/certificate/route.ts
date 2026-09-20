// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"
import { findCatalogSubject } from "../../lib/subject"

/**
 * This reader's certificate for a subject, if they have one.
 *
 * Certificates are issued by `completeLessonCore` when the last published
 * lesson of a subject is finished — not here. A reader who has not finished
 * gets 404, which is the truthful answer to "where is my certificate".
 *
 * GET /api/mobile/courses/:courseId/certificate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { userId } = auth
    const { courseId } = await params

    const subject = await findCatalogSubject(courseId)
    if (!subject) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const certificate = await db.subjectCertificate.findFirst({
      where: { userId, catalogSubjectId: subject.id },
      select: {
        id: true,
        certificateNumber: true,
        subjectTitle: true,
        completedAt: true,
      },
    })
    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    // A certificate carries the reader's name, and `User` has no name — only
    // a username. The person's actual name lives on their Student row, so
    // that is what is printed when there is one.
    const [student, user] = await Promise.all([
      db.student.findFirst({
        where: { userId },
        select: { firstName: true, middleName: true, lastName: true },
      }),
      db.user.findUnique({ where: { id: userId }, select: { username: true } }),
    ])
    const studentName =
      [student?.firstName, student?.middleName, student?.lastName]
        .filter(Boolean)
        .join(" ") ||
      user?.username ||
      ""

    return NextResponse.json({
      id: certificate.id,
      course_id: subject.id,
      user_id: userId,
      student_name: studentName,
      course_name: certificate.subjectTitle,
      completed_at: certificate.completedAt.toISOString(),
      // Nothing renders a certificate file today; the number is what a school
      // checks, and sending a URL that 404s would be worse than sending none.
      certificate_url: null,
      verification_code: certificate.certificateNumber,
    })
  } catch (error) {
    console.error("[mobile/courses/:id/certificate] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
