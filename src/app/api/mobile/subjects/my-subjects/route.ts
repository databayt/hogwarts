// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/subjects/my-subjects — subjects the user is enrolled in or teaches
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (auth.role === "STUDENT") {
      // Find student record
      const student = await db.student.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
        select: { id: true, sectionId: true },
      })

      if (!student) {
        return NextResponse.json({ data: [] })
      }

      // Get subjects via student's classes (StudentClass -> Class -> Subject)
      const studentClasses = await db.studentClass.findMany({
        where: { studentId: student.id, schoolId: auth.schoolId },
        select: {
          class: {
            select: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  department: true,
                },
              },
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      })

      // Deduplicate by subject ID
      const seen = new Set<string>()
      const data = studentClasses
        .filter((sc) => {
          if (seen.has(sc.class.subject.id)) return false
          seen.add(sc.class.subject.id)
          return true
        })
        .map((sc) => ({
          id: sc.class.subject.id,
          name: sc.class.subject.name,
          slug: sc.class.subject.slug,
          department: sc.class.subject.department,
          teacher_name: sc.class.teacher
            ? `${sc.class.teacher.firstName} ${sc.class.teacher.lastName}`
            : null,
        }))

      return NextResponse.json({ data })
    }

    if (auth.role === "TEACHER") {
      // Find teacher record
      const teacher = await db.teacher.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
        select: { id: true },
      })

      if (!teacher) {
        return NextResponse.json({ data: [] })
      }

      // Get subjects from timetable entries
      const timetableEntries = await db.timetable.findMany({
        where: {
          schoolId: auth.schoolId,
          teacherId: teacher.id,
          subjectId: { not: null },
        },
        select: {
          subject: {
            select: {
              id: true,
              name: true,
              slug: true,
              department: true,
            },
          },
        },
        distinct: ["subjectId"],
      })

      const data = timetableEntries
        .filter((e) => e.subject)
        .map((e) => ({
          id: e.subject!.id,
          name: e.subject!.name,
          slug: e.subject!.slug,
          department: e.subject!.department,
          teacher_name: null,
        }))

      return NextResponse.json({ data })
    }

    // For ADMIN or other roles, return all school subjects
    const selections = await db.subjectSelection.findMany({
      where: { schoolId: auth.schoolId, isActive: true },
      select: {
        subject: {
          select: {
            id: true,
            name: true,
            slug: true,
            department: true,
          },
        },
      },
    })

    const seen = new Set<string>()
    const data = selections
      .filter((s) => {
        if (seen.has(s.subject.id)) return false
        seen.add(s.subject.id)
        return true
      })
      .map((s) => ({
        id: s.subject.id,
        name: s.subject.name,
        slug: s.subject.slug,
        department: s.subject.department,
        teacher_name: null,
      }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile my subjects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
