/**
 * Profile read layer — the single typed source the profile page renders from.
 *
 * Replaces the old `getProfileBasicData` (which returned `Record<string,unknown>`
 * and only fed the sidebar header) AND the fabricated data that lived inside the
 * client components (hardcoded stats, fake achievements/orgs, mock pinned items).
 *
 * Everything here is REAL, tenant-scoped, and permission-masked:
 *  - identity + role-specific info (section, department, ids)
 *  - real stat counts (subjects, classmates, classes, students, children)
 *  - earned badges (profile_badges, public-filtered for non-owners)
 *  - organization memberships (+ a teacher's department as a derived org)
 *  - pinned items (public-filtered) and recent activity
 *
 * NOT a "use server" module — it is called from the page (a Server Component),
 * so it composes cleanly and can be wrapped in cache() by callers.
 */
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getLabels } from "@/components/translation/person"

import { getPermissionLevel } from "./detail/permissions"
import type { PermissionLevel } from "./detail/types"
import type { ProfileRole } from "./types"

// ============================================================================
// Types
// ============================================================================

export interface ProfileStatValue {
  key: string // dictionary key under profile.stats.*
  value: number
}

export interface ProfileInfoItem {
  icon: string // "org" | "location" | "calendar" | "mail" | "phone"
  value: string
}

export interface ProfileBadgeView {
  id: string
  key: string
  title: string
  description: string | null
  icon: string
  level: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM"
  context: string | null
  earnedAt: string
}

export interface ProfileOrgView {
  id: string
  name: string
  role: string
  type: string
  avatarUrl: string | null
}

export interface ProfilePinnedView {
  id: string
  itemType: string
  itemId: string
  title: string
  description: string | null
  metadata: Record<string, unknown> | null
  isPublic: boolean
  order: number
}

export interface ProfileActivityView {
  id: string
  activityType: string
  title: string
  description: string | null
  createdAt: string
}

export interface ProfileSubjectView {
  id: string
  name: string
}

export interface ProfileClassView {
  id: string
  name: string
  subjectName: string | null
}

export interface ProfileChildView {
  id: string
  name: string
  sectionName: string | null
  photoUrl: string | null
}

export interface ProfileRoleDetail {
  subjects: ProfileSubjectView[] // student
  classes: ProfileClassView[] // teacher
  children: ProfileChildView[] // parent
}

export interface ProfileViewData {
  id: string
  userId: string | null
  role: ProfileRole
  permission: PermissionLevel
  isOwner: boolean
  canEdit: boolean

  firstName: string
  lastName: string
  displayName: string
  handle: string
  photoUrl: string | null
  bio: string | null
  subtitle: string | null

  website: string | null
  timezone: string | null
  pronouns: string | null
  statusEmoji: string | null
  statusMessage: string | null
  socialLinks: Record<string, string> | null
  createdAt: string

  email: string | null // masked for non-privileged viewers
  city: string | null
  sectionName: string | null
  departmentName: string | null
  enrollmentDate: string | null
  joiningDate: string | null

  stats: ProfileStatValue[]
  info: ProfileInfoItem[]
  badges: ProfileBadgeView[]
  organizations: ProfileOrgView[]
  pinned: ProfilePinnedView[]
  recentActivity: ProfileActivityView[]
  roleDetail: ProfileRoleDetail
}

export type ProfileViewResult =
  | { success: true; data: ProfileViewData }
  | { success: false; errorCode: string }

const PRIVILEGED: PermissionLevel[] = ["OWNER", "ADMIN", "STAFF"]

function roleFromUserRole(role: string): ProfileRole {
  switch (role) {
    case "STUDENT":
      return "student"
    case "TEACHER":
      return "teacher"
    case "GUARDIAN":
      return "parent"
    default:
      return "staff"
  }
}

// ============================================================================
// Main read
// ============================================================================

export async function getProfileView(
  targetId: string,
  lang = "ar"
): Promise<ProfileViewResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, errorCode: "NOT_AUTHENTICATED" }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, errorCode: "MISSING_SCHOOL" }
  }

  const displayLang = lang === "en" ? "en" : "ar"

  const user = await db.user.findFirst({
    where: { id: targetId, schoolId },
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      role: true,
      bio: true,
      website: true,
      timezone: true,
      pronouns: true,
      socialLinks: true,
      statusEmoji: true,
      statusMessage: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
          grNumber: true,
          city: true,
          email: true,
          enrollmentDate: true,
          section: {
            select: { name: true, grade: { select: { name: true } } },
          },
          _count: { select: { studentClasses: true } },
        },
      },
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
          employeeId: true,
          emailAddress: true,
          joiningDate: true,
          teacherDepartments: {
            where: { schoolId },
            select: {
              isPrimary: true,
              department: { select: { id: true, departmentName: true } },
            },
          },
          _count: { select: { classes: true } },
        },
      },
      guardian: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          emailAddress: true,
          _count: { select: { studentGuardians: true } },
        },
      },
      staffMember: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
          employeeId: true,
          emailAddress: true,
          joiningDate: true,
          city: true,
        },
      },
    },
  })

  if (user) {
    return buildFromUser(user, session, schoolId, displayLang)
  }

  // Fallback: wizard-created student/teacher with no User row.
  const fallback = await buildFromOrphanEntity(
    targetId,
    session,
    schoolId,
    displayLang
  )
  return fallback ?? { success: false, errorCode: "NOT_FOUND" }
}

// ============================================================================
// Builders
// ============================================================================

async function buildFromUser(
  user: any,
  session: any,
  schoolId: string,
  displayLang: "ar" | "en"
): Promise<ProfileViewResult> {
  const role = roleFromUserRole(user.role)
  const entity =
    user.student || user.teacher || user.guardian || user.staffMember

  const permission = getPermissionLevel({
    viewerId: session.user.id,
    viewerRole: session.user.role ?? null,
    viewerSchoolId: session.user.schoolId ?? null,
    profileUserId: user.id,
    profileSchoolId: schoolId,
    profileType: "USER",
  })
  const isOwner = permission === "OWNER"
  const privileged = PRIVILEGED.includes(permission)

  const firstName: string = entity?.firstName || user.username || ""
  const lastName: string = entity?.lastName || ""
  const photoUrl: string | null =
    user.student?.profilePhotoUrl ??
    user.teacher?.profilePhotoUrl ??
    user.staffMember?.profilePhotoUrl ??
    user.image ??
    null

  const email: string | null = privileged
    ? (user.student?.email ??
      user.teacher?.emailAddress ??
      user.guardian?.emailAddress ??
      user.staffMember?.emailAddress ??
      user.email ??
      null)
    : null

  const departmentName: string | null =
    user.teacher?.teacherDepartments?.find((d: any) => d.isPrimary)?.department
      ?.departmentName ??
    user.teacher?.teacherDepartments?.[0]?.department?.departmentName ??
    null

  const sectionName: string | null = user.student?.section
    ? user.student.section.grade?.name
      ? `${user.student.section.grade.name} · ${user.student.section.name}`
      : user.student.section.name
    : null

  // ---- real stats ----------------------------------------------------------
  const stats: ProfileStatValue[] = []
  if (role === "student" && user.student) {
    stats.push({ key: "subjects", value: user.student._count.studentClasses })
    const classmates = user.student.section
      ? await db.student.count({
          where: {
            schoolId,
            sectionId: { not: null },
            section: { name: user.student.section.name },
          },
        })
      : 0
    if (classmates > 0)
      stats.push({ key: "classmates", value: Math.max(classmates - 1, 0) })
  } else if (role === "teacher" && user.teacher) {
    stats.push({ key: "classes", value: user.teacher._count.classes })
    const students = await db.studentClass.count({
      where: { schoolId, class: { teacherId: user.teacher.id } },
    })
    stats.push({ key: "students", value: students })
  } else if (role === "parent" && user.guardian) {
    stats.push({
      key: "children",
      value: user.guardian._count.studentGuardians,
    })
  }

  const result = await assembleShared({
    schoolId,
    userId: user.id,
    role,
    isOwner,
    privileged,
    displayLang,
    firstName,
    lastName,
    bio: user.bio ?? null,
    photoUrl,
    email,
    city: user.student?.city ?? user.staffMember?.city ?? null,
    sectionName,
    departmentName,
    enrollmentDate: user.student?.enrollmentDate ?? null,
    joiningDate:
      user.teacher?.joiningDate ?? user.staffMember?.joiningDate ?? null,
    createdAt: user.createdAt,
    handleSeed:
      user.student?.grNumber ||
      user.teacher?.employeeId ||
      user.staffMember?.employeeId ||
      user.id,
    website: user.website ?? null,
    timezone: user.timezone ?? null,
    pronouns: user.pronouns ?? null,
    statusEmoji: user.statusEmoji ?? null,
    statusMessage: user.statusMessage ?? null,
    socialLinks: (user.socialLinks as Record<string, string> | null) ?? null,
    permission,
    entityId: entity?.id ?? user.id,
    stats,
  })

  return { success: true, data: result }
}

async function buildFromOrphanEntity(
  targetId: string,
  session: any,
  schoolId: string,
  displayLang: "ar" | "en"
): Promise<ProfileViewResult | null> {
  const student = await db.student.findFirst({
    where: { id: targetId, schoolId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePhotoUrl: true,
      grNumber: true,
      city: true,
      email: true,
      enrollmentDate: true,
      createdAt: true,
      section: { select: { name: true, grade: { select: { name: true } } } },
      _count: { select: { studentClasses: true } },
    },
  })

  const make = async (
    role: ProfileRole,
    e: any,
    extra: Partial<Parameters<typeof assembleShared>[0]>
  ): Promise<ProfileViewResult> => {
    const permission = getPermissionLevel({
      viewerId: session.user.id,
      viewerRole: session.user.role ?? null,
      viewerSchoolId: session.user.schoolId ?? null,
      // Orphan entities have no User, so the viewer can never be the owner.
      profileUserId: e.id,
      profileSchoolId: schoolId,
      profileType: "USER",
    })
    const privileged = PRIVILEGED.includes(permission)
    const data = await assembleShared({
      schoolId,
      userId: null,
      role,
      isOwner: false,
      privileged,
      displayLang,
      firstName: e.firstName || "",
      lastName: e.lastName || "",
      bio: null,
      photoUrl: e.profilePhotoUrl ?? null,
      email: privileged ? (e.email ?? e.emailAddress ?? null) : null,
      city: e.city ?? null,
      createdAt: e.createdAt,
      handleSeed: e.grNumber || e.employeeId || e.id,
      permission,
      entityId: e.id,
      stats: [],
      ...extra,
    })
    return { success: true, data }
  }

  if (student) {
    const sectionName = student.section
      ? student.section.grade?.name
        ? `${student.section.grade.name} · ${student.section.name}`
        : student.section.name
      : null
    return make("student", student, {
      sectionName,
      enrollmentDate: student.enrollmentDate ?? null,
      stats: [{ key: "subjects", value: student._count.studentClasses }],
    })
  }

  const teacher = await db.teacher.findFirst({
    where: { id: targetId, schoolId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePhotoUrl: true,
      employeeId: true,
      emailAddress: true,
      joiningDate: true,
      createdAt: true,
      teacherDepartments: {
        where: { schoolId },
        select: {
          isPrimary: true,
          department: { select: { departmentName: true } },
        },
      },
      _count: { select: { classes: true } },
    },
  })
  if (teacher) {
    const departmentName =
      teacher.teacherDepartments.find((d) => d.isPrimary)?.department
        ?.departmentName ??
      teacher.teacherDepartments[0]?.department?.departmentName ??
      null
    return make("teacher", teacher, {
      departmentName,
      joiningDate: teacher.joiningDate ?? null,
      stats: [{ key: "classes", value: teacher._count.classes }],
    })
  }

  return null
}

// ============================================================================
// Shared assembly (badges, orgs, pinned, activity, translation, info)
// ============================================================================

interface AssembleArgs {
  schoolId: string
  userId: string | null
  role: ProfileRole
  isOwner: boolean
  privileged: boolean
  displayLang: "ar" | "en"
  firstName: string
  lastName: string
  bio: string | null
  photoUrl: string | null
  email: string | null
  city?: string | null
  sectionName?: string | null
  departmentName?: string | null
  enrollmentDate?: Date | null
  joiningDate?: Date | null
  createdAt: Date
  handleSeed: string
  website?: string | null
  timezone?: string | null
  pronouns?: string | null
  statusEmoji?: string | null
  statusMessage?: string | null
  socialLinks?: Record<string, string> | null
  permission: PermissionLevel
  entityId: string
  stats: ProfileStatValue[]
}

async function assembleShared(args: AssembleArgs): Promise<ProfileViewData> {
  const { schoolId, userId, role, isOwner, displayLang } = args

  // Badges, organizations, pinned, activity are keyed by userId. Orphan
  // entities (no User) simply have none.
  const [badgeRows, orgRows, pinnedRows, activityRows] = userId
    ? await Promise.all([
        db.profileBadge.findMany({
          where: {
            schoolId,
            userId,
            ...(isOwner ? {} : { isPublic: true }),
          },
          orderBy: [{ level: "desc" }, { earnedAt: "desc" }],
          take: 12,
        }),
        db.organizationMembership.findMany({
          where: { schoolId, userId },
          orderBy: { joinedAt: "asc" },
          take: 12,
          select: {
            id: true,
            role: true,
            organization: {
              select: { id: true, name: true, type: true, avatarUrl: true },
            },
          },
        }),
        db.pinnedItem.findMany({
          where: {
            schoolId,
            userId,
            ...(isOwner ? {} : { isPublic: true }),
          },
          orderBy: { order: "asc" },
          take: 6,
        }),
        db.userActivity.findMany({
          where: { schoolId, userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ])
    : [[], [], [], []]

  const organizations: ProfileOrgView[] = orgRows.map((m: any) => ({
    id: m.organization.id,
    name: m.organization.name,
    role: m.role,
    type: m.organization.type,
    avatarUrl: m.organization.avatarUrl,
  }))

  // ---- role-detail lists (real, for the role tab) -------------------------
  const roleDetail = await fetchRoleDetail(role, args.entityId, schoolId)

  // A teacher's primary department is a real organization-like membership —
  // surface it even when there's no explicit OrganizationMembership row.
  if (
    role === "teacher" &&
    args.departmentName &&
    !organizations.some((o) => o.name === args.departmentName)
  ) {
    organizations.unshift({
      id: `dept-${args.entityId}`,
      name: args.departmentName,
      role: "member",
      type: "DEPARTMENT",
      avatarUrl: null,
    })
  }

  // ---- translation (batched, cache-backed) --------------------------------
  let firstName = args.firstName
  let bio = args.bio
  if (displayLang !== "ar") {
    const toTranslate = [
      args.firstName,
      args.bio ?? "",
      ...badgeRows.map((b: any) => b.title),
      ...badgeRows.map((b: any) => b.description ?? ""),
      ...organizations.map((o) => o.name),
      ...pinnedRows.map((p: any) => p.title),
    ].filter(Boolean)
    if (toTranslate.length) {
      const map = await getLabels(toTranslate, displayLang, schoolId)
      const tr = (s: string | null) => (s ? (map.get(s) ?? s) : s)
      firstName = tr(args.firstName) ?? args.firstName
      bio = tr(args.bio)
      badgeRows.forEach((b: any) => {
        b.title = tr(b.title) ?? b.title
        b.description = tr(b.description)
      })
      organizations.forEach((o) => {
        o.name = tr(o.name) ?? o.name
      })
      pinnedRows.forEach((p: any) => {
        p.title = tr(p.title) ?? p.title
      })
    }
  }

  const lastName = args.lastName
  const displayName = `${firstName} ${lastName}`.trim() || firstName

  const info: ProfileInfoItem[] = []
  if (args.departmentName)
    info.push({ icon: "org", value: args.departmentName })
  if (args.sectionName) info.push({ icon: "org", value: args.sectionName })
  if (args.email) info.push({ icon: "mail", value: args.email })
  if (args.city) info.push({ icon: "location", value: args.city })

  return {
    id: args.entityId,
    userId,
    role,
    permission: args.permission,
    isOwner,
    canEdit: isOwner,
    firstName,
    lastName,
    displayName,
    handle: args.handleSeed,
    photoUrl: args.photoUrl,
    bio,
    subtitle: args.handleSeed,
    website: args.website ?? null,
    timezone: args.timezone ?? null,
    pronouns: args.pronouns ?? null,
    statusEmoji: args.statusEmoji ?? null,
    statusMessage: args.statusMessage ?? null,
    socialLinks: args.socialLinks ?? null,
    createdAt: args.createdAt.toISOString(),
    email: args.email,
    city: args.city ?? null,
    sectionName: args.sectionName ?? null,
    departmentName: args.departmentName ?? null,
    enrollmentDate: args.enrollmentDate?.toISOString() ?? null,
    joiningDate: args.joiningDate?.toISOString() ?? null,
    stats: args.stats,
    info,
    badges: badgeRows.map((b: any) => ({
      id: b.id,
      key: b.key,
      title: b.title,
      description: b.description,
      icon: b.icon,
      level: b.level,
      context: b.context,
      earnedAt: b.earnedAt.toISOString(),
    })),
    organizations,
    pinned: pinnedRows.map((p: any) => ({
      id: p.id,
      itemType: p.itemType,
      itemId: p.itemId,
      title: p.title,
      description: p.description,
      metadata: (p.metadata as Record<string, unknown> | null) ?? null,
      isPublic: p.isPublic,
      order: p.order,
    })),
    recentActivity: activityRows.map((a: any) => ({
      id: a.id,
      activityType: a.activityType,
      title: a.title,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
    })),
    roleDetail,
  }
}

/**
 * Real role-detail lists used by the role tab (subjects / classes / children).
 * Each is tenant-scoped and capped. entityId is the role-entity id
 * (student.id / teacher.id / guardian.id).
 */
async function fetchRoleDetail(
  role: ProfileRole,
  entityId: string,
  schoolId: string
): Promise<ProfileRoleDetail> {
  const empty: ProfileRoleDetail = { subjects: [], classes: [], children: [] }

  if (role === "student") {
    const rows = await db.studentClass.findMany({
      where: { schoolId, studentId: entityId },
      take: 24,
      select: {
        class: { select: { subject: { select: { id: true, name: true } } } },
      },
    })
    const seen = new Map<string, ProfileSubjectView>()
    for (const r of rows) {
      const s = r.class?.subject
      if (s && !seen.has(s.id)) seen.set(s.id, { id: s.id, name: s.name })
    }
    return { ...empty, subjects: Array.from(seen.values()) }
  }

  if (role === "teacher") {
    const rows = await db.class.findMany({
      where: { schoolId, teacherId: entityId },
      take: 24,
      select: {
        id: true,
        name: true,
        subject: { select: { name: true } },
      },
    })
    return {
      ...empty,
      classes: rows.map((c) => ({
        id: c.id,
        name: c.name,
        subjectName: c.subject?.name ?? null,
      })),
    }
  }

  if (role === "parent") {
    const rows = await db.studentGuardian.findMany({
      where: { schoolId, guardianId: entityId },
      take: 24,
      select: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            section: {
              select: { name: true, grade: { select: { name: true } } },
            },
          },
        },
      },
    })
    return {
      ...empty,
      children: rows
        .filter((r) => r.student)
        .map((r) => {
          const s = r.student!
          const sectionName = s.section
            ? s.section.grade?.name
              ? `${s.section.grade.name} · ${s.section.name}`
              : s.section.name
            : null
          return {
            id: s.id,
            name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
            sectionName,
            photoUrl: s.profilePhotoUrl ?? null,
          }
        }),
    }
  }

  return empty
}
