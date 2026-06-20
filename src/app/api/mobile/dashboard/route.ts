// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * Mobile Dashboard API
 *
 * Returns role-based dashboard summary stats for the authenticated user.
 *
 * GET /api/mobile/dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { schoolId, userId, role } = auth

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { name: true, nameEn: true },
    })

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { username: true, image: true },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Common stats (all roles)
    const [unreadNotifications, announcements] = await Promise.all([
      db.notification.count({ where: { schoolId, userId, read: false } }),
      db.announcement.count({
        where: { schoolId, published: true },
      }),
    ])

    let roleStats = {}

    if (role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { userId, schoolId },
        select: { id: true, sectionId: true },
      })

      if (student) {
        const [
          attendanceTotal,
          attendancePresent,
          upcomingExams,
          timetableToday,
        ] = await Promise.all([
          db.attendance.count({
            where: { schoolId, studentId: student.id, deletedAt: null },
          }),
          db.attendance.count({
            where: {
              schoolId,
              studentId: student.id,
              status: "PRESENT",
              deletedAt: null,
            },
          }),
          db.schoolExam.count({
            where: {
              schoolId,
              examDate: { gte: today },
              status: { not: "CANCELLED" },
            },
          }),
          db.timetable.count({
            where: {
              schoolId,
              sectionId: student.sectionId,
              dayOfWeek: today.getDay(),
            },
          }),
        ])

        roleStats = {
          attendance_percentage:
            attendanceTotal > 0
              ? Math.round((attendancePresent / attendanceTotal) * 1000) / 10
              : 0,
          upcoming_exams: upcomingExams,
          today_classes: timetableToday,
        }
      }
    } else if (role === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { userId, schoolId },
        select: { id: true },
      })

      if (teacher) {
        const [myClasses, timetableToday] = await Promise.all([
          db.timetable.findMany({
            where: { schoolId, teacherId: teacher.id },
            select: { sectionId: true },
            distinct: ["sectionId"],
          }),
          db.timetable.count({
            where: {
              schoolId,
              teacherId: teacher.id,
              dayOfWeek: today.getDay(),
            },
          }),
        ])

        roleStats = {
          total_classes: myClasses.length,
          today_classes: timetableToday,
        }
      }
    } else if (role === "GUARDIAN") {
      const guardian = await db.guardian.findFirst({
        where: { userId, schoolId },
        select: { id: true },
      })

      if (guardian) {
        const children = await db.studentGuardian.count({
          where: { guardianId: guardian.id },
        })
        roleStats = { children_count: children }
      }
    } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
      const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
        db.student.count({ where: { schoolId, status: "ACTIVE" } }),
        db.teacher.count({ where: { schoolId, employmentStatus: "ACTIVE" } }),
        db.section.count({ where: { schoolId } }),
      ])

      roleStats = {
        total_students: totalStudents,
        total_teachers: totalTeachers,
        total_classes: totalClasses,
      }
    }

    return NextResponse.json({
      user_name: user?.username || auth.email,
      avatar_url: user?.image,
      role,
      school_name: school?.nameEn || school?.name || "",
      unread_notifications: unreadNotifications,
      announcements_count: announcements,
      ...roleStats,
    })
  } catch (error) {
    console.error("Mobile dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
