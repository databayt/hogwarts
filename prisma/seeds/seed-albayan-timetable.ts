// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Albayan Timetable Seed (representative subset)
 * ------------------------------------------------------------------
 * WHY: albayan.databayt.org/en/timetable renders an empty grid because the
 * tenant was seeded with scaffolding (terms, periods, classrooms, grades,
 * 240 subject selections) but ZERO operational units — no sections, classes,
 * teacher-subject expertise, or timetable slots. The page works; it has
 * nothing to show.
 *
 * WHAT: seeds a realistic, teacher-assigned schedule for THREE representative
 * grades (1, 5, 10) so the per-classroom grid fills up for a demo:
 *   Phase A — ~12 teachers (Sudanese names) + TeacherSubjectExpertise
 *   Phase C — 2 sections + homeroom classrooms per target grade (6 sections)
 *   Phase B — ~30 students distributed across the new sections
 *   Phase D — lay out each section's week with a balanced interleave
 *             (subjects spread across days, not clustered) + assign teachers
 *
 * Phase D deliberately does NOT call the shared generateSectionTimetable
 * algorithm: that fills each subject's weekly hours consecutively within a
 * single day (algorithm.ts:352-356), producing robotic whole-day blocks
 * (5× English on Monday). Since every section here owns its homeroom, the only
 * real constraint is teacher double-booking — handled by a global busy-set —
 * so a simple interleaving distributor yields a far more realistic grid.
 *
 * SAFETY: additive + idempotent. All seeded rows carry markers so teardown is
 * a targeted delete (no Neon branch is available — project at branch limit):
 *   - teachers:  emailAddress LIKE 'tt.teacher%@albayan.edu', employeeId 'TT-T-%'
 *   - students:  studentId    LIKE 'TTS-%'
 *   - sections:  letter A/B for grades 1/5/10; homerooms 'Grade {1,5,10}-{A,B}'
 *   - slots:     scoped to the 6 seeded sectionIds
 *
 * TEARDOWN (raw SQL against the same DB):
 *   DELETE FROM timetables WHERE "schoolId"='cmpwoul5p00008ojdlmx75d4h'
 *     AND "sectionId" IN (SELECT id FROM sections WHERE "schoolId"='cmpwoul5p00008ojdlmx75d4h' AND letter IN ('A','B') AND "gradeId" IN ('cmq0t3cve00078oeuq1br1sf4','cmq0t3do9000f8oeur2x9khnr','cmq0t3ej9000p8oeufyqwikfg'));
 *   DELETE FROM teacher_subject_expertise WHERE "schoolId"='...' AND "teacherId" IN (SELECT id FROM teachers WHERE "emailAddress" LIKE 'tt.teacher%@albayan.edu');
 *   DELETE FROM students WHERE "schoolId"='...' AND "studentId" LIKE 'TTS-%';
 *   DELETE FROM teachers WHERE "schoolId"='...' AND "emailAddress" LIKE 'tt.teacher%@albayan.edu';
 *   DELETE FROM sections WHERE "schoolId"='...' AND name IN ('Grade 1-A','Grade 1-B','Grade 5-A','Grade 5-B','Grade 10-A','Grade 10-B');
 *
 * RUN: npx tsx prisma/seeds/seed-albayan-timetable.ts
 * (dotenv MUST load before @/lib/db — db.ts reads DATABASE_URL at module scope)
 */

import "dotenv/config"

import { db } from "@/lib/db"

// ============================================================================
// Configuration
// ============================================================================

const SCHOOL_ID = "cmpwoul5p00008ojdlmx75d4h" // albayan (verified, us-standard)

// Representative subset — three grades that already have active subjects.
const TARGET_GRADES = [
  { id: "cmq0t3cve00078oeuq1br1sf4", gradeNumber: 1 },
  { id: "cmq0t3do9000f8oeur2x9khnr", gradeNumber: 5 },
  { id: "cmq0t3ej9000p8oeufyqwikfg", gradeNumber: 10 },
] as const

const SECTION_LETTERS = ["A", "B"] as const
const STUDENTS_PER_SECTION = 5
const NUM_TEACHERS = 12
const TEACHERS_PER_SUBJECT = 3
const MAX_PERIODS_PER_WEEK = 25

// Authentic Sudanese Arabic name pools (deterministic index-based selection).
const MALE_GIVEN = [
  "أحمد",
  "محمد",
  "عثمان",
  "الطيب",
  "مصعب",
  "إبراهيم",
  "عبد الرحمن",
  "يوسف",
  "الصادق",
  "معاوية",
  "بكري",
  "حسن",
]
const FEMALE_GIVEN = [
  "فاطمة",
  "عائشة",
  "زينب",
  "إسراء",
  "رؤى",
  "أسماء",
  "هند",
  "سلمى",
  "نهى",
  "تسنيم",
]
const SURNAMES = [
  "عبد الله",
  "حسن",
  "الأمين",
  "إدريس",
  "النور",
  "بشير",
  "ميرغني",
  "التجاني",
  "عبد الرحمن",
  "الفكي",
  "حمد",
  "الفاضل",
]

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(
    "🌱 Albayan timetable seed — representative subset (grades 1, 5, 10)\n"
  )

  const gradeIds = TARGET_GRADES.map((g) => g.id)

  // --- Pre-flight guards -----------------------------------------------------
  const school = await db.school.findUnique({
    where: { id: SCHOOL_ID },
    select: { id: true, name: true, domain: true },
  })
  if (!school)
    throw new Error(`School ${SCHOOL_ID} not found — wrong DATABASE_URL?`)

  const activeTerm = await db.term.findFirst({
    where: { schoolId: SCHOOL_ID, isActive: true },
    select: { id: true, yearId: true, termNumber: true },
  })
  if (!activeTerm) throw new Error("No active term — cannot generate timetable")

  const classroomType = await db.classroomType.findFirst({
    where: { schoolId: SCHOOL_ID },
    select: { id: true },
  })
  if (!classroomType)
    throw new Error("No ClassroomType — section homerooms need one")

  console.log(
    `✅ School: ${school.name} (${school.domain}) | active term #${activeTerm.termNumber} ` +
      `(${activeTerm.id}) | year ${activeTerm.yearId}\n`
  )

  // --- Phase A: teachers + expertise ----------------------------------------
  console.log("👩‍🏫 Phase A — teachers + expertise")

  const teacherIds: string[] = []
  for (let i = 0; i < NUM_TEACHERS; i++) {
    const isFemale = i % 3 === 0 // ~4 female, 8 male
    const given = isFemale
      ? FEMALE_GIVEN[i % FEMALE_GIVEN.length]
      : MALE_GIVEN[i % MALE_GIVEN.length]
    const surname = SURNAMES[(i * 5) % SURNAMES.length]
    const emailAddress = `tt.teacher${i + 1}@albayan.edu`
    const employeeId = `TT-T-${String(i + 1).padStart(3, "0")}`

    const teacher = await db.teacher.upsert({
      where: { schoolId_emailAddress: { schoolId: SCHOOL_ID, emailAddress } },
      update: {},
      create: {
        schoolId: SCHOOL_ID,
        firstName: given,
        lastName: surname,
        emailAddress,
        employeeId,
        gender: isFemale ? "female" : "male",
        lang: "ar",
        employmentStatus: "ACTIVE",
        employmentType: "FULL_TIME",
        joiningDate: new Date("2025-09-01"),
      },
      select: { id: true },
    })
    teacherIds.push(teacher.id)
  }
  console.log(`   ✅ ${teacherIds.length} teachers ready`)

  // Distinct subjects across the 3 target grades → assign N teachers each.
  const selections = await db.subjectSelection.findMany({
    where: {
      schoolId: SCHOOL_ID,
      isActive: true,
      gradeId: { in: [...gradeIds] },
    },
    select: { catalogSubjectId: true },
  })
  const distinctSubjectIds = [
    ...new Set(selections.map((s) => s.catalogSubjectId)),
  ]

  let expertiseCount = 0
  for (let si = 0; si < distinctSubjectIds.length; si++) {
    const subjectId = distinctSubjectIds[si]
    for (let k = 0; k < TEACHERS_PER_SUBJECT; k++) {
      const teacherId =
        teacherIds[(si * TEACHERS_PER_SUBJECT + k) % teacherIds.length]
      await db.teacherSubjectExpertise.upsert({
        where: {
          schoolId_teacherId_subjectId: {
            schoolId: SCHOOL_ID,
            teacherId,
            subjectId,
          },
        },
        update: {},
        create: {
          schoolId: SCHOOL_ID,
          teacherId,
          subjectId,
          expertiseLevel: "PRIMARY",
        },
      })
      expertiseCount++
    }
  }
  console.log(
    `   ✅ ${expertiseCount} expertise rows over ${distinctSubjectIds.length} distinct subjects\n`
  )

  // --- Phase C: sections + homeroom classrooms ------------------------------
  console.log("🏫 Phase C — sections + homerooms")

  const seededSections: Array<{
    id: string
    gradeId: string
    gradeNumber: number
    letter: string
    classroomId: string
  }> = []

  for (const grade of TARGET_GRADES) {
    for (const letter of SECTION_LETTERS) {
      const roomName = `Grade ${grade.gradeNumber}-${letter}`

      const classroom = await db.classroom.upsert({
        where: { schoolId_roomName: { schoolId: SCHOOL_ID, roomName } },
        update: {},
        create: {
          schoolId: SCHOOL_ID,
          roomName,
          capacity: 30,
          typeId: classroomType.id,
          gradeId: grade.id,
        },
        select: { id: true },
      })

      const section = await db.section.upsert({
        where: {
          schoolId_gradeId_letter: {
            schoolId: SCHOOL_ID,
            gradeId: grade.id,
            letter,
          },
        },
        update: { classroomId: classroom.id },
        create: {
          schoolId: SCHOOL_ID,
          gradeId: grade.id,
          name: roomName,
          letter,
          classroomId: classroom.id,
          maxCapacity: 30,
        },
        select: { id: true },
      })

      seededSections.push({
        id: section.id,
        gradeId: grade.id,
        gradeNumber: grade.gradeNumber,
        letter,
        classroomId: classroom.id,
      })
    }
  }
  console.log(`   ✅ ${seededSections.length} sections + homerooms ready\n`)

  // --- Phase B: students (deterministic, find-guarded) ----------------------
  console.log("🎒 Phase B — students")

  let studentIdx = 0
  let studentsCreated = 0
  for (const section of seededSections) {
    for (let j = 0; j < STUDENTS_PER_SECTION; j++) {
      studentIdx++
      const externalStudentId = `TTS-${section.gradeNumber}${section.letter}${j + 1}`

      const existing = await db.student.findFirst({
        where: { schoolId: SCHOOL_ID, studentId: externalStudentId },
        select: { id: true },
      })
      if (existing) {
        await db.student.update({
          where: { id: existing.id },
          data: { sectionId: section.id, academicGradeId: section.gradeId },
        })
        continue
      }

      const isFemale = studentIdx % 2 === 0
      const given = isFemale
        ? FEMALE_GIVEN[studentIdx % FEMALE_GIVEN.length]
        : MALE_GIVEN[studentIdx % MALE_GIVEN.length]
      const surname = SURNAMES[(studentIdx * 3) % SURNAMES.length]
      const birthYear = 2026 - (5 + section.gradeNumber) // age-appropriate per grade

      await db.student.create({
        data: {
          schoolId: SCHOOL_ID,
          studentId: externalStudentId,
          grNumber: `GR${String(1000 + studentIdx).padStart(4, "0")}`,
          firstName: given,
          lastName: surname,
          gender: isFemale ? "female" : "male",
          dateOfBirth: new Date(`${birthYear}-03-15`),
          lang: "ar",
          nationality: "SD",
          country: "SD",
          status: "ACTIVE",
          sectionId: section.id,
          academicGradeId: section.gradeId,
        },
      })
      studentsCreated++
    }
  }
  console.log(
    `   ✅ ${studentsCreated} students created (${studentIdx} total across ${seededSections.length} sections)\n`
  )

  // --- Phase D: build a realistic, teacher-assigned schedule ----------------
  console.log("🧩 Phase D — build schedule")

  // gradeId -> subject allocations (from active SubjectSelection).
  const subjectSelections = await db.subjectSelection.findMany({
    where: {
      schoolId: SCHOOL_ID,
      isActive: true,
      gradeId: { in: [...gradeIds] },
    },
    select: {
      catalogSubjectId: true,
      gradeId: true,
      weeklyPeriods: true,
      subject: { select: { name: true } },
    },
  })
  const gradeSubjectsMap = new Map<
    string,
    Array<{ subjectId: string; subjectName: string; hoursPerWeek: number }>
  >()
  for (const sel of subjectSelections) {
    if (!sel.subject) continue
    const list = gradeSubjectsMap.get(sel.gradeId) ?? []
    list.push({
      subjectId: sel.catalogSubjectId,
      subjectName: sel.subject.name,
      hoursPerWeek: sel.weeklyPeriods ?? 3,
    })
    gradeSubjectsMap.set(sel.gradeId, list)
  }

  // subjectId -> qualified teacherIds (from expertise).
  const expertise = await db.teacherSubjectExpertise.findMany({
    where: { schoolId: SCHOOL_ID },
    select: { teacherId: true, subjectId: true },
  })
  const subjectTeachers = new Map<string, string[]>()
  for (const e of expertise) {
    const list = subjectTeachers.get(e.subjectId) ?? []
    list.push(e.teacherId)
    subjectTeachers.set(e.subjectId, list)
  }

  // Teaching periods (exclude break/lunch) + working days.
  const periods = await db.period.findMany({
    where: { schoolId: SCHOOL_ID, yearId: activeTerm.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true },
  })
  const teachingPeriodIds = periods
    .filter((p) => !/break|lunch/i.test(p.name))
    .map((p) => p.id)
  if (teachingPeriodIds.length === 0)
    throw new Error("No teaching periods found")

  const weekConfig = await db.schoolWeekConfig.findFirst({
    where: { schoolId: SCHOOL_ID },
    orderBy: { termId: "desc" },
    select: { workingDays: true },
  })
  const workingDays =
    Array.isArray(weekConfig?.workingDays) && weekConfig!.workingDays.length > 0
      ? (weekConfig!.workingDays as number[])
      : [1, 2, 3, 4, 5]

  // Grid positions, PERIOD-outer / DAY-inner so consecutive sequence items land
  // on different days → a subject's repeats spread across the week.
  const positions: Array<{ day: number; periodId: string }> = []
  for (const periodId of teachingPeriodIds) {
    for (const day of workingDays) {
      positions.push({ day, periodId })
    }
  }

  // Global teacher booking state shared across all sections.
  const busy = new Set<string>() // `${teacherId}:${day}:${periodId}`
  const load = new Map<string, number>() // teacherId -> weekly period count

  const slotsToCreate: Array<{
    schoolId: string
    termId: string
    dayOfWeek: number
    periodId: string
    sectionId: string
    subjectId: string
    classroomId: string
    teacherId?: string
    weekOffset: number
    constraintViolations: string[]
  }> = []
  let assignedCount = 0

  for (const section of seededSections) {
    const subjects = gradeSubjectsMap.get(section.gradeId) ?? []
    if (subjects.length === 0) continue

    // Balanced interleave: one period of each subject per pass (respecting
    // hoursPerWeek), then top up by cycling to fill the full grid.
    const remaining = subjects.map((s) => ({
      subject: s,
      left: s.hoursPerWeek,
    }))
    const sequence: Array<{ subjectId: string }> = []
    let progressed = true
    while (sequence.length < positions.length && progressed) {
      progressed = false
      for (const r of remaining) {
        if (sequence.length >= positions.length) break
        if (r.left > 0) {
          sequence.push(r.subject)
          r.left--
          progressed = true
        }
      }
    }
    let cycle = 0
    while (sequence.length < positions.length) {
      sequence.push(subjects[cycle % subjects.length])
      cycle++
    }

    // Lay the sequence onto the grid + assign the first free qualified teacher.
    for (let k = 0; k < positions.length; k++) {
      const subjectId = sequence[k].subjectId
      const pos = positions[k]
      const candidates = subjectTeachers.get(subjectId) ?? []

      let teacherId: string | undefined
      for (const tid of candidates) {
        const key = `${tid}:${pos.day}:${pos.periodId}`
        if (busy.has(key)) continue
        if ((load.get(tid) ?? 0) >= MAX_PERIODS_PER_WEEK) continue
        teacherId = tid
        busy.add(key)
        load.set(tid, (load.get(tid) ?? 0) + 1)
        break
      }
      if (teacherId) assignedCount++

      slotsToCreate.push({
        schoolId: SCHOOL_ID,
        termId: activeTerm.id,
        dayOfWeek: pos.day,
        periodId: pos.periodId,
        sectionId: section.id,
        subjectId,
        classroomId: section.classroomId,
        teacherId,
        weekOffset: 0,
        constraintViolations: teacherId ? [] : ["unassigned_teacher"],
      })
    }
  }

  console.log(
    `   • ${seededSections.length} sections × ${positions.length} slots, ` +
      `days [${workingDays.join(",")}], ${teachingPeriodIds.length} periods`
  )

  // Clean re-run: clear only THIS subset's slots, then insert fresh.
  await db.timetable.deleteMany({
    where: {
      schoolId: SCHOOL_ID,
      termId: activeTerm.id,
      sectionId: { in: seededSections.map((s) => s.id) },
    },
  })

  const created = await db.timetable.createMany({
    data: slotsToCreate,
    skipDuplicates: true,
  })

  console.log(
    `   ✅ ${created.count} timetable slots written ` +
      `(${assignedCount}/${slotsToCreate.length} teacher-assigned)\n`
  )

  console.log(
    "🎉 Done. Visit albayan.databayt.org/en/timetable and select a 'Grade N-A' classroom."
  )
}

main()
  .then(async () => {
    await db.$disconnect()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error("❌ Seed failed:", err)
    await db.$disconnect()
    process.exit(1)
  })
