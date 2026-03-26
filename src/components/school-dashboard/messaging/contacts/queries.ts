// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Contact queries for the messaging contacts panel.
 *
 * Broad categories (teachers, students, parents, staff, admin, accountants)
 * use User.schoolId as the canonical membership source, then enrich with
 * domain model data (firstName, lastName, contextLabel) when available.
 *
 * Relationship categories (my_teachers, my_students, classmates,
 * my_children_teachers) use domain model traversal.
 *
 * All queries are scoped by schoolId (multi-tenant safety).
 */

import type { Prisma, UserRole } from "@prisma/client"

import { db } from "@/lib/db"

import { MAX_CONTACTS_PER_CATEGORY, ROLE_CATEGORIES } from "./config"
import type { ContactCategory, ContactDTO, ContactGroup } from "./types"

// ============================================================================
// Main dispatcher
// ============================================================================

export async function getContactsByRole(
  schoolId: string,
  userId: string,
  role: UserRole,
  search?: string
): Promise<ContactGroup[]> {
  const categories = ROLE_CATEGORIES[role]
  if (!categories) return []

  const groups = await Promise.all(
    categories.map((category) =>
      getContactsForCategory(schoolId, userId, role, category, search)
    )
  )

  return groups.filter((g) => g.contacts.length > 0)
}

// ============================================================================
// Category dispatcher
// ============================================================================

async function getContactsForCategory(
  schoolId: string,
  userId: string,
  role: UserRole,
  category: ContactCategory,
  search?: string
): Promise<ContactGroup> {
  let contacts: ContactDTO[]

  switch (category) {
    // Broad categories — User-table-first with domain enrichment
    case "teachers":
      contacts = await getMembersByRole(
        schoolId,
        userId,
        "TEACHER",
        "teachers",
        search
      )
      break
    case "students":
      contacts = await getMembersByRole(
        schoolId,
        userId,
        "STUDENT",
        "students",
        search
      )
      break
    case "parents":
      contacts =
        role === "TEACHER"
          ? await getGuardiansForTeacher(schoolId, userId, search)
          : await getMembersByRole(
              schoolId,
              userId,
              "GUARDIAN",
              "parents",
              search
            )
      break
    case "staff":
      contacts = await getMembersByRole(
        schoolId,
        userId,
        "STAFF",
        "staff",
        search
      )
      break
    case "admin":
      contacts = await getMembersByRole(
        schoolId,
        userId,
        "ADMIN",
        "admin",
        search
      )
      break
    case "accountants":
      contacts = await getMembersByRole(
        schoolId,
        userId,
        "ACCOUNTANT",
        "accountants",
        search
      )
      break

    // Relationship categories — domain model traversal
    case "my_teachers":
      contacts = await getTeachersForUser(schoolId, userId, role, search)
      break
    case "my_students":
      contacts = await getStudentsForTeacher(schoolId, userId, search)
      break
    case "classmates":
      contacts = await getClassmatesForStudent(schoolId, userId, search)
      break
    case "my_children_teachers":
      contacts = await getTeachersForGuardian(schoolId, userId, search)
      break

    default:
      contacts = []
  }

  return { category, contacts }
}

// ============================================================================
// User-table-first membership query with domain enrichment
// ============================================================================

type ProfileData = {
  firstName: string
  lastName: string
  email: string | null
  image: string | null
  contextLabel?: string
}

async function getMembersByRole(
  schoolId: string,
  excludeUserId: string,
  userRole: UserRole,
  category: ContactCategory,
  search?: string
): Promise<ContactDTO[]> {
  // 1. Query User table — canonical membership source
  const where: Prisma.UserWhereInput = {
    schoolId,
    role: userRole,
    isSuspended: false,
    id: { not: excludeUserId },
  }
  if (search && search.length >= 2) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      // Search domain model names via relation
      ...getDomainSearchFilters(userRole, search),
    ]
  }

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      role: true,
    },
    orderBy: [{ username: "asc" }, { email: "asc" }],
    take: MAX_CONTACTS_PER_CATEGORY,
  })

  if (users.length === 0) return []

  // 2. Batch-enrich with domain model data
  const userIds = users.map((u) => u.id)
  const profiles = await enrichProfiles(userRole, schoolId, userIds)

  // 3. Merge: domain data preferred, User fallback
  return users.map((u) => {
    const profile = profiles.get(u.id)
    const displayName = profile?.firstName
      ? `${profile.firstName} ${profile.lastName}`
      : (u.username ?? u.email ?? "User")
    return {
      id: u.id,
      firstName: profile?.firstName ?? u.username ?? "",
      lastName: profile?.lastName ?? "",
      displayName,
      email: profile?.email ?? u.email ?? null,
      image: u.image ?? profile?.image ?? null,
      role: u.role,
      category,
      contextLabel: profile?.contextLabel,
    }
  })
}

// Domain model search filters for User.OR clause
function getDomainSearchFilters(
  userRole: UserRole,
  search: string
): Prisma.UserWhereInput[] {
  const nameFilter = [{ contains: search, mode: "insensitive" as const }][0]

  switch (userRole) {
    case "TEACHER":
      return [
        { teacher: { firstName: nameFilter } },
        { teacher: { lastName: nameFilter } },
      ]
    case "STUDENT":
      return [
        { student: { firstName: nameFilter } },
        { student: { lastName: nameFilter } },
      ]
    case "GUARDIAN":
      return [
        { guardian: { firstName: nameFilter } },
        { guardian: { lastName: nameFilter } },
      ]
    case "STAFF":
      return [
        { staffMember: { firstName: nameFilter } },
        { staffMember: { lastName: nameFilter } },
      ]
    default:
      return []
  }
}

// Batch-enrich user IDs with domain model profile data
async function enrichProfiles(
  userRole: UserRole,
  schoolId: string,
  userIds: string[]
): Promise<Map<string, ProfileData>> {
  const map = new Map<string, ProfileData>()
  if (userIds.length === 0) return map

  switch (userRole) {
    case "TEACHER": {
      const teachers = await db.teacher.findMany({
        where: { schoolId, userId: { in: userIds } },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          emailAddress: true,
          profilePhotoUrl: true,
          homeroomSections: { select: { name: true }, take: 1 },
          teacherDepartments: {
            select: { department: { select: { departmentName: true } } },
            take: 1,
          },
        },
      })
      for (const t of teachers) {
        if (t.userId) {
          map.set(t.userId, {
            firstName: t.firstName,
            lastName: t.lastName,
            email: t.emailAddress,
            image: t.profilePhotoUrl ?? null,
            contextLabel:
              t.teacherDepartments[0]?.department?.departmentName ??
              t.homeroomSections[0]?.name,
          })
        }
      }
      break
    }
    case "STUDENT": {
      const students = await db.student.findMany({
        where: { schoolId, userId: { in: userIds } },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          profilePhotoUrl: true,
          section: { select: { name: true } },
        },
      })
      for (const s of students) {
        if (s.userId) {
          map.set(s.userId, {
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email ?? null,
            image: s.profilePhotoUrl ?? null,
            contextLabel: s.section?.name,
          })
        }
      }
      break
    }
    case "GUARDIAN": {
      const guardians = await db.guardian.findMany({
        where: { schoolId, userId: { in: userIds } },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          emailAddress: true,
          profilePhotoUrl: true,
          studentGuardians: {
            select: {
              student: { select: { firstName: true, lastName: true } },
            },
            take: 2,
          },
        },
      })
      for (const g of guardians) {
        if (g.userId) {
          const childNames = g.studentGuardians
            .map((sg) => sg.student.firstName)
            .join(", ")
          map.set(g.userId, {
            firstName: g.firstName,
            lastName: g.lastName,
            email: g.emailAddress ?? null,
            image: g.profilePhotoUrl ?? null,
            contextLabel: childNames || undefined,
          })
        }
      }
      break
    }
    case "STAFF": {
      const staff = await db.staffMember.findMany({
        where: { schoolId, userId: { in: userIds } },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          emailAddress: true,
          profilePhotoUrl: true,
          position: true,
          department: { select: { departmentName: true } },
        },
      })
      for (const s of staff) {
        if (s.userId) {
          map.set(s.userId, {
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.emailAddress,
            image: s.profilePhotoUrl ?? null,
            contextLabel: s.position ?? s.department?.departmentName,
          })
        }
      }
      break
    }
    // ADMIN, ACCOUNTANT — no domain model, empty map
  }

  return map
}

// ============================================================================
// Relationship queries (domain model traversal)
// ============================================================================

// -- Where-clause builders --

function teacherWhere(
  schoolId: string,
  excludeUserId: string,
  search?: string,
  extra?: Prisma.TeacherWhereInput
): Prisma.TeacherWhereInput {
  const where: Prisma.TeacherWhereInput = {
    schoolId,
    userId: { not: null },
    user: { isSuspended: false, id: { not: excludeUserId } },
    employmentStatus: "ACTIVE",
    ...extra,
  }
  const sf = nameSearch(search)
  if (sf) where.OR = sf as Prisma.TeacherWhereInput[]
  return where
}

function studentWhere(
  schoolId: string,
  excludeUserId: string,
  search?: string,
  extra?: Prisma.StudentWhereInput
): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {
    schoolId,
    userId: { not: null },
    user: { isSuspended: false, id: { not: excludeUserId } },
    status: "ACTIVE",
    ...extra,
  }
  const sf = nameSearch(search)
  if (sf) where.OR = sf as Prisma.StudentWhereInput[]
  return where
}

function guardianWhere(
  schoolId: string,
  excludeUserId: string,
  search?: string,
  extra?: Prisma.GuardianWhereInput
): Prisma.GuardianWhereInput {
  const where: Prisma.GuardianWhereInput = {
    schoolId,
    userId: { not: null },
    user: { isSuspended: false, id: { not: excludeUserId } },
    ...extra,
  }
  const sf = nameSearch(search)
  if (sf) where.OR = sf as Prisma.GuardianWhereInput[]
  return where
}

function nameSearch(search?: string) {
  if (!search || search.length < 2) return undefined
  return [
    { firstName: { contains: search, mode: "insensitive" as const } },
    { lastName: { contains: search, mode: "insensitive" as const } },
  ]
}

// -- Shared selects --

const teacherSelect = {
  firstName: true,
  lastName: true,
  emailAddress: true,
  profilePhotoUrl: true,
  user: { select: { id: true, image: true, role: true } },
  homeroomSections: { select: { name: true }, take: 1 },
  teacherDepartments: {
    select: { department: { select: { departmentName: true } } },
    take: 1,
  },
} as const

const studentSelect = {
  firstName: true,
  lastName: true,
  email: true,
  profilePhotoUrl: true,
  user: { select: { id: true, image: true, role: true } },
  section: { select: { name: true } },
} as const

const guardianSelect = {
  firstName: true,
  lastName: true,
  emailAddress: true,
  profilePhotoUrl: true,
  user: { select: { id: true, image: true, role: true } },
  studentGuardians: {
    select: { student: { select: { firstName: true, lastName: true } } },
    take: 2,
  },
} as const

// -- Mappers --

type TeacherRow = Awaited<
  ReturnType<typeof db.teacher.findMany<{ select: typeof teacherSelect }>>
>[number]

function mapTeacher(t: TeacherRow, category: ContactCategory): ContactDTO {
  return {
    id: t.user!.id,
    firstName: t.firstName,
    lastName: t.lastName,
    displayName: `${t.firstName} ${t.lastName}`,
    email: t.emailAddress,
    image: t.user!.image ?? t.profilePhotoUrl ?? null,
    role: t.user!.role,
    category,
    contextLabel:
      t.teacherDepartments[0]?.department?.departmentName ??
      t.homeroomSections[0]?.name,
  }
}

type StudentRow = Awaited<
  ReturnType<typeof db.student.findMany<{ select: typeof studentSelect }>>
>[number]

function mapStudent(s: StudentRow, category: ContactCategory): ContactDTO {
  return {
    id: s.user!.id,
    firstName: s.firstName,
    lastName: s.lastName,
    displayName: `${s.firstName} ${s.lastName}`,
    email: s.email ?? null,
    image: s.user!.image ?? s.profilePhotoUrl ?? null,
    role: s.user!.role,
    category,
    contextLabel: s.section?.name,
  }
}

type GuardianRow = Awaited<
  ReturnType<typeof db.guardian.findMany<{ select: typeof guardianSelect }>>
>[number]

function mapGuardian(g: GuardianRow, category: ContactCategory): ContactDTO {
  const childNames = g.studentGuardians
    .map((sg) => sg.student.firstName)
    .join(", ")
  return {
    id: g.user!.id,
    firstName: g.firstName,
    lastName: g.lastName,
    displayName: `${g.firstName} ${g.lastName}`,
    email: g.emailAddress ?? null,
    image: g.user!.image ?? g.profilePhotoUrl ?? null,
    role: g.user!.role,
    category,
    contextLabel: childNames || undefined,
  }
}

// -- Teachers (relationship) --

async function getTeachersForUser(
  schoolId: string,
  userId: string,
  role: UserRole,
  search?: string
): Promise<ContactDTO[]> {
  if (role === "STUDENT") return getTeachersForStudent(schoolId, userId, search)
  if (role === "GUARDIAN")
    return getTeachersForGuardian(schoolId, userId, search)
  // Fallback to broad membership query
  return getMembersByRole(schoolId, userId, "TEACHER", "my_teachers", search)
}

async function getTeachersForStudent(
  schoolId: string,
  userId: string,
  search?: string
): Promise<ContactDTO[]> {
  const student = await db.student.findFirst({
    where: { schoolId, userId },
    select: { sectionId: true },
  })
  if (!student?.sectionId) {
    return getMembersByRole(schoolId, userId, "TEACHER", "my_teachers", search)
  }

  const [timetableTeachers, section] = await Promise.all([
    db.timetable.findMany({
      where: {
        schoolId,
        sectionId: student.sectionId,
        teacherId: { not: null },
      },
      select: { teacherId: true },
      distinct: ["teacherId"],
    }),
    db.section.findFirst({
      where: { schoolId, id: student.sectionId },
      select: { homeroomTeacherId: true },
    }),
  ])

  const teacherIds = new Set(
    timetableTeachers.map((t) => t.teacherId!).filter(Boolean)
  )
  if (section?.homeroomTeacherId) teacherIds.add(section.homeroomTeacherId)
  if (teacherIds.size === 0) {
    return getMembersByRole(schoolId, userId, "TEACHER", "my_teachers", search)
  }

  const teachers = await db.teacher.findMany({
    where: teacherWhere(schoolId, userId, search, {
      id: { in: [...teacherIds] },
    }),
    select: teacherSelect,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: MAX_CONTACTS_PER_CATEGORY,
  })

  return teachers.filter((t) => t.user).map((t) => mapTeacher(t, "my_teachers"))
}

async function getTeachersForGuardian(
  schoolId: string,
  userId: string,
  search?: string
): Promise<ContactDTO[]> {
  const guardian = await db.guardian.findFirst({
    where: { schoolId, userId },
    select: {
      studentGuardians: {
        select: { student: { select: { sectionId: true } } },
      },
    },
  })

  const sectionIds = [
    ...new Set(
      guardian?.studentGuardians
        .map((sg) => sg.student.sectionId)
        .filter(Boolean) as string[]
    ),
  ]
  if (sectionIds.length === 0) {
    return getMembersByRole(
      schoolId,
      userId,
      "TEACHER",
      "my_children_teachers",
      search
    )
  }

  const [timetableTeachers, sections] = await Promise.all([
    db.timetable.findMany({
      where: {
        schoolId,
        sectionId: { in: sectionIds },
        teacherId: { not: null },
      },
      select: { teacherId: true },
      distinct: ["teacherId"],
    }),
    db.section.findMany({
      where: { schoolId, id: { in: sectionIds } },
      select: { homeroomTeacherId: true },
    }),
  ])

  const teacherIds = new Set(
    timetableTeachers.map((t) => t.teacherId!).filter(Boolean)
  )
  for (const s of sections) {
    if (s.homeroomTeacherId) teacherIds.add(s.homeroomTeacherId)
  }
  if (teacherIds.size === 0) {
    return getMembersByRole(
      schoolId,
      userId,
      "TEACHER",
      "my_children_teachers",
      search
    )
  }

  const teachers = await db.teacher.findMany({
    where: teacherWhere(schoolId, userId, search, {
      id: { in: [...teacherIds] },
    }),
    select: teacherSelect,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: MAX_CONTACTS_PER_CATEGORY,
  })

  return teachers
    .filter((t) => t.user)
    .map((t) => mapTeacher(t, "my_children_teachers"))
}

// -- Students (relationship) --

async function getStudentsForTeacher(
  schoolId: string,
  userId: string,
  search?: string
): Promise<ContactDTO[]> {
  const teacher = await db.teacher.findFirst({
    where: { schoolId, userId },
    select: { id: true },
  })
  if (!teacher) return []

  const [homeroomSections, timetableSections] = await Promise.all([
    db.section.findMany({
      where: { schoolId, homeroomTeacherId: teacher.id },
      select: { id: true },
    }),
    db.timetable.findMany({
      where: { schoolId, teacherId: teacher.id, sectionId: { not: null } },
      select: { sectionId: true },
      distinct: ["sectionId"],
    }),
  ])

  const sectionIds = [
    ...new Set([
      ...homeroomSections.map((s) => s.id),
      ...timetableSections.map((t) => t.sectionId!).filter(Boolean),
    ]),
  ]
  if (sectionIds.length === 0) return []

  const students = await db.student.findMany({
    where: studentWhere(schoolId, userId, search, {
      sectionId: { in: sectionIds },
    }),
    select: studentSelect,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: MAX_CONTACTS_PER_CATEGORY,
  })

  return students.filter((s) => s.user).map((s) => mapStudent(s, "my_students"))
}

async function getClassmatesForStudent(
  schoolId: string,
  userId: string,
  search?: string
): Promise<ContactDTO[]> {
  const student = await db.student.findFirst({
    where: { schoolId, userId },
    select: { sectionId: true },
  })
  if (!student?.sectionId) return []

  const classmates = await db.student.findMany({
    where: studentWhere(schoolId, userId, search, {
      sectionId: student.sectionId,
    }),
    select: studentSelect,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: MAX_CONTACTS_PER_CATEGORY,
  })

  return classmates
    .filter((s) => s.user)
    .map((s) => mapStudent(s, "classmates"))
}

// -- Guardians (relationship) --

async function getGuardiansForTeacher(
  schoolId: string,
  userId: string,
  search?: string
): Promise<ContactDTO[]> {
  const myStudents = await getStudentsForTeacher(schoolId, userId)
  if (myStudents.length === 0) {
    return getMembersByRole(schoolId, userId, "GUARDIAN", "parents", search)
  }

  const studentRecords = await db.student.findMany({
    where: { schoolId, user: { id: { in: myStudents.map((s) => s.id) } } },
    select: { id: true },
  })
  const studentIds = studentRecords.map((s) => s.id)
  if (studentIds.length === 0) {
    return getMembersByRole(schoolId, userId, "GUARDIAN", "parents", search)
  }

  const guardians = await db.guardian.findMany({
    where: guardianWhere(schoolId, userId, search, {
      studentGuardians: { some: { studentId: { in: studentIds } } },
    }),
    select: guardianSelect,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: MAX_CONTACTS_PER_CATEGORY,
  })

  return guardians.filter((g) => g.user).map((g) => mapGuardian(g, "parents"))
}
