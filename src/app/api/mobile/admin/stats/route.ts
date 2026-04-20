// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/admin/stats — admin dashboard stats
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      totalStudents,
      totalTeachers,
      totalGuardians,
      totalSections,
      todayAttendance,
      todayPresent,
      upcomingExams,
      unreadNotifications,
      activeConversations,
    ] = await Promise.all([
      db.student.count({
        where: { schoolId: auth.schoolId, status: "ACTIVE" },
      }),
      db.teacher.count({
        where: { schoolId: auth.schoolId, employmentStatus: "ACTIVE" },
      }),
      db.guardian.count({ where: { schoolId: auth.schoolId } }),
      db.section.count({ where: { schoolId: auth.schoolId } }),
      db.attendance.count({
        where: {
          schoolId: auth.schoolId,
          date: { gte: today, lt: tomorrow },
          deletedAt: null,
        },
      }),
      db.attendance.count({
        where: {
          schoolId: auth.schoolId,
          date: { gte: today, lt: tomorrow },
          status: "PRESENT",
          deletedAt: null,
        },
      }),
      db.schoolExam.count({
        where: {
          schoolId: auth.schoolId,
          examDate: { gte: today },
          status: { not: "CANCELLED" },
        },
      }),
      db.notification.count({
        where: { schoolId: auth.schoolId, userId: auth.userId, read: false },
      }),
      db.conversation.count({
        where: { schoolId: auth.schoolId, isArchived: false },
      }),
    ])

    return NextResponse.json({
      total_students: totalStudents,
      total_teachers: totalTeachers,
      total_guardians: totalGuardians,
      total_sections: totalSections,
      today_attendance_count: todayAttendance,
      today_present_count: todayPresent,
      today_attendance_rate:
        todayAttendance > 0
          ? Math.round((todayPresent / todayAttendance) * 1000) / 10
          : 0,
      upcoming_exams: upcomingExams,
      unread_notifications: unreadNotifications,
      active_conversations: activeConversations,
    })
  } catch (error) {
    console.error("Mobile admin stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
