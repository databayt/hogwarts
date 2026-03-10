// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Seed teachers for Comboni school
 *
 * Creates 30 Teacher records using TEACHER_DATA, links them to departments
 * via TeacherDepartment, and creates TeacherSubjectExpertise records
 * linking teachers to matching school subjects (needed for class generation
 * and timetable algorithm).
 *
 * Usage:
 *   pnpm db:seed:single comboni-teachers
 */

import { PrismaClient } from "@prisma/client"

import { TEACHER_DATA } from "./constants"

const prisma = new PrismaClient()

export async function seedComboniTeachers() {
  // 1. Find Comboni school
  const school = await prisma.school.findFirst({
    where: { domain: "comboni" },
    select: { id: true, name: true, domain: true },
  })

  if (!school) {
    throw new Error(
      'Comboni school not found. Ensure school with domain "comboni" exists.'
    )
  }

  console.log(`School: ${school.name} (${school.id})`)

  // 2. Get existing departments
  const departments = await prisma.department.findMany({
    where: { schoolId: school.id },
    select: { id: true, departmentName: true },
  })

  const deptByName = new Map(departments.map((d) => [d.departmentName, d.id]))
  console.log(`Found ${departments.length} departments`)

  if (departments.length === 0) {
    throw new Error("No departments found. Run onboarding first.")
  }

  // 3. Get school subjects for expertise linking
  const subjects = await prisma.subject.findMany({
    where: { schoolId: school.id },
    select: { id: true, subjectName: true, departmentId: true },
  })
  console.log(`Found ${subjects.length} school subjects`)

  // 4. Check existing teachers to avoid duplicates
  const existingTeachers = await prisma.teacher.findMany({
    where: { schoolId: school.id },
    select: { emailAddress: true },
  })
  const existingEmails = new Set(existingTeachers.map((t) => t.emailAddress))
  console.log(`Existing teachers: ${existingTeachers.length}`)

  // 5. Create teachers
  let created = 0
  let skipped = 0
  const deptHeadTracker = new Set<string>() // track which depts already have a head

  for (let i = 0; i < TEACHER_DATA.length; i++) {
    const data = TEACHER_DATA[i]
    const email = `teacher${i + 1}@comboni.edu`

    if (existingEmails.has(email)) {
      skipped++
      continue
    }

    const departmentId = deptByName.get(data.department)

    const teacher = await prisma.teacher.create({
      data: {
        schoolId: school.id,
        givenName: data.givenName,
        surname: data.surname,
        gender: data.gender,
        emailAddress: email,
        employeeId: `CMB-T${String(i + 1).padStart(3, "0")}`,
        employmentStatus: "ACTIVE",
        employmentType: "FULL_TIME",
        joiningDate: new Date("2024-09-01"),
        lang: "ar",
      },
    })

    // Link to department
    if (departmentId) {
      const isHead = !deptHeadTracker.has(departmentId)
      if (isHead) deptHeadTracker.add(departmentId)

      await prisma.teacherDepartment.create({
        data: {
          schoolId: school.id,
          teacherId: teacher.id,
          departmentId,
          isPrimary: true,
          isDepartmentHead: isHead,
        },
      })
    }

    // Link to matching school subjects (by department)
    if (departmentId) {
      const matchingSubjects = subjects.filter(
        (s) => s.departmentId === departmentId
      )
      // Each teacher gets expertise on up to 3 subjects in their department
      const subjectsToLink = matchingSubjects.slice(0, 3)

      for (let j = 0; j < subjectsToLink.length; j++) {
        await prisma.teacherSubjectExpertise.create({
          data: {
            schoolId: school.id,
            teacherId: teacher.id,
            subjectId: subjectsToLink[j].id,
            expertiseLevel: j === 0 ? "PRIMARY" : "SECONDARY",
          },
        })
      }
    }

    created++
  }

  console.log(`Created ${created} teachers (${skipped} skipped as existing)`)

  // Summary
  const totalTeachers = await prisma.teacher.count({
    where: { schoolId: school.id },
  })
  const totalExpertise = await prisma.teacherSubjectExpertise.count({
    where: { schoolId: school.id },
  })
  console.log(`Total teachers: ${totalTeachers}`)
  console.log(`Total subject expertise links: ${totalExpertise}`)
}
