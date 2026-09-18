// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { parseEnabledModules } from "@/lib/enabled-modules"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { rankNextActions } from "@/components/school-dashboard/dashboard/next-action-rank"
import { getQuickActionsByRole } from "@/components/school-dashboard/dashboard/quick-actions-config"
import { loadUpcomingData } from "@/components/school-dashboard/dashboard/upcoming-queries"
import { resolveScheduleDay } from "@/components/school-dashboard/timetable/resolve-schedule-day"
import { loadTodaySchedule } from "@/components/school-dashboard/timetable/today-schedule"

import { authenticate, isAuthError } from "../lib/authenticate"
import { hasRole } from "../lib/roles"

/**
 * Mobile Dashboard API
 *
 * Returns role-based dashboard summary stats for the authenticated user.
 *
 * GET /api/mobile/dashboard
 *
 * Every field below `announcements_count` + the flat role stats is ADDITIVE —
 * the iOS app reads the original flat shape and must keep working.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { schoolId, userId, role } = auth

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Common reads (all roles). The upcoming payload is the one the web's
    // Upcoming card and next-action banner rank — shared, not ported.
    const [school, user, unreadNotifications, announcements, unreadMessages] =
      await Promise.all([
        db.school.findUnique({
          where: { id: schoolId },
          select: {
            id: true,
            name: true,
            nameEn: true,
            logoUrl: true,
            enabledModules: true,
          },
        }),
        db.user.findUnique({
          where: { id: userId },
          select: { username: true, image: true },
        }),
        db.notification.count({ where: { schoolId, userId, read: false } }),
        db.announcement.count({
          where: { schoolId, published: true },
        }),
        db.conversationParticipant.aggregate({
          where: { userId, isActive: true, conversation: { schoolId } },
          _sum: { unreadCount: true },
        }),
      ])

    // The calendar card's bottom line — the same count as the web home block.
    // Best-effort: a failure must not take the dashboard down.
    const eventsToday = await (async () => {
      try {
        return await db.event.count({
          where: {
            schoolId,
            eventDate: { gte: today, lt: tomorrow },
            status: { not: "CANCELLED" },
          },
        })
      } catch (error) {
        console.error("Mobile dashboard events today error:", error)
        return 0
      }
    })()

    const upcoming = await loadUpcomingData(userId, schoolId, role).catch(
      (error) => {
        console.error("Mobile dashboard upcoming data error:", error)
        return null
      }
    )

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
    } else if (hasRole(auth, "ADMIN", "DEVELOPER")) {
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
    } else if (role === "ACCOUNTANT") {
      // Same invoice counts the accountant's Upcoming card shows.
      const money = (upcoming ?? {}) as {
        pendingPayments?: { count?: number; totalAmount?: unknown }
        overdueInvoices?: { count?: number; totalAmount?: unknown }
      }
      const collectedToday = await db.payment.aggregate({
        where: {
          schoolId,
          status: "SUCCESS",
          paymentDate: { gte: today, lt: tomorrow },
        },
        _sum: { amount: true },
      })
      roleStats = {
        pending_invoices: money.pendingPayments?.count ?? 0,
        pending_amount: Number(money.pendingPayments?.totalAmount ?? 0),
        overdue_invoices: money.overdueInvoices?.count ?? 0,
        overdue_amount: Number(money.overdueInvoices?.totalAmount ?? 0),
        collected_today: Number(collectedToday._sum.amount ?? 0),
      }
    } else if (role === "STAFF") {
      const [totalStudents, presentToday, upcomingEvents] = await Promise.all([
        db.student.count({ where: { schoolId, status: "ACTIVE" } }),
        db.attendance.count({
          where: {
            schoolId,
            date: { gte: today, lt: tomorrow },
            status: { in: ["PRESENT", "LATE"] },
            deletedAt: null,
          },
        }),
        db.event.count({
          where: {
            schoolId,
            eventDate: { gte: today },
            status: { not: "CANCELLED" },
          },
        }),
      ])
      roleStats = {
        total_students: totalStudents,
        present_today: presentToday,
        upcoming_events: upcomingEvents,
      }
    }

    // The day's periods, for the roles whose day is a timetable.
    //
    // NOT strictly "today": the same fall-forward the web's day card does
    // (`resolveScheduleDay`, shared) — on a Friday the web shows Sunday, so the
    // app must too. `is_today` says which it landed on; a day it fell PAST is
    // never reported, closure included. When nothing in the lookahead window
    // has classes it stays on today, which is the payload iOS has always read.
    let todayTimetable = null
    if (role === "STUDENT" || role === "TEACHER") {
      try {
        const { term } = await resolveActiveTerm(schoolId)
        const resolvedTerm = term
          ? { id: term.id, yearId: term.yearId, label: "" }
          : null
        const { resolved, today: startDay } = await resolveScheduleDay((date) =>
          loadTodaySchedule({
            schoolId,
            userId,
            role,
            term: resolvedTerm,
            ...(date ? { date } : {}),
          })
        )
        const day = resolved?.day ?? startDay
        todayTimetable = {
          day_of_week: day.dayOfWeek,
          date: "date" in day ? day.date : today.toISOString(),
          is_today: resolved ? resolved.isToday : true,
          closure:
            "closure" in day && day.closure
              ? {
                  title: day.closure.title,
                  type: day.closure.exceptionType,
                }
              : null,
          periods: day.schedule.map((p) => ({
            period_id: p.periodId,
            period_name: p.periodName,
            start_time: p.startTime,
            end_time: p.endTime,
            subject: p.subject || null,
            class_name: p.className || null,
            section_id: p.sectionId ?? null,
            teacher: p.teacher || null,
            room: p.room || null,
            is_break: p.isBreak,
            timetable_id: p.timetableId,
            live_class: p.liveClass
              ? {
                  session_id: p.liveClass.sessionId,
                  provider: p.liveClass.provider,
                  meeting_url: p.liveClass.meetingUrl,
                  status: p.liveClass.status,
                }
              : null,
          })),
        }
      } catch (error) {
        console.error("Mobile dashboard today timetable error:", error)
      }
    }

    const nextActions = rankNextActions(role, upcoming)
    const quickActions = getQuickActionsByRole(role).map((a) => {
      const href = a.href ?? ""
      return {
        key: href.replace(/^\//, "").replace(/\//g, "_") || "home",
        label: a.label,
        description: a.description,
        href,
        icon: a.iconName,
      }
    })

    return NextResponse.json({
      user_name: user?.username || auth.email,
      avatar_url: user?.image,
      role,
      school_name: school?.nameEn || school?.name || "",
      unread_notifications: unreadNotifications,
      announcements_count: announcements,
      ...roleStats,
      // --- additive (2026-09) ---
      school: {
        id: schoolId,
        name: school?.name ?? "",
        name_en: school?.nameEn ?? null,
        logo_url: school?.logoUrl ?? null,
        // null = every module enabled
        enabled_modules: parseEnabledModules(school?.enabledModules),
      },
      unread_messages: unreadMessages._sum.unreadCount ?? 0,
      events_today: eventsToday,
      next_actions: nextActions,
      quick_actions: quickActions,
      today_timetable: todayTimetable,
    })
  } catch (error) {
    console.error("Mobile dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
