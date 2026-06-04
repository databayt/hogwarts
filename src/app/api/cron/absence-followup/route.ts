// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"
import { InterventionStatus, InterventionType } from "@prisma/client"

import { logAudit } from "@/lib/audit-log"
import { ComplianceAudit } from "@/lib/compliance/audit-actions"
import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { getGuardiansForStudent } from "@/lib/guardian-utils"

export const dynamic = "force-dynamic"

/**
 * 2-hour parent-contact SLA cron (ADEK compliance requirement).
 *
 * Schedule: every 30 minutes (`*\/30 * * * *`) so the 2h SLA is met within
 * a 30-min worst case. Configured in vercel.json.
 *
 * For each compliance-enabled school, find ABSENT attendance rows where:
 *   - markedAt < now() - parentContactSlaMinutes (computed in UTC)
 *   - no AttendanceExcuse
 *   - no approved AbsenceIntention covering today
 *   - no AttendanceIntervention of type PARENT_PHONE_CALL/PARENT_EMAIL
 *     in the last 24h for this student
 *
 * Dispatches guardian notifications (in_app + email + whatsapp channels) and
 * writes an AttendanceIntervention row as the regulatory audit evidence.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request, "absence-followup")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const configs = await db.schoolComplianceConfig.findMany({
      where: { enabled: true, parentContactSlaMinutes: { gt: 0 } },
      select: {
        schoolId: true,
        parentContactSlaMinutes: true,
        school: { select: { name: true, preferredLanguage: true } },
      },
    })

    let absencesScanned = 0
    let interventionsCreated = 0

    for (const config of configs) {
      const cutoff = new Date(
        now.getTime() - config.parentContactSlaMinutes * 60 * 1000
      )
      const dayStart = new Date(now)
      dayStart.setUTCHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)
      const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const candidates = await db.attendance.findMany({
        where: {
          schoolId: config.schoolId,
          status: "ABSENT",
          markedAt: { lt: cutoff },
          date: { gte: dayStart, lt: dayEnd },
          deletedAt: null,
          excuse: null, // No excuse submitted
          student: {
            // No approved intention covering today
            absenceIntentions: {
              none: {
                status: "APPROVED",
                dateFrom: { lte: dayStart },
                dateTo: { gte: dayStart },
              },
            },
            // No recent intervention of the contact types
            attendanceInterventions: {
              none: {
                type: {
                  in: [
                    InterventionType.PARENT_PHONE_CALL,
                    InterventionType.PARENT_EMAIL,
                  ],
                },
                parentNotified: true,
                createdAt: { gte: since24h },
              },
            },
          },
        },
        select: {
          id: true,
          studentId: true,
          classId: true,
          date: true,
          markedAt: true,
          student: {
            select: { firstName: true, middleName: true, lastName: true },
          },
        },
        take: 200, // safety cap per cron tick
      })
      absencesScanned += candidates.length

      for (const absence of candidates) {
        const guardians = await getGuardiansForStudent(
          db,
          config.schoolId,
          absence.studentId
        )
        if (guardians.length === 0) continue

        const studentName = [
          absence.student.firstName,
          absence.student.middleName,
          absence.student.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim()

        const lang = (config.school?.preferredLanguage as "ar" | "en") ?? "ar"
        const title =
          lang === "ar"
            ? `غياب غير مُبلَّغ — ${studentName}`
            : `Unreported absence — ${studentName}`
        const body =
          lang === "ar"
            ? `لم يتم تبرير غياب ${studentName} اليوم. يرجى التواصل مع المدرسة خلال أقرب وقت ممكن.`
            : `${studentName} was marked absent today and the absence has not been excused. Please contact the school as soon as possible.`

        let notifiedAny = false
        for (const g of guardians) {
          if (!g.userId) continue
          try {
            await dispatchNotification({
              schoolId: config.schoolId,
              userId: g.userId,
              type: "absence_unreported_followup",
              priority: "high",
              channels: ["in_app", "email", "whatsapp"],
              title,
              body,
              lang,
              metadata: {
                studentId: absence.studentId,
                attendanceId: absence.id,
                slaMinutes: config.parentContactSlaMinutes,
              },
            })
            notifiedAny = true
          } catch (error) {
            console.error("[cron/absence-followup] dispatch failed:", error)
          }
        }

        if (notifiedAny) {
          // Write the audit-evidence intervention row.
          // Type = PARENT_EMAIL since the dispatched channels include email +
          // in-app + whatsapp (no live phone call happened). The
          // contactMethod field below records the full channel set.
          await db.attendanceIntervention.create({
            data: {
              schoolId: config.schoolId,
              studentId: absence.studentId,
              type: InterventionType.PARENT_EMAIL,
              title:
                lang === "ar"
                  ? "تواصل آلي مع ولي الأمر (متطلب ADEK)"
                  : "Automated guardian contact (ADEK requirement)",
              description:
                lang === "ar"
                  ? `تم إرسال إشعار غياب غير مُبلَّغ بعد ${config.parentContactSlaMinutes} دقيقة.`
                  : `Unreported absence notification dispatched after ${config.parentContactSlaMinutes} minutes.`,
              status: InterventionStatus.COMPLETED,
              priority: 3,
              completedDate: now,
              initiatedBy: "system",
              parentNotified: true,
              contactMethod: "in_app+email+whatsapp",
              contactResult: "dispatched",
              tags: ["adek-sla", "absence-followup"],
            },
          })

          await logAudit({
            action: ComplianceAudit.PARENT_CONTACT_QUEUED,
            entityType: "Attendance",
            entityId: absence.id,
            userId: null,
            schoolId: config.schoolId,
            metadata: {
              studentId: absence.studentId,
              channels: ["in_app", "email", "whatsapp"],
              slaMinutes: config.parentContactSlaMinutes,
            },
          })
          interventionsCreated += 1
        }
      }
    }

    return NextResponse.json({
      ok: true,
      schoolsScanned: configs.length,
      absencesScanned,
      interventionsCreated,
    })
  } catch (error) {
    console.error("[cron/absence-followup] Failed:", error)
    return NextResponse.json(
      {
        error: "Internal error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
