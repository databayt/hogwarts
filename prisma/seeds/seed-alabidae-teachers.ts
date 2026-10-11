// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * الابداع (Alabidae) — the school's real teachers and what they teach.
 *
 * Source: the teacher/subject list the school sent on WhatsApp (2026-10-11).
 * Runs after seed-alabidae.ts (tenant, grades, sections, active term).
 *
 * Per teacher: a Teacher row, a TEACHER login (username = employee id, temp
 * password minted once, mustChangePassword — the bulk-import convention),
 * phone, subject expertise, and SubjectTeacher pairs for the active term
 * applied through the assignment pipeline so the timetable shows them.
 *
 * Reading the list:
 * - "Grade N" with no section → both sections (أ and ب). Two teachers named
 *   for the same grade+subject split the sections: grade-1 math (سارة أ,
 *   عفاف ب) and grade-3 science (نفيسة أ, ريم ب).
 * - Grade-1 "قرآن كريم" → التربية الإسلامية (the SD grade-1 subject).
 * - "تالت ثانوي" → grade 12. "إشراف الصف خامس" → homeroom of grade 5.
 * - افراح (KG supervisor) and مشاعر (no subjects given) get a Teacher row and
 *   login only — the tenant has no KG grades.
 * - سناء (administrative supervisor) is staff, not a teacher.
 * - سهام's message carried ريم's email; it is ريم's, so سهام has none.
 *   عائشة's "gmai.com" is read as gmail.com.
 *
 * Idempotent — re-runs update rows and never rotate a password already set.
 *
 * Usage:
 *   pnpm db:seed:alabidae:teachers          # apply
 *   pnpm db:seed:alabidae:teachers --dry    # resolve and print, no writes
 */

// MUST be first: @/lib/db reads process.env.DATABASE_URL at module scope.
import "dotenv/config"

import { mintTempPassword } from "@/lib/credentials"
import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { applyAssignmentsBatch } from "@/components/school-dashboard/timetable/assignments/apply"

const DOMAIN = "alabidae"
const DRY = process.argv.includes("--dry")
const JOINING_DATE = new Date("2026-09-01")

type Section = "أ" | "ب"

interface Teaching {
  grade: number
  /** Subject name as the grade's selection shows it (customName or catalog name). */
  subject: string
  /** Omitted = every section of the grade. */
  sections?: Section[]
}

interface TeacherSeed {
  employeeId: string
  name: string
  gender: "male" | "female" | null
  email: string | null
  phone: string | null
  teaches: Teaching[]
  homeroomGrades?: number[]
}

const AR = "اللغة العربية"
const EN = "اللغة الإنجليزية"
const ISL = "التربية الإسلامية"
const MATH = "الرياضيات"
const SCI = "العلوم"
const HIST = "التاريخ"
const GEO = "الجغرافيا"
const ICT = "تكنولوجيا المعلومات والاتصالات"

const TEACHERS: TeacherSeed[] = [
  {
    employeeId: "ABD-T-002",
    name: "عفاف فضل عثمان",
    gender: "female",
    email: null,
    phone: null,
    teaches: [
      { grade: 1, subject: EN },
      { grade: 2, subject: EN },
      { grade: 3, subject: EN },
      { grade: 6, subject: HIST },
      { grade: 1, subject: MATH, sections: ["ب"] },
    ],
  },
  {
    employeeId: "ABD-T-003",
    name: "ظفر احمد بخيت",
    gender: "male",
    email: null,
    phone: null,
    teaches: [
      { grade: 2, subject: AR },
      { grade: 2, subject: ISL },
      { grade: 2, subject: MATH },
      { grade: 3, subject: AR },
      { grade: 3, subject: ISL },
    ],
  },
  {
    employeeId: "ABD-T-004",
    name: "عائشة صديق",
    gender: "female",
    email: "aishasedig123@gmail.com",
    phone: "+17712138772",
    teaches: [
      { grade: 6, subject: ISL },
      { grade: 6, subject: "تكنولوجيا المعلومات" },
      { grade: 5, subject: HIST },
    ],
  },
  {
    employeeId: "ABD-T-005",
    name: "مشاعر جمال الدين عبيدالله عمر",
    gender: "female",
    email: "msharj525@gmail.com",
    phone: "0915615282",
    teaches: [],
  },
  {
    employeeId: "ABD-T-006",
    name: "سارة أحمد ابراهيم",
    gender: "female",
    email: null,
    phone: null,
    teaches: [
      { grade: 1, subject: AR },
      { grade: 1, subject: ISL },
      { grade: 1, subject: MATH, sections: ["أ"] },
    ],
  },
  {
    employeeId: "ABD-T-007",
    name: "افراح فاروق محمد سعيد",
    gender: "female",
    email: "afrahfaroug12@gmail.com",
    phone: "0967478555",
    teaches: [],
  },
  {
    employeeId: "ABD-T-008",
    name: "نفيسة يعقوب محمد الامير",
    gender: "female",
    email: "umjoudy15115@gmail.com",
    phone: "0911891390",
    teaches: [
      { grade: 3, subject: SCI, sections: ["أ"] },
      { grade: 4, subject: SCI },
      { grade: 5, subject: "العلوم الطبيعية" },
      { grade: 5, subject: GEO },
    ],
  },
  {
    employeeId: "ABD-T-009",
    name: "سهام عبدالوهاب",
    gender: "female",
    email: null,
    phone: "0100594178",
    teaches: [
      { grade: 5, subject: AR },
      { grade: 6, subject: AR },
    ],
  },
  {
    employeeId: "ABD-T-010",
    name: "ريم الهادي",
    gender: "female",
    email: "alhadireem025@gmail.com",
    phone: "0905906087",
    teaches: [
      { grade: 3, subject: SCI, sections: ["ب"] },
      { grade: 4, subject: ISL },
      { grade: 12, subject: "الفنون والتصميم" },
    ],
    homeroomGrades: [5],
  },
  {
    employeeId: "ABD-T-011",
    name: "دلال بدر الدين كامل محمد",
    gender: "female",
    email: "elkhangyd@gmail.com",
    phone: "0902059257",
    teaches: [
      { grade: 4, subject: EN },
      { grade: 5, subject: EN },
    ],
  },
  {
    employeeId: "ABD-T-012",
    name: "احسان محمد الدرديري",
    gender: null,
    email: "ehsanmohammed778@gmail.com",
    phone: "0918838046",
    teaches: [
      { grade: 6, subject: MATH },
      { grade: 5, subject: ICT },
      { grade: 4, subject: ICT },
    ],
  },
  {
    employeeId: "ABD-T-013",
    name: "الهام اسماعيل عبدالله",
    gender: "female",
    email: "alhamasmaylbdqllh7@gmail.com",
    phone: "0915373946",
    teaches: [
      { grade: 4, subject: AR },
      { grade: 6, subject: GEO },
    ],
  },
]

const STAFF = {
  employeeId: "ABD-S-004",
  name: "سناء عمر الطيب",
  gender: "female",
  email: "sonaomer12@gmail.com",
  phone: "+249916194731",
  position: "مشرفة إدارية — المرحلة الابتدائية",
}

const splitName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/)
  return { firstName: first, lastName: rest.join(" ") }
}

interface Credential {
  name: string
  username: string
  email: string | null
  password: string | null // null = already set on an earlier run
}

/**
 * Login keyed by username (= employee id, lowercased). Email-matched rows are
 * adopted so a teacher who already signed up is linked, not duplicated.
 */
async function upsertLogin(
  schoolId: string,
  username: string,
  email: string | null,
  role: "TEACHER" | "STAFF"
): Promise<{ id: string; password: string | null }> {
  const existing = await db.user.findFirst({
    where: {
      schoolId,
      OR: [{ username }, ...(email ? [{ email }] : [])],
    },
    select: { id: true },
  })
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { username, role, ...(email ? { email } : {}) },
    })
    return { id: existing.id, password: null }
  }
  const { plain, hashed } = await mintTempPassword()
  const user = await db.user.create({
    data: {
      schoolId,
      username,
      email,
      role,
      password: hashed,
      emailVerified: new Date(),
      mustChangePassword: true,
    },
    select: { id: true },
  })
  return { id: user.id, password: plain }
}

async function main() {
  const school = await db.school.findFirst({
    where: { domain: DOMAIN },
    select: { id: true, name: true },
  })
  if (!school) throw new Error(`No school "${DOMAIN}" — run seed-alabidae.ts`)
  const schoolId = school.id
  const { term } = await resolveActiveTerm(schoolId)
  if (!term) throw new Error("No active term")

  const [sections, selections] = await Promise.all([
    db.section.findMany({
      where: { schoolId },
      select: {
        id: true,
        letter: true,
        name: true,
        grade: { select: { gradeNumber: true } },
      },
    }),
    db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: {
        customName: true,
        catalogSubjectId: true,
        grade: { select: { gradeNumber: true } },
        subject: { select: { name: true } },
      },
    }),
  ])

  const sectionsOf = (grade: number, only?: Section[]) =>
    sections.filter(
      (s) =>
        s.grade.gradeNumber === grade &&
        (!only || only.some((l) => s.letter === l || s.name.endsWith(l)))
    )
  const subjectOf = (grade: number, name: string) =>
    selections.find(
      (s) =>
        s.grade.gradeNumber === grade &&
        (s.customName ?? s.subject.name) === name
    )?.catalogSubjectId

  // Resolve everything before writing — a typo in the list fails the run whole.
  const plan = TEACHERS.map((t) => ({
    ...t,
    resolved: t.teaches.map((x) => {
      const subjectId = subjectOf(x.grade, x.subject)
      const secs = sectionsOf(x.grade, x.sections)
      if (!subjectId)
        throw new Error(`${t.name}: no "${x.subject}" in grade ${x.grade}`)
      if (secs.length === 0)
        throw new Error(`${t.name}: no sections in grade ${x.grade}`)
      return {
        ...x,
        subjectId,
        sectionIds: secs.map((s) => s.id),
        sectionNames: secs.map((s) => s.name),
      }
    }),
  }))

  console.log(`🏫 ${school.name} · term ${term.id}${DRY ? " · DRY RUN" : ""}`)
  for (const t of plan) {
    console.log(`\n${t.employeeId} ${t.name}`)
    for (const r of t.resolved)
      console.log(`   ${r.subject} → ${r.sectionNames.join("، ")}`)
    if (t.homeroomGrades)
      console.log(`   رائدة الصف ${t.homeroomGrades.join("، ")}`)
  }
  console.log(`\n${STAFF.employeeId} ${STAFF.name} — ${STAFF.position}`)
  if (DRY) return

  const credentials: Credential[] = []
  const requests: Array<{
    teacherId: string
    subjectId: string
    sectionIds: string[]
  }> = []

  for (const t of plan) {
    const username = t.employeeId.toLowerCase()
    const login = await upsertLogin(schoolId, username, t.email, "TEACHER")
    credentials.push({
      name: t.name,
      username,
      email: t.email,
      password: login.password,
    })

    const { firstName, lastName } = splitName(t.name)
    const data = {
      userId: login.id,
      firstName,
      lastName,
      gender: t.gender,
      emailAddress: t.email,
      lang: "ar",
      nationality: "SD",
      city: "الخرطوم",
      state: "الخرطوم",
      country: "SD",
    }
    const found = await db.teacher.findFirst({
      where: {
        schoolId,
        OR: [{ employeeId: t.employeeId }, { userId: login.id }],
      },
      select: { id: true },
    })
    const teacher = found
      ? await db.teacher.update({
          where: { id: found.id },
          data,
          select: { id: true },
        })
      : await db.teacher.create({
          data: {
            ...data,
            schoolId,
            employeeId: t.employeeId,
            joiningDate: JOINING_DATE,
          },
          select: { id: true },
        })

    if (t.phone) {
      await db.teacherPhoneNumber.upsert({
        where: {
          schoolId_teacherId_phoneNumber: {
            schoolId,
            teacherId: teacher.id,
            phoneNumber: t.phone,
          },
        },
        update: {},
        create: {
          schoolId,
          teacherId: teacher.id,
          phoneNumber: t.phone,
          isPrimary: true,
        },
      })
    }

    for (const subjectId of new Set(t.resolved.map((r) => r.subjectId))) {
      await db.teacherSubjectExpertise.upsert({
        where: {
          schoolId_teacherId_subjectId: {
            schoolId,
            teacherId: teacher.id,
            subjectId,
          },
        },
        update: {},
        create: {
          schoolId,
          teacherId: teacher.id,
          subjectId,
          expertiseLevel: "PRIMARY",
        },
      })
    }

    for (const r of t.resolved) {
      requests.push({
        teacherId: teacher.id,
        subjectId: r.subjectId,
        sectionIds: r.sectionIds,
      })
    }

    for (const grade of t.homeroomGrades ?? []) {
      await db.section.updateMany({
        where: { schoolId, id: { in: sectionsOf(grade).map((s) => s.id) } },
        data: { homeroomTeacherId: teacher.id },
      })
    }
    console.log(`  ✅ ${t.employeeId} ${t.name}`)
  }

  // Staff member (no teaching load).
  const staffUsername = STAFF.employeeId.toLowerCase()
  const staffLogin = await upsertLogin(
    schoolId,
    staffUsername,
    STAFF.email,
    "STAFF"
  )
  credentials.push({
    name: STAFF.name,
    username: staffUsername,
    email: STAFF.email,
    password: staffLogin.password,
  })
  const staffName = splitName(STAFF.name)
  await db.staffMember.upsert({
    where: { schoolId_emailAddress: { schoolId, emailAddress: STAFF.email } },
    update: { position: STAFF.position, userId: staffLogin.id },
    create: {
      schoolId,
      userId: staffLogin.id,
      employeeId: STAFF.employeeId,
      ...staffName,
      emailAddress: STAFF.email,
      position: STAFF.position,
      gender: STAFF.gender,
      joiningDate: JOINING_DATE,
      city: "الخرطوم",
      state: "الخرطوم",
      country: "SD",
    },
  })
  console.log(`  ✅ ${STAFF.employeeId} ${STAFF.name}`)

  // Assignments through the same pipeline the board uses: upserts the pairs
  // (the school's list wins over earlier test rows) and puts each teacher on
  // the pair's timetable periods. Chunked to stay under the transaction limit.
  let assigned = 0
  let moved = 0
  let residual = 0
  for (let i = 0; i < requests.length; i += 10) {
    const { outcomes, skipped } = await applyAssignmentsBatch(
      { schoolId, termId: term.id, requests: requests.slice(i, i + 10) },
      db
    )
    if (skipped) console.warn(`  ⚠️  ${skipped} request(s) skipped`)
    for (const o of outcomes) {
      assigned += o.assigned
      moved += o.moved
      residual += o.residual.length
    }
  }
  console.log(
    `\n📅 ${requests.length} assignments · periods assigned ${assigned} · moved ${moved} · residual ${residual}`
  )

  console.log("\n🔑 Logins (temp passwords — must change on first sign-in)")
  for (const c of credentials) {
    console.log(
      `  ${c.username.padEnd(10)} ${(c.password ?? "(unchanged)").padEnd(14)} ${c.email ?? "—"}  ${c.name}`
    )
  }
}

main()
  .catch((error) => {
    console.error("❌ Failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
