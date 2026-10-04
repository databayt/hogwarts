// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Move one student to a different academic grade.
 *
 * Placement lives in more than one place: the section drives the timetable
 * and roster they see, the grade drives their subjects (and LMS courses), and
 * any stream belongs to the old grade. This moves all of it together, then
 * drops the coursework anchored to the old grade — its section's attendance,
 * and gradebook results, submissions and exam results for work set for the old
 * grade (or a legacy class of it) — that would otherwise show the old grade's
 * subjects on a report card for the new one.
 *
 * Dry-run by default; pass --apply to write.
 *
 *   npx tsx prisma/seeds/move-student-grade.ts student@balqalam.com 12
 *   npx tsx prisma/seeds/move-student-grade.ts student@balqalam.com 12 --apply
 *   MOVE_SCHOOL_DOMAIN=demo npx tsx prisma/seeds/move-student-grade.ts ... --apply
 */

import "dotenv/config"

import { PrismaClient, type Prisma } from "@prisma/client"

import { syncStudentSubjectEnrollments } from "@/lib/enrollment-sync"

export async function moveStudentToGrade(
  prisma: PrismaClient,
  opts: { schoolId: string; email: string; gradeNumber: number; apply: boolean }
) {
  const { schoolId, email, gradeNumber, apply } = opts

  // Look the student up through the school, not the email alone: the same
  // address can own an account in more than one school, and picking the first
  // user row lands in whichever tenant happens to sort first.
  const student = await prisma.student.findFirst({
    where: { schoolId, user: { email } },
    select: {
      id: true,
      sectionId: true,
      academicGradeId: true,
      academicStreamId: true,
      section: { select: { gradeId: true } },
    },
  })
  if (!student) throw new Error(`No student for ${email} in this school`)
  const oldGradeId = student.section?.gradeId ?? student.academicGradeId

  const grade = await prisma.academicGrade.findFirst({
    where: { schoolId, gradeNumber },
    select: { id: true, name: true },
  })
  if (!grade) throw new Error(`School has no grade ${gradeNumber}`)
  if (grade.id === oldGradeId) {
    console.log(`${email} is already in ${grade.name}`)
    return
  }

  // Put them in whichever section of the new grade has the fewest students.
  const sections = await prisma.section.findMany({
    where: { schoolId, gradeId: grade.id },
    select: { id: true, letter: true, _count: { select: { students: true } } },
  })
  if (sections.length === 0)
    throw new Error(`Grade ${gradeNumber} has no sections`)
  sections.sort((a, b) => a._count.students - b._count.students)
  const section = sections[0]

  // A stream belongs to one grade, so an old one cannot survive the move.
  const keepStream =
    student.academicStreamId &&
    (await prisma.academicStream.count({
      where: { id: student.academicStreamId, gradeId: grade.id },
    })) > 0

  // What belongs to the old grade: its section's marks, and work set for the
  // old grade or one of its legacy classes.
  const oldClass = oldGradeId ? [{ class: { gradeId: oldGradeId } }] : []
  const attendanceWhere: Prisma.AttendanceWhereInput = {
    schoolId,
    studentId: student.id,
    OR: [
      ...(student.sectionId ? [{ sectionId: student.sectionId }] : []),
      ...oldClass,
      { id: { in: [] } },
    ],
  }
  const resultWhere: Prisma.ResultWhereInput = {
    schoolId,
    studentId: student.id,
    OR: [
      ...(oldGradeId ? [{ academicGradeId: oldGradeId }] : []),
      ...(student.sectionId ? [{ sectionId: student.sectionId }] : []),
      ...oldClass,
      { id: { in: [] } },
    ],
  }
  const oldWork = {
    OR: [...(oldGradeId ? [{ gradeId: oldGradeId }] : []), ...oldClass],
  }
  const submissionWhere: Prisma.AssignmentSubmissionWhereInput = {
    schoolId,
    studentId: student.id,
    assignment: oldWork.OR.length > 0 ? oldWork : { id: { in: [] } },
  }
  const examResultWhere: Prisma.ExamResultWhereInput = {
    schoolId,
    studentId: student.id,
    exam: oldWork.OR.length > 0 ? oldWork : { id: { in: [] } },
  }
  // Legacy class enrollments in the old grade go with it
  const enrollmentWhere: Prisma.StudentClassWhereInput = {
    schoolId,
    studentId: student.id,
    class: oldGradeId ? { gradeId: oldGradeId } : { id: { in: [] } },
  }

  const [attendance, results, submissions, examResults, enrollments] =
    await Promise.all([
      prisma.attendance.count({ where: attendanceWhere }),
      prisma.result.count({ where: resultWhere }),
      prisma.assignmentSubmission.count({ where: submissionWhere }),
      prisma.examResult.count({ where: examResultWhere }),
      prisma.studentClass.count({ where: enrollmentWhere }),
    ])

  console.log(
    `${apply ? "Moving" : "DRY RUN — would move"} ${email} to ${grade.name}` +
      `\n  section            ${section.letter} (${section._count.students} students)` +
      `\n  stream             ${keepStream ? "kept" : "cleared"}` +
      `\n  attendance dropped ${attendance}` +
      `\n  results dropped    ${results}` +
      `\n  submissions dropped ${submissions}` +
      `\n  exam results dropped ${examResults}` +
      `\n  legacy enrollments dropped ${enrollments}`
  )

  if (!apply) return

  await prisma.$transaction([
    prisma.attendance.deleteMany({ where: attendanceWhere }),
    prisma.result.deleteMany({ where: resultWhere }),
    prisma.assignmentSubmission.deleteMany({ where: submissionWhere }),
    prisma.examResult.deleteMany({ where: examResultWhere }),
    prisma.studentClass.deleteMany({ where: enrollmentWhere }),
    prisma.student.update({
      where: { id: student.id },
      data: {
        academicGradeId: grade.id,
        sectionId: section.id,
        academicStreamId: keepStream ? student.academicStreamId : null,
      },
    }),
  ])
  // The new grade's subjects in the LMS (adds only)
  await syncStudentSubjectEnrollments(schoolId, student.id, prisma)

  console.log(`Moved ${email} to ${grade.name}, section ${section.letter}`)
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--apply")
  const apply = process.argv.includes("--apply")
  const email = args[0]
  const gradeNumber = Number(args[1])
  if (!email || !Number.isInteger(gradeNumber)) {
    console.error(
      "Usage: move-student-grade.ts <email> <gradeNumber> [--apply]"
    )
    process.exit(1)
  }

  const prisma = new PrismaClient()
  try {
    const domain = process.env.MOVE_SCHOOL_DOMAIN ?? "demo"
    const school = await prisma.school.findFirst({
      where: { domain },
      select: { id: true },
    })
    if (!school) throw new Error(`No school with domain ${domain}`)
    await moveStudentToGrade(prisma, {
      schoolId: school.id,
      email,
      gradeNumber,
      apply,
    })
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1]?.includes("move-student-grade")) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
