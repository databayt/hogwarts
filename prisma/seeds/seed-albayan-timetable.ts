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
 * WHAT: seeds a realistic, teacher-assigned schedule for all 12 schedulable
 * grades (1-12; KG grades -1/0 have no subjects) so every grade room fills up:
 *   Pre — relabel empty KG rooms ('Grade -1/0-*' → 'KG1/KG2-*') so the room
 *         selector (orderBy roomName asc) opens on a populated 'Grade 1-A'
 *   Phase A — ~40 teachers (unique Sudanese names) + TeacherSubjectExpertise
 *   Phase C — 2 sections + homeroom classrooms per grade (24 sections)
 *   Phase B — ~5 students per section (~120) distributed across sections
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
 *   - students:  studentId    LIKE 'TTS-%' (grNumber 'GR9%')
 *   - sections:  all sections (grades 1-12, A/B); homerooms 'Grade {1..12}-{A,B}'
 *   - slots:     scoped to the seeded sectionIds
 *
 * TEARDOWN (raw SQL against the same DB; schoolId 'cmpwoul5p00008ojdlmx75d4h'):
 *   DELETE FROM timetables WHERE "schoolId"='...' AND "sectionId" IN (SELECT id FROM sections WHERE "schoolId"='...');
 *   DELETE FROM teacher_subject_expertise WHERE "schoolId"='...' AND "teacherId" IN (SELECT id FROM teachers WHERE "emailAddress" LIKE 'tt.teacher%@albayan.edu');
 *   DELETE FROM students WHERE "schoolId"='...' AND "studentId" LIKE 'TTS-%';
 *   DELETE FROM teachers WHERE "schoolId"='...' AND "emailAddress" LIKE 'tt.teacher%@albayan.edu';
 *   DELETE FROM sections WHERE "schoolId"='...' AND name LIKE 'Grade %';
 *   -- optional: revert KG labels  UPDATE classrooms SET "roomName"=replace(replace("roomName",'KG1','Grade -1'),'KG2','Grade 0') WHERE "schoolId"='...' AND "roomName" LIKE 'KG%';
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

// Full school — all 12 schedulable grades (KG grades -1/0 have no subjects).
const TARGET_GRADES = [
  { id: "cmq0t3cve00078oeuq1br1sf4", gradeNumber: 1 },
  { id: "cmq0t3d6s00098oeukeskc8tq", gradeNumber: 2 },
  { id: "cmq0t3dcg000b8oeu5rpifjvr", gradeNumber: 3 },
  { id: "cmq0t3di9000d8oeuzu6qvgti", gradeNumber: 4 },
  { id: "cmq0t3do9000f8oeur2x9khnr", gradeNumber: 5 },
  { id: "cmq0t3dtt000h8oeuhcfinx8u", gradeNumber: 6 },
  { id: "cmq0t3dzg000j8oeucxhqog1u", gradeNumber: 7 },
  { id: "cmq0t3e85000l8oeufdpii51f", gradeNumber: 8 },
  { id: "cmq0t3eds000n8oeulw6p9yv3", gradeNumber: 9 },
  { id: "cmq0t3ej9000p8oeufyqwikfg", gradeNumber: 10 },
  { id: "cmq0t3eow000r8oeuhxh0tiyq", gradeNumber: 11 },
  { id: "cmq0t3eui000t8oeuugoxecb4", gradeNumber: 12 },
] as const

const SECTION_LETTERS = ["A", "B"] as const
const STUDENTS_PER_SECTION = 5
// 24 sections × 35 slots = 840; @25 periods/wk/teacher needs ≥34 → headroom.
const NUM_TEACHERS = 40
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
    `🌱 Albayan timetable seed — full school (${TARGET_GRADES.length} grades, ${TARGET_GRADES.length * SECTION_LETTERS.length} sections)\n`
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

  // --- Pre: relabel empty KG rooms ------------------------------------------
  // The KG classrooms were named "Grade -1/0-*", which sort before the
  // digit-named rooms (the "-" precedes "0"-"9"). getRoomsForSelection orders
  // by roomName asc and the admin grid auto-selects rooms[0], so the page would
  // open on an empty KG room. Rename so "Grade 1-A" sorts first. Idempotent.
  const KG_RENAMES: Array<[string, string]> = [
    ["Grade -1-A", "KG1-A"],
    ["Grade -1-B", "KG1-B"],
    ["Grade 0-A", "KG2-A"],
    ["Grade 0-B", "KG2-B"],
  ]
  let renamed = 0
  for (const [from, to] of KG_RENAMES) {
    const r = await db.classroom.updateMany({
      where: { schoolId: SCHOOL_ID, roomName: from },
      data: { roomName: to },
    })
    renamed += r.count
  }
  if (renamed > 0) console.log(`🏷️  Relabelled ${renamed} KG rooms → KG1/KG2\n`)

  // --- Phase A: teachers + expertise ----------------------------------------
  console.log("👩‍🏫 Phase A — teachers + expertise")

  // Per-gender counters + a surname offset of floor(n/poolLen) guarantee a
  // distinct (given, surname) pair for every teacher (no repeated full names).
  const teacherIds: string[] = []
  let maleN = 0
  let femaleN = 0
  for (let i = 0; i < NUM_TEACHERS; i++) {
    const isFemale = i % 3 === 0 // ~1/3 female
    const pool = isFemale ? FEMALE_GIVEN : MALE_GIVEN
    const n = isFemale ? femaleN++ : maleN++
    const given = pool[n % pool.length]
    const surname =
      SURNAMES[(n + Math.floor(n / pool.length)) % SURNAMES.length]
    const gender = isFemale ? "female" : "male"
    const emailAddress = `tt.teacher${i + 1}@albayan.edu`
    const employeeId = `TT-T-${String(i + 1).padStart(3, "0")}`

    const teacher = await db.teacher.upsert({
      where: { schoolId_emailAddress: { schoolId: SCHOOL_ID, emailAddress } },
      update: { firstName: given, lastName: surname, gender }, // normalise on re-run
      create: {
        schoolId: SCHOOL_ID,
        firstName: given,
        lastName: surname,
        emailAddress,
        employeeId,
        gender,
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

      // Stable per-(grade,letter,j) GR number — independent of section order so
      // re-runs at any scope never collide (GR9xxx avoids the real GR0001 and
      // the earlier 3-grade run's GR10xx students).
      const letterIdx = section.letter === "B" ? 1 : 0
      const grSeq = section.gradeNumber * 100 + letterIdx * 10 + (j + 1)

      await db.student.create({
        data: {
          schoolId: SCHOOL_ID,
          studentId: externalStudentId,
          grNumber: `GR9${grSeq}`,
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
