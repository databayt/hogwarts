// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Profile activity seed — makes every profile surface show live data.
 *
 * The profile block renders exclusively from real rows; this module seeds the
 * rows the other seeds never produced, focused on the current calendar year so
 * the contribution graph's DEFAULT view (current year) is alive:
 *
 *  1. Current-year attendance for the demo student's section, marked by the
 *     demo teacher (lights the student AND teacher graphs, earns
 *     perfect_attendance / diligent_educator).
 *  2. UserActivity feed rows for demo accounts + a believable slice of users.
 *  3. PinnedItems per role, derived from each user's real subjects / classes /
 *     children / organizations.
 *  4. A parent↔teacher direct conversation with parent-sent messages
 *     (lights the parent graph).
 *  5. Expense approvals spread across admin/staff/accountant users this year
 *     (lights the staff graph — they were all approved by the dev account).
 *  6. Demo-student achievements in distinct categories (varied badge art).
 *  7. GitHub-style User fields (status, website, social links, timezone) for
 *     the demo accounts — only where currently null.
 *  8. Badge recompute for every touched user.
 *
 * Idempotent: every phase is guarded by existing-row checks or unique-key
 * upserts; a deterministic PRNG keeps re-runs from multiplying data.
 */

import type { PrismaClient, UserActivityType } from "@prisma/client"

import { recomputeProfileBadges } from "@/components/school-dashboard/profile/badges"

import { HP_CHARACTERS } from "./constants"
import { logSuccess, logWarning } from "./utils"

/**
 * Pre-2026-07-19 seeds stored the HP persona bios in ENGLISH; the school's
 * content language is Arabic, so already-seeded DBs need a one-time rewrite.
 * Matched by exact (email, old bio) so a user-edited bio is never clobbered.
 */
const BIO_NORMALIZATION: Array<{ email: string; from: string; to: string }> = [
  {
    email: "dev@databayt.org",
    from: "Potions Master and Head of Slytherin House.",
    to: HP_CHARACTERS.dev.bio,
  },
  {
    email: "admin@databayt.org",
    from: "Headmaster & Chief Warlock\nTransfiguration & Ancient Magic",
    to: HP_CHARACTERS.admin.bio,
  },
  {
    email: "accountant@databayt.org",
    from: "Charms Master and Head of Ravenclaw House.",
    to: HP_CHARACTERS.accountant.bio,
  },
  {
    email: "teacher@databayt.org",
    from: "Deputy Headmistress and Transfiguration professor.",
    to: HP_CHARACTERS.teacher.bio,
  },
  {
    email: "student@databayt.org",
    from: "The Boy Who Lived.",
    to: HP_CHARACTERS.student.bio,
  },
  {
    email: "parent@databayt.org",
    from: "Gryffindor alumni. Marauder.",
    to: HP_CHARACTERS.guardian0.bio,
  },
  {
    email: "parent1@databayt.org",
    from: "Exceptionally gifted witch. Known for her sacrifice.",
    to: HP_CHARACTERS.guardian1.bio,
  },
  {
    email: "staff@databayt.org",
    from: "Keeper of Keys and Grounds at Hogwarts.",
    to: HP_CHARACTERS.staff.bio,
  },
  {
    email: "user@databayt.org",
    from: "Gryffindor student. Future Herbology professor.",
    to: HP_CHARACTERS.user.bio,
  },
  {
    email: "applicant@databayt.org",
    from: "Ravenclaw student. Sees what others cannot.",
    to: HP_CHARACTERS.applicant.bio,
  },
]

// Deterministic PRNG so re-runs regenerate the same shape.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DEMO_EMAILS = {
  admin: "admin@databayt.org",
  teacher: "teacher@databayt.org",
  student: "student@databayt.org",
  parent: "parent@databayt.org",
  staff: "staff@databayt.org",
  accountant: "accountant@databayt.org",
} as const

/** School days (Sun–Thu; Sudan weekend is Fri+Sat) of the current year, UTC. */
function schoolDaysOfYearToDate(): Date[] {
  const now = new Date()
  const year = now.getUTCFullYear()
  const days: Date[] = []
  const d = new Date(Date.UTC(year, 0, 1))
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  while (d < today) {
    const dow = d.getUTCDay()
    if (dow !== 5 && dow !== 6) days.push(new Date(d))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return days
}

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0]
}

export async function seedProfileActivity(
  prisma: PrismaClient,
  schoolId: string
): Promise<void> {
  const rand = mulberry32(20260719)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
  const randInt = (min: number, max: number) =>
    Math.floor(rand() * (max - min + 1)) + min

  // ---- resolve demo accounts ----------------------------------------------
  const demoUsers = await prisma.user.findMany({
    where: { schoolId, email: { in: Object.values(DEMO_EMAILS) } },
    select: {
      id: true,
      email: true,
      role: true,
      statusEmoji: true,
      website: true,
      socialLinks: true,
      timezone: true,
      student: { select: { id: true, sectionId: true } },
      teacher: { select: { id: true } },
      guardian: { select: { id: true } },
      staffMember: { select: { id: true } },
    },
  })
  const byEmail = new Map(demoUsers.map((u) => [u.email ?? "", u]))
  const demoStudent = byEmail.get(DEMO_EMAILS.student)
  const demoTeacher = byEmail.get(DEMO_EMAILS.teacher)
  const demoParent = byEmail.get(DEMO_EMAILS.parent)
  const demoAdmin = byEmail.get(DEMO_EMAILS.admin)
  const demoStaff = byEmail.get(DEMO_EMAILS.staff)
  const demoAccountant = byEmail.get(DEMO_EMAILS.accountant)

  if (!demoStudent?.student || !demoTeacher?.teacher) {
    logWarning(
      "Profile activity: demo student/teacher accounts missing — skipping"
    )
    return
  }

  const touchedUserIds = new Set<string>()
  demoUsers.forEach((u) => touchedUserIds.add(u.id))

  // ==========================================================================
  // 1) Current-year attendance for the demo student's section
  // ==========================================================================
  let attendanceCreated = 0
  const sectionId = demoStudent.student.sectionId
  if (sectionId) {
    const roster = await prisma.student.findMany({
      where: { schoolId, sectionId },
      select: { id: true, userId: true },
    })
    const rosterIds = roster.map((s) => s.id)
    const days = schoolDaysOfYearToDate()
    const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))

    // Dedup: skip any (student, date) that already has a row this year.
    const existing = await prisma.attendance.findMany({
      where: {
        schoolId,
        studentId: { in: rosterIds },
        date: { gte: yearStart },
      },
      select: { studentId: true, date: true },
    })
    const taken = new Set(
      existing.map((e) => `${e.studentId}:${dateKey(e.date)}`)
    )

    const periods = await prisma.period.findMany({
      where: { schoolId, isBreak: false },
      orderBy: { startTime: "asc" },
      take: 5,
      select: { id: true, name: true },
    })

    type Row = {
      schoolId: string
      studentId: string
      sectionId: string
      classId: null
      date: Date
      status: "PRESENT" | "LATE" | "ABSENT"
      checkInTime: Date | null
      markedBy: string
      markedAt: Date
      method: "MANUAL"
      periodId: string | null
      periodName: string | null
    }
    const rows: Row[] = []

    for (const day of days) {
      const key = dateKey(day)
      // Period-detail texture: a couple of days per week get per-period rows
      // for the demo student + two classmates (varies graph intensity).
      const periodDay = periods.length > 0 && rand() < 0.3
      const textureIds = new Set([
        demoStudent.student.id,
        ...rosterIds.filter((id) => id !== demoStudent.student!.id).slice(0, 2),
      ])

      for (const student of roster) {
        if (taken.has(`${student.id}:${key}`)) continue
        const isDemo = student.id === demoStudent.student.id
        // Demo student: never absent (perfect_attendance); others realistic.
        const roll = rand()
        const status: Row["status"] = isDemo
          ? roll < 0.06
            ? "LATE"
            : "PRESENT"
          : roll < 0.04
            ? "ABSENT"
            : roll < 0.1
              ? "LATE"
              : "PRESENT"

        const markedAt = new Date(day)
        markedAt.setUTCHours(5, randInt(0, 25), 0, 0) // ~08:00 Khartoum
        const checkInTime =
          status === "ABSENT"
            ? null
            : (() => {
                const t = new Date(day)
                t.setUTCHours(
                  status === "LATE" ? 5 : 4,
                  status === "LATE" ? randInt(15, 45) : randInt(20, 50),
                  0,
                  0
                )
                return t
              })()

        if (periodDay && textureIds.has(student.id) && status !== "ABSENT") {
          const nPeriods = randInt(3, Math.min(5, periods.length))
          for (let p = 0; p < nPeriods; p++) {
            const period = periods[p]
            const pMarked = new Date(day)
            pMarked.setUTCHours(5 + p, randInt(0, 40), 0, 0)
            rows.push({
              schoolId,
              studentId: student.id,
              sectionId,
              classId: null,
              date: day,
              status: p === 0 ? status : "PRESENT",
              checkInTime,
              markedBy: demoTeacher.teacher.id,
              markedAt: pMarked,
              method: "MANUAL",
              periodId: period.id,
              periodName: period.name,
            })
          }
        } else {
          rows.push({
            schoolId,
            studentId: student.id,
            sectionId,
            classId: null,
            date: day,
            status,
            checkInTime,
            markedBy: demoTeacher.teacher.id,
            markedAt,
            method: "MANUAL",
            periodId: null,
            periodName: null,
          })
        }
      }
    }

    const BATCH = 1000
    for (let i = 0; i < rows.length; i += BATCH) {
      await prisma.attendance.createMany({
        data: rows.slice(i, i + BATCH),
        skipDuplicates: true,
      })
    }
    attendanceCreated = rows.length
    roster.forEach((s) => s.userId && touchedUserIds.add(s.userId))
  }

  // ==========================================================================
  // 2) UserActivity feed
  // ==========================================================================
  // Users to animate: demo accounts + section roster users + a slice of
  // teachers/guardians so browsing profiles from listings feels alive.
  const feedUsers = await prisma.user.findMany({
    where: {
      schoolId,
      OR: [
        { email: { in: Object.values(DEMO_EMAILS) } },
        { student: { sectionId: sectionId ?? undefined } },
        { role: "TEACHER" },
        { role: "GUARDIAN" },
      ],
    },
    select: {
      id: true,
      email: true,
      role: true,
      student: {
        select: {
          id: true,
          studentClasses: {
            take: 6,
            select: {
              class: { select: { subject: { select: { name: true } } } },
            },
          },
        },
      },
      teacher: {
        select: {
          id: true,
          classes: {
            take: 6,
            select: {
              name: true,
              subject: { select: { name: true } },
            },
          },
        },
      },
      guardian: {
        select: {
          id: true,
          studentGuardians: {
            take: 3,
            select: {
              student: { select: { firstName: true } },
            },
          },
        },
      },
    },
    take: 160,
  })

  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000
  let activitiesCreated = 0

  for (const user of feedUsers) {
    const isDemo = Object.values(DEMO_EMAILS).includes(
      (user.email ?? "") as (typeof DEMO_EMAILS)[keyof typeof DEMO_EMAILS]
    )

    const existingCount = await prisma.userActivity.count({
      where: { schoolId, userId: user.id },
    })
    if (existingCount >= 5) continue

    const subjects =
      user.student?.studentClasses
        .map((sc) => sc.class?.subject?.name)
        .filter((n): n is string => !!n) ?? []
    const classes = user.teacher?.classes ?? []
    const childNames =
      user.guardian?.studentGuardians
        .map((sg) => sg.student?.firstName)
        .filter((n): n is string => !!n) ?? []

    type Tpl = { type: UserActivityType; title: string; description?: string }
    const templates: Tpl[] = []
    if (user.role === "STUDENT" && subjects.length) {
      templates.push(
        ...subjects.slice(0, 4).flatMap((s): Tpl[] => [
          { type: "ASSIGNMENT_SUBMITTED", title: `سلّم واجب ${s}` },
          { type: "EXAM_COMPLETED", title: `أكمل اختبار ${s}` },
          {
            type: "GRADE_RECEIVED",
            title: `حصل على تقدير ممتاز في ${s}`,
          },
        ]),
        { type: "LIBRARY_CHECKOUT", title: "استعار كتاباً من المكتبة" },
        { type: "EVENT_ATTENDED", title: "شارك في النشاط المدرسي" }
      )
    } else if (user.role === "TEACHER") {
      const classNames = classes.map((c) => c.name).filter(Boolean)
      const subjNames = classes
        .map((c) => c.subject?.name)
        .filter((n): n is string => !!n)
      templates.push(
        ...classNames.slice(0, 3).map(
          (c): Tpl => ({
            type: "ATTENDANCE_MARKED",
            title: `رصد حضور ${c}`,
          })
        ),
        ...subjNames.slice(0, 3).flatMap((s): Tpl[] => [
          { type: "GRADE_RECEIVED", title: `رصد درجات ${s}` },
          { type: "ASSIGNMENT_SUBMITTED", title: `أنشأ واجباً جديداً في ${s}` },
        ]),
        { type: "EVENT_ATTENDED", title: "حضر الاجتماع الأسبوعي للمعلمين" }
      )
    } else if (user.role === "GUARDIAN") {
      templates.push(
        { type: "EVENT_ATTENDED", title: "حضر اجتماع أولياء الأمور" },
        ...childNames.slice(0, 2).flatMap((c): Tpl[] => [
          { type: "OTHER", title: `تواصل مع معلم ${c}` },
          { type: "OTHER", title: `اطلع على تقرير ${c} الدراسي` },
        ])
      )
    } else {
      // ADMIN / STAFF / ACCOUNTANT
      templates.push(
        { type: "OTHER", title: "اعتمد مصروفات تشغيلية" },
        { type: "OTHER", title: "راجع طلبات الالتحاق الجديدة" },
        { type: "EVENT_ATTENDED", title: "نظّم فعالية مدرسية" },
        { type: "PROFILE_UPDATED", title: "حدّث بيانات الملف الشخصي" }
      )
    }
    if (!templates.length) continue

    const count = isDemo ? randInt(26, 38) : randInt(5, 14)
    const rows = Array.from({ length: count }, () => {
      const tpl = pick(templates)
      const daysAgo = randInt(0, 150)
      const createdAt = new Date(now - daysAgo * DAY - randInt(0, 10) * 3600000)
      return {
        schoolId,
        userId: user.id,
        activityType: tpl.type,
        title: tpl.title,
        description: tpl.description,
        createdAt,
      }
    })
    await prisma.userActivity.createMany({ data: rows })
    activitiesCreated += rows.length
    touchedUserIds.add(user.id)
  }

  // ==========================================================================
  // 3) Pinned items (role-appropriate, from real rows)
  // ==========================================================================
  let pinsCreated = 0
  const upsertPin = async (
    userId: string,
    itemType:
      | "SUBJECT"
      | "CLASS"
      | "CHILD"
      | "ACHIEVEMENT"
      | "DEPARTMENT"
      | "PROJECT"
      | "TASK",
    itemId: string,
    title: string,
    description: string | null,
    order: number,
    stats?: Array<{ label: string; value: string | number }>
  ) => {
    await prisma.pinnedItem.upsert({
      where: {
        schoolId_userId_itemType_itemId: {
          schoolId,
          userId,
          itemType,
          itemId,
        },
      },
      create: {
        schoolId,
        userId,
        itemType,
        itemId,
        title,
        description,
        metadata: stats ? { stats } : undefined,
        isPublic: true,
        order,
      },
      update: { title, description, order },
    })
    pinsCreated++
  }

  // Student: top subjects + an achievement
  const studentUser = feedUsers.find((u) => u.email === DEMO_EMAILS.student)
  if (studentUser?.student) {
    const subjectRows = await prisma.studentClass.findMany({
      where: { schoolId, studentId: studentUser.student.id },
      take: 2,
      select: {
        class: {
          select: { subject: { select: { id: true, name: true } } },
        },
      },
    })
    let order = 0
    for (const r of subjectRows) {
      const s = r.class?.subject
      if (!s) continue
      await upsertPin(
        studentUser.id,
        "SUBJECT",
        s.id,
        s.name,
        "مادة الفصل الدراسي الحالي",
        order++,
        [
          { label: "الواجبات", value: randInt(8, 14) },
          { label: "الحضور", value: "٩٦٪" },
        ]
      )
    }
  }

  // Teacher: their classes + department
  if (demoTeacher.teacher) {
    const teacherClasses = await prisma.class.findMany({
      where: { schoolId, teacherId: demoTeacher.teacher.id },
      take: 2,
      select: {
        id: true,
        name: true,
        subject: { select: { name: true } },
        _count: { select: { studentClasses: true } },
      },
    })
    let order = 0
    for (const c of teacherClasses) {
      await upsertPin(
        demoTeacher.id,
        "CLASS",
        c.id,
        c.name,
        c.subject?.name ?? null,
        order++,
        [{ label: "الطلاب", value: c._count.studentClasses }]
      )
    }
  }

  // Parent: children
  if (demoParent?.guardian) {
    const children = await prisma.studentGuardian.findMany({
      where: { schoolId, guardianId: demoParent.guardian.id },
      take: 2,
      select: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            section: { select: { name: true } },
          },
        },
      },
    })
    let order = 0
    for (const c of children) {
      if (!c.student) continue
      await upsertPin(
        demoParent.id,
        "CHILD",
        c.student.id,
        `${c.student.firstName ?? ""} ${c.student.lastName ?? ""}`.trim(),
        c.student.section?.name ?? null,
        order++
      )
    }
  }

  // Admin / staff / accountant: organizations + standing tasks
  const orgs = await prisma.organization.findMany({
    where: { schoolId },
    take: 4,
    select: { id: true, name: true, description: true },
  })
  const councilOrg = orgs.find((o) => o.name.includes("مجلس")) ?? orgs[0]
  if (demoAdmin && councilOrg) {
    await upsertPin(
      demoAdmin.id,
      "PROJECT",
      councilOrg.id,
      councilOrg.name,
      councilOrg.description,
      0
    )
    await upsertPin(
      demoAdmin.id,
      "TASK",
      "admissions-review",
      "مراجعة طلبات الالتحاق",
      "متابعة أسبوعية لطلبات التسجيل الجديدة",
      1,
      [{ label: "قيد المراجعة", value: randInt(4, 12) }]
    )
  }
  if (demoStaff && councilOrg) {
    await upsertPin(
      demoStaff.id,
      "TASK",
      "events-coordination",
      "تنسيق الفعاليات المدرسية",
      "الأنشطة والرحلات والاجتماعات",
      0,
      [{ label: "فعاليات هذا الفصل", value: randInt(3, 8) }]
    )
  }
  if (demoAccountant) {
    await upsertPin(
      demoAccountant.id,
      "TASK",
      "payroll-run",
      "مسير الرواتب الشهري",
      "إعداد واعتماد رواتب الموظفين",
      0,
      [{ label: "موظف", value: randInt(30, 60) }]
    )
  }

  // ==========================================================================
  // 4) Parent ↔ teacher conversation (lights the parent graph)
  // ==========================================================================
  let messagesCreated = 0
  if (demoParent && demoTeacher) {
    const sentByParent = await prisma.message.count({
      where: { senderId: demoParent.id },
    })
    if (sentByParent < 10) {
      let conversation = await prisma.conversation.findFirst({
        where: {
          schoolId,
          type: "direct",
          OR: [
            {
              directParticipant1Id: demoParent.id,
              directParticipant2Id: demoTeacher.id,
            },
            {
              directParticipant1Id: demoTeacher.id,
              directParticipant2Id: demoParent.id,
            },
          ],
        },
        select: { id: true },
      })
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            schoolId,
            type: "direct",
            createdById: demoParent.id,
            directParticipant1Id: demoParent.id,
            directParticipant2Id: demoTeacher.id,
          },
          select: { id: true },
        })
      }
      for (const uid of [demoParent.id, demoTeacher.id]) {
        await prisma.conversationParticipant.upsert({
          where: {
            conversationId_userId: {
              conversationId: conversation.id,
              userId: uid,
            },
          },
          create: { conversationId: conversation.id, userId: uid },
          update: {},
        })
      }

      const parentLines = [
        "السلام عليكم أستاذ، كيف مستوى ابني هذا الأسبوع؟",
        "هل هناك واجبات متأخرة عليه؟",
        "شكراً جزيلاً على المتابعة المستمرة",
        "متى موعد اختبار الرياضيات القادم؟",
        "سيتغيب ابني غداً لظرف صحي، أعتذر منكم",
        "هل تحسّن أداؤه في المشاركة الصفية؟",
        "أرجو تزويدي بنتيجة الاختبار الأخير",
      ]
      const teacherLines = [
        "وعليكم السلام، مستواه ممتاز والحمد لله",
        "لا توجد واجبات متأخرة، ملتزم بالتسليم",
        "العفو، هذا واجبنا",
        "الاختبار يوم الثلاثاء القادم بإذن الله",
        "سلامته، سنراعي ذلك",
      ]

      const yearStartMs = Date.UTC(new Date().getUTCFullYear(), 0, 4)
      const spanMs = Math.max(now - yearStartMs, DAY)
      const msgs: Array<{
        conversationId: string
        senderId: string
        content: string
        status: "read"
        createdAt: Date
      }> = []
      for (let i = 0; i < 22; i++) {
        const fromParent = i % 3 !== 2 // ~2/3 from the parent
        const at = new Date(yearStartMs + Math.floor(rand() * spanMs))
        // keep messages on school days
        if (at.getUTCDay() === 5 || at.getUTCDay() === 6) continue
        msgs.push({
          conversationId: conversation.id,
          senderId: fromParent ? demoParent.id : demoTeacher.id,
          content: fromParent ? pick(parentLines) : pick(teacherLines),
          status: "read",
          createdAt: at,
        })
      }
      await prisma.message.createMany({ data: msgs })
      messagesCreated = msgs.length
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      })
    }
  }

  // ==========================================================================
  // 5) Spread expense approvals across admin/staff/accountant (staff graph)
  // ==========================================================================
  let approvalsSpread = 0
  const approvers = [demoAdmin, demoStaff, demoAccountant].filter(
    (u): u is NonNullable<typeof u> => !!u
  )
  if (approvers.length) {
    const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))
    const alreadySpread = await prisma.expense.count({
      where: {
        schoolId,
        approvedBy: { in: approvers.map((a) => a.id) },
        approvedAt: { gte: yearStart },
      },
    })
    if (alreadySpread < 20) {
      const candidates = await prisma.expense.findMany({
        where: { schoolId, approvedBy: { not: null } },
        select: { id: true },
        take: 120,
      })
      const days = schoolDaysOfYearToDate()
      for (let i = 0; i < candidates.length; i++) {
        const approver = approvers[i % approvers.length]
        const day = days.length ? pick(days) : new Date()
        const approvedAt = new Date(day)
        approvedAt.setUTCHours(randInt(6, 13), randInt(0, 59), 0, 0)
        await prisma.expense.update({
          where: { id: candidates[i].id },
          data: { approvedBy: approver.id, approvedAt },
        })
        approvalsSpread++
      }
    }
  }

  // ==========================================================================
  // 6) Demo-student achievements (varied categories → varied badge art)
  // ==========================================================================
  const wantAchievements: Array<{
    title: string
    description: string
    category: string
    level: string
    position: string
    monthsAgo: number
  }> = [
    {
      title: "المركز الأول في مسابقة الرياضيات",
      description: "المركز الأول على مستوى المحلية في أولمبياد الرياضيات",
      category: "Academic",
      level: "District",
      position: "1st Place",
      monthsAgo: 2,
    },
    {
      title: "أفضل لاعب في بطولة المدرسة",
      description: "جائزة أفضل لاعب في بطولة كرة القدم المدرسية",
      category: "Sports",
      level: "School",
      position: "Winner",
      monthsAgo: 4,
    },
    {
      title: "جائزة القيادة الطلابية",
      description: "تقديراً لدوره في مجلس الطلاب والأنشطة المدرسية",
      category: "Leadership",
      level: "School",
      position: "Winner",
      monthsAgo: 1,
    },
  ]
  let achievementsCreated = 0
  // Normalize legacy English-titled achievements on the demo student so the
  // ar-default profile isn't mixed-language (badge titles derive from these).
  const legacyTitleMap: Record<string, { title: string; description: string }> =
    {
      "Swimming Championship": {
        title: "بطولة السباحة المدرسية",
        description: "أداء استثنائي في البطولات بين المدارس",
      },
      "Science Fair Winner": {
        title: "الفائز بمعرض العلوم",
        description: "المشروع الفائز في معرض العلوم المدرسي",
      },
      "Math Olympiad": {
        title: "أولمبياد الرياضيات",
        description: "تمثيل المدرسة في أولمبياد الرياضيات",
      },
    }
  for (const [en, ar] of Object.entries(legacyTitleMap)) {
    await prisma.achievement.updateMany({
      where: { schoolId, studentId: demoStudent.student.id, title: en },
      data: { title: ar.title, description: ar.description },
    })
  }
  for (const a of wantAchievements) {
    const exists = await prisma.achievement.findFirst({
      where: {
        schoolId,
        studentId: demoStudent.student.id,
        title: a.title,
      },
      select: { id: true },
    })
    if (exists) continue
    const when = new Date()
    when.setUTCMonth(when.getUTCMonth() - a.monthsAgo)
    await prisma.achievement.create({
      data: {
        schoolId,
        studentId: demoStudent.student.id,
        title: a.title,
        description: a.description,
        achievementDate: when,
        category: a.category,
        level: a.level,
        position: a.position,
        issuedBy: "إدارة المدرسة",
      },
    })
    achievementsCreated++
  }

  // ==========================================================================
  // 7) Demo User fields — bio language normalization + GitHub-style fields
  // ==========================================================================
  let biosNormalized = 0
  for (const b of BIO_NORMALIZATION) {
    const { count } = await prisma.user.updateMany({
      where: { email: b.email, bio: b.from },
      data: { bio: b.to },
    })
    biosNormalized += count
  }
  const fieldSets: Array<{
    user: (typeof demoUsers)[number] | undefined
    statusEmoji: string
    statusMessage: string
    website?: string
    socialLinks?: Record<string, string>
  }> = [
    {
      user: demoTeacher,
      statusEmoji: "📚",
      statusMessage: "أستعد لاختبارات نهاية الفصل",
      website: "https://ed.databayt.org",
      socialLinks: { twitter: "https://x.com/databayt" },
    },
    {
      user: demoStudent,
      statusEmoji: "🎯",
      statusMessage: "التركيز على الاختبارات النهائية",
    },
    {
      user: demoParent,
      statusEmoji: "👨‍👩‍👦",
      statusMessage: "متابعة مستمرة لأبنائي",
    },
    {
      user: demoAdmin,
      statusEmoji: "🏫",
      statusMessage: "خدمة الطلاب أولاً",
      website: "https://ed.databayt.org",
      socialLinks: {
        twitter: "https://x.com/databayt",
        linkedin: "https://linkedin.com/company/databayt",
      },
    },
    {
      user: demoStaff,
      statusEmoji: "🗂️",
      statusMessage: "تنسيق فعاليات هذا الفصل",
    },
    {
      user: demoAccountant,
      statusEmoji: "🧾",
      statusMessage: "إقفال الحسابات الشهرية",
    },
  ]
  for (const f of fieldSets) {
    if (!f.user) continue
    await prisma.user.update({
      where: { id: f.user.id },
      data: {
        statusEmoji: f.user.statusEmoji ?? f.statusEmoji,
        statusMessage: f.user.statusEmoji ? undefined : f.statusMessage,
        website: f.user.website ?? f.website,
        socialLinks:
          f.user.socialLinks == null && f.socialLinks
            ? f.socialLinks
            : undefined,
        timezone: f.user.timezone ?? "Africa/Khartoum",
      },
    })
  }

  // ==========================================================================
  // 8) Recompute badges for touched users
  // ==========================================================================
  const roleOf = (r: string) =>
    r === "STUDENT"
      ? ("student" as const)
      : r === "TEACHER"
        ? ("teacher" as const)
        : r === "GUARDIAN"
          ? ("parent" as const)
          : ["STAFF", "ADMIN", "ACCOUNTANT"].includes(r)
            ? ("staff" as const)
            : null
  const usersToRecompute = await prisma.user.findMany({
    where: { id: { in: Array.from(touchedUserIds) }, schoolId },
    select: { id: true, role: true },
  })
  let badged = 0
  for (const u of usersToRecompute) {
    const role = roleOf(u.role)
    if (!role) continue
    const { awarded } = await recomputeProfileBadges(u.id, schoolId, role, "ar")
    if (awarded > 0) badged++
  }

  logSuccess(
    "Profile activity",
    attendanceCreated + activitiesCreated + pinsCreated + messagesCreated,
    `${attendanceCreated} attendance, ${activitiesCreated} feed rows, ${pinsCreated} pins, ${messagesCreated} messages, ${approvalsSpread} approvals spread, ${achievementsCreated} achievements, ${biosNormalized} bios normalized, ${badged} users badged`
  )
}
