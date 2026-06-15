// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Profile extras seed — organizations, memberships, and earned badges.
 *
 * Gives demo profiles REAL, DB-backed organizations + badges (replacing the
 * old hardcoded "Chess Club" / "Student of the Year" mock data baked into the
 * profile UI). Fully idempotent:
 *  - organizations are matched by (schoolId, name)
 *  - memberships upsert by the (organizationId, userId) unique key
 *  - badges are reconciled by recomputeProfileBadges (idempotent per user)
 */

import type { PrismaClient, UserRole } from "@prisma/client"

import { recomputeProfileBadges } from "@/components/school-dashboard/profile/badges"

import { logSuccess } from "./utils"

const ORGS: Array<{
  name: string
  type: "CLUB" | "COMMITTEE" | "TEAM" | "ASSOCIATION"
  description: string
}> = [
  { name: "نادي العلوم", type: "CLUB", description: "نادي العلوم والابتكار" },
  {
    name: "مجلس الطلاب",
    type: "COMMITTEE",
    description: "مجلس الطلاب المنتخب",
  },
  {
    name: "فريق كرة القدم",
    type: "TEAM",
    description: "فريق المدرسة لكرة القدم",
  },
  {
    name: "رابطة أولياء الأمور",
    type: "ASSOCIATION",
    description: "رابطة أولياء الأمور والمعلمين",
  },
]

function toProfileRole(
  role: UserRole
): "student" | "teacher" | "parent" | "staff" | null {
  switch (role) {
    case "STUDENT":
      return "student"
    case "TEACHER":
      return "teacher"
    case "GUARDIAN":
      return "parent"
    case "STAFF":
    case "ADMIN":
    case "ACCOUNTANT":
      return "staff"
    default:
      return null
  }
}

export async function seedProfileExtras(
  prisma: PrismaClient,
  schoolId: string
): Promise<void> {
  // 1) Organizations (idempotent by name) ------------------------------------
  const orgIds: string[] = []
  for (const org of ORGS) {
    let existing = await prisma.organization.findFirst({
      where: { schoolId, name: org.name },
      select: { id: true },
    })
    if (!existing) {
      existing = await prisma.organization.create({
        data: {
          schoolId,
          name: org.name,
          type: org.type,
          description: org.description,
          lang: "ar",
        },
        select: { id: true },
      })
    }
    orgIds.push(existing.id)
  }

  // 2) Memberships (upsert by (organizationId,userId)) -----------------------
  const users = await prisma.user.findMany({
    where: { schoolId },
    select: { id: true, role: true },
  })
  const students = users.filter((u) => u.role === "STUDENT").slice(0, 40)
  const teachers = users.filter((u) => u.role === "TEACHER").slice(0, 20)
  const guardians = users.filter((u) => u.role === "GUARDIAN").slice(0, 20)
  const staff = users.filter((u) =>
    ["STAFF", "ADMIN", "ACCOUNTANT"].includes(u.role)
  )

  const [scienceClub, studentCouncil, footballTeam, parentAssoc] = orgIds

  const memberships: Array<{
    organizationId: string
    userId: string
    role: string
  }> = []
  students.forEach((s, i) => {
    memberships.push({
      organizationId: i % 2 === 0 ? scienceClub : footballTeam,
      userId: s.id,
      role: "member",
    })
    if (i < 5)
      memberships.push({
        organizationId: studentCouncil,
        userId: s.id,
        role: i === 0 ? "president" : "member",
      })
  })
  teachers.forEach((t, i) =>
    memberships.push({
      organizationId: i % 2 === 0 ? scienceClub : studentCouncil,
      userId: t.id,
      role: i === 0 ? "coordinator" : "member",
    })
  )
  guardians.forEach((g) =>
    memberships.push({
      organizationId: parentAssoc,
      userId: g.id,
      role: "member",
    })
  )
  staff.forEach((s) =>
    memberships.push({
      organizationId: studentCouncil,
      userId: s.id,
      role: "secretary",
    })
  )

  for (const m of memberships) {
    await prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: m.organizationId,
          userId: m.userId,
        },
      },
      create: { schoolId, ...m },
      update: { role: m.role },
    })
  }

  // 3) Badges — recompute from real signals for every user -------------------
  let badged = 0
  for (const u of users) {
    const role = toProfileRole(u.role)
    if (!role) continue
    const { awarded } = await recomputeProfileBadges(u.id, schoolId, role, "ar")
    if (awarded > 0) badged++
  }

  logSuccess(
    "Profile extras",
    orgIds.length + memberships.length,
    `${orgIds.length} orgs, ${memberships.length} memberships, ${badged}/${users.length} users earned ≥1 badge`
  )
}
