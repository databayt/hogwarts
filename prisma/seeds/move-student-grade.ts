// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Move one student to a different academic grade.
 *
 * Placement lives in several places at once, so changing `academicGradeId`
 * alone leaves the student half-moved: the section drives the timetable they
 * see, the enrollments drive their classes, and any stream belongs to the old
 * grade. This moves all of it together, then drops the coursework that is
 * anchored to classes they are no longer in — attendance, gradebook results,
 * submissions and exam results that would otherwise show the old grade's
 * subjects on a report card for their new grade.
 *
 * Dry-run by default; pass --apply to write.
 *
 *   npx tsx prisma/seeds/move-student-grade.ts student@balqalam.com 12
 *   npx tsx prisma/seeds/move-student-grade.ts student@balqalam.com 12 --apply
 *   MOVE_SCHOOL_DOMAIN=demo npx tsx prisma/seeds/move-student-grade.ts ... --apply
 */

import "dotenv/config"

import { PrismaClient } from "@prisma/client"

export async function moveStudentToGrade(
  prisma: PrismaClient,
  opts: { schoolId: string; email: string; gradeNumber: number; apply: boolean }
) {
  const { schoolId, email, gradeNumber, apply } = opts

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  })
  if (!user) throw new Error(`No user with email ${email}`)

  const student = await prisma.student.findFirst({
    where: { schoolId, userId: user.id },
    select: {
      id: true,
      sectionId: true,
      academicGradeId: true,
      academicStreamId: true,
    },
  })
  if (!student) throw new Error(`No student for ${email} in this school`)

  const grade = await prisma.academicGrade.findFirst({
    where: { schoolId, gradeNumber },
    select: { id: true, name: true },
  })
  if (!grade) throw new Error(`School has no grade ${gradeNumber}`)
  if (grade.id === student.academicGradeId) {
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

  const targetClasses = await prisma.class.findMany({
    where: { schoolId, gradeId: grade.id },
    select: { id: true },
  })
  const targetIds = new Set(targetClasses.map((c) => c.id))

  const enrolled = await prisma.studentClass.findMany({
    where: { schoolId, studentId: student.id },
    select: { id: true, classId: true },
  })
  const leaving = enrolled.filter((e) => !targetIds.has(e.classId))
  const leavingClassIds = leaving.map((e) => e.classId)
  const joining = targetClasses.filter(
    (c) => !enrolled.some((e) => e.classId === c.id)
  )

  const attendance = await prisma.attendance.count({
    where: {
      schoolId,
      studentId: student.id,
      classId: { in: leavingClassIds },
    },
  })
  const results = await prisma.result.count({
    where: {
      schoolId,
      studentId: student.id,
      classId: { in: leavingClassIds },
    },
  })
  const submissions = await prisma.assignmentSubmission.count({
    where: {
      schoolId,
      studentId: student.id,
      assignment: { classId: { in: leavingClassIds } },
    },
  })
  const examResults = await prisma.examResult.count({
    where: {
      schoolId,
      studentId: student.id,
      exam: { classId: { in: leavingClassIds } },
    },
  })

  console.log(
    `${apply ? "Moving" : "DRY RUN — would move"} ${email} to ${grade.name}` +
      `\n  section            ${section.letter} (${section._count.students} students)` +
      `\n  stream             ${keepStream ? "kept" : "cleared"}` +
      `\n  enrollments left   ${leaving.length}` +
      `\n  enrollments joined ${joining.length}` +
      `\n  attendance dropped ${attendance}` +
      `\n  results dropped    ${results}` +
      `\n  submissions dropped ${submissions}` +
      `\n  exam results dropped ${examResults}`
  )

  if (!apply) return

  await prisma.$transaction([
    prisma.attendance.deleteMany({
      where: {
        schoolId,
        studentId: student.id,
        classId: { in: leavingClassIds },
      },
    }),
    prisma.result.deleteMany({
      where: {
        schoolId,
        studentId: student.id,
        classId: { in: leavingClassIds },
      },
    }),
    prisma.assignmentSubmission.deleteMany({
      where: {
        schoolId,
        studentId: student.id,
        assignment: { classId: { in: leavingClassIds } },
      },
    }),
    prisma.examResult.deleteMany({
      where: {
        schoolId,
        studentId: student.id,
        exam: { classId: { in: leavingClassIds } },
      },
    }),
    prisma.studentClass.deleteMany({
      where: { id: { in: leaving.map((e) => e.id) } },
    }),
    prisma.studentClass.createMany({
      data: joining.map((c) => ({
        schoolId,
        studentId: student.id,
        classId: c.id,
      })),
      skipDuplicates: true,
    }),
    prisma.student.update({
      where: { id: student.id },
      data: {
        academicGradeId: grade.id,
        sectionId: section.id,
        academicStreamId: keepStream ? student.academicStreamId : null,
      },
    }),
  ])

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
