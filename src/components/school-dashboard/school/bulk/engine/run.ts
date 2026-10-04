// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

import { makeUniqueUsername, mintTempPassword } from "@/lib/credentials"
import { db } from "@/lib/db"
import {
  createOrLinkGuardian,
  guardianTypeNamesForRole,
  type ParentRole,
} from "@/lib/guardian-utils"
import { logger } from "@/lib/logger"
import {
  provisionStudent,
  type ProvisionGuardianInput,
} from "@/lib/student-provisioning"
import { notifyProvisionedStudent } from "@/lib/student-provisioning-notify"
import { detectScript } from "@/components/translation/util"

import type { ImportType } from "../fields"
import { letterFor } from "./normalize"
import type {
  GuardianRec,
  ImportOptions,
  Issue,
  LoginCredential,
  PlannedRow,
  ReissueResult,
  StaffRec,
  StudentRec,
  TeacherRec,
  UndoResult,
} from "./types"

/** A RUNNING batch silent for this long lost its process (deploy, restart). */
export const STALL_MS = 90_000

type Tx = Prisma.TransactionClient

interface RecordInput {
  entity:
    | "student"
    | "teacher"
    | "staff"
    | "guardian"
    | "section"
    | "department"
  entityId: string
  userId?: string | null
  action: "CREATED" | "UPDATED"
  before?: Record<string, unknown>
}

interface Ctx {
  schoolId: string
  batchId: string
  startedAt: Date
  options: ImportOptions
  takenUsernames: Set<string>
  sections: Map<string, string>
  departments: Map<string, string>
  guardianTypes: Map<string, string>
  recordedGuardians: Set<string>
  sectionScript: "ar" | "en"
  academicYear?: string
}

// ---------------------------------------------------------------------------
// Lookups that may create (sections, departments, guardian types)
// ---------------------------------------------------------------------------

async function ensureSection(
  ctx: Ctx,
  gradeId: string,
  letter: number,
  records: RecordInput[]
): Promise<string> {
  const key = `${gradeId}:${letter}`
  const cached = ctx.sections.get(key)
  if (cached) return cached
  const grade = await db.academicGrade.findFirst({
    where: { id: gradeId, schoolId: ctx.schoolId },
    select: { name: true, gradeNumber: true },
  })
  const letterText = letterFor(letter, ctx.sectionScript)
  const name =
    ctx.sectionScript === "ar"
      ? `${grade?.name ?? gradeId} - ${letterText}`
      : `Grade ${grade?.gradeNumber ?? ""}-${letterText}`
  const existing = await db.section.findFirst({
    where: { schoolId: ctx.schoolId, gradeId, letter: letterText },
    select: { id: true },
  })
  const section =
    existing ??
    (await db.section.create({
      data: {
        schoolId: ctx.schoolId,
        gradeId,
        letter: letterText,
        name,
        lang: ctx.sectionScript,
      },
      select: { id: true },
    }))
  if (!existing)
    records.push({ entity: "section", entityId: section.id, action: "CREATED" })
  ctx.sections.set(key, section.id)
  return section.id
}

async function ensureDepartment(
  ctx: Ctx,
  name: string,
  records: RecordInput[]
): Promise<string> {
  const cached = ctx.departments.get(name)
  if (cached) return cached
  const existing = await db.department.findFirst({
    where: { schoolId: ctx.schoolId, departmentName: name },
    select: { id: true },
  })
  const dept =
    existing ??
    (await db.department.create({
      data: {
        schoolId: ctx.schoolId,
        departmentName: name,
        lang: detectScript(name),
      },
      select: { id: true },
    }))
  if (!existing)
    records.push({ entity: "department", entityId: dept.id, action: "CREATED" })
  ctx.departments.set(name, dept.id)
  return dept.id
}

async function guardianTypeId(
  tx: Tx,
  ctx: Ctx,
  relation: GuardianRec["relation"]
): Promise<string> {
  const cached = ctx.guardianTypes.get(relation)
  if (cached) return cached
  const names =
    relation === "guardian"
      ? ["guardian", "Guardian", "ولي الأمر", "ولي امر"]
      : guardianTypeNamesForRole(relation as ParentRole)
  const found = await tx.guardianType.findFirst({
    where: { schoolId: ctx.schoolId, name: { in: names } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
  const type =
    found ??
    (await tx.guardianType.upsert({
      where: { schoolId_name: { schoolId: ctx.schoolId, name: relation } },
      create: { schoolId: ctx.schoolId, name: relation },
      update: {},
      select: { id: true },
    }))
  ctx.guardianTypes.set(relation, type.id)
  return type.id
}

/** A login with no password: it can't be used until logins are issued from
 *  the batch, which is the only moment a password exists in plain text. */
async function createLogin(
  tx: Tx,
  ctx: Ctx,
  role: "TEACHER" | "STAFF" | "GUARDIAN",
  base: string,
  email: string | undefined
): Promise<string> {
  const user = await tx.user.create({
    data: {
      username: makeUniqueUsername(
        base,
        ctx.takenUsernames,
        role === "TEACHER" ? "t" : role === "STAFF" ? "s" : "g"
      ),
      email: email ?? null,
      // The school vouches for the address it imported.
      emailVerified: email ? new Date() : null,
      role,
      schoolId: ctx.schoolId,
      mustChangePassword: true,
    },
    select: { id: true },
  })
  return user.id
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

/** Guardians linked to a student that this batch brought into existence.
 *  Records them once, and gives the ones provisioning left without a login
 *  (no email) a username login. */
async function recordNewGuardians(
  ctx: Ctx,
  studentId: string,
  records: RecordInput[]
) {
  const links = await db.studentGuardian.findMany({
    where: { schoolId: ctx.schoolId, studentId },
    select: {
      guardian: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      },
    },
  })
  for (const { guardian: g } of links) {
    if (ctx.recordedGuardians.has(g.id)) continue
    if (g.createdAt < ctx.startedAt) continue
    let userId = g.userId
    if (!userId) {
      userId = await db.$transaction(async (tx) => {
        const id = await createLogin(
          tx,
          ctx,
          "GUARDIAN",
          `${g.firstName} ${g.lastName}`,
          undefined
        )
        await tx.guardian.update({
          where: { id: g.id },
          data: { userId: id },
        })
        return id
      })
    }
    ctx.recordedGuardians.add(g.id)
    records.push({
      entity: "guardian",
      entityId: g.id,
      userId,
      action: "CREATED",
    })
  }
}

function provisionGuardians(rec: StudentRec): ProvisionGuardianInput[] {
  return rec.guardians.map((g, i) => ({
    typeName: g.relation,
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email ?? null,
    phone: g.phone ?? null,
    occupation: null,
    isPrimary: i === 0,
    createLogin: true,
  }))
}

async function createStudent(
  ctx: Ctx,
  row: PlannedRow,
  rec: StudentRec,
  records: RecordInput[],
  issues: Issue[]
) {
  const sectionId = rec.newSection
    ? await ensureSection(
        ctx,
        rec.newSection.gradeId,
        rec.newSection.letter,
        records
      )
    : rec.sectionId

  const res = await db.$transaction(
    async (tx) => {
      const out = await provisionStudent(
        {
          schoolId: ctx.schoolId,
          firstName: rec.firstName,
          middleName: rec.middleName ?? null,
          lastName: rec.lastName,
          dateOfBirth: rec.dateOfBirth ? new Date(rec.dateOfBirth) : null,
          gender:
            rec.gender === "male"
              ? "MALE"
              : rec.gender === "female"
                ? "FEMALE"
                : undefined,
          email: rec.email ?? null,
          phone: rec.phone ?? null,
          academicGradeId: rec.gradeId ?? null,
          sectionId: sectionId ?? null,
          applyingForClass: rec.gradeLabel ?? undefined,
          academicYear: ctx.academicYear,
          admissionNumber: rec.admissionNumber ?? undefined,
          lang: detectScript(`${rec.firstName} ${rec.lastName}`),
          guardians: provisionGuardians(rec),
        },
        { notify: false, credentialDelivery: "none", origin: "BULK_IMPORT" },
        tx
      )
      // Student.gender is free text; the Application only takes the enum.
      await tx.student.update({
        where: { id: out.studentId },
        data: { gender: rec.gender ?? "other" },
      })
      await tx.user.update({
        where: { id: out.userId },
        data: { mustChangePassword: true },
      })
      return out
    },
    { timeout: 30_000 }
  )

  records.push({
    entity: "student",
    entityId: res.studentId,
    userId: res.userId,
    action: "CREATED",
  })
  await recordNewGuardians(ctx, res.studentId, records)

  for (const w of res.warnings) {
    const code =
      w.code === "NO_FEE_STRUCTURE_MATCH"
        ? "NO_FEE_STRUCTURE"
        : w.code === "FEES_SKIPPED_NO_GRADE"
          ? "NO_GRADE_NO_FEES"
          : w.code === "GUARDIAN_CREATE_FAILED"
            ? "GUARDIAN_FAILED"
            : "FEES_FAILED"
    issues.push({ row: row.row, code, level: "warning" })
  }

  if (ctx.options.notifyFamilies) {
    await notifyProvisionedStudent({
      schoolId: ctx.schoolId,
      studentId: res.studentId,
      userId: res.userId,
      origin: "BULK_IMPORT",
      studentName: `${rec.firstName} ${rec.lastName}`.trim(),
      email: rec.email ?? null,
      isNewUser: res.isNewUser,
      delivery: "queue",
    }).catch((err) =>
      logger.error(
        "bulk import: family notification failed",
        err instanceof Error ? err : new Error(String(err)),
        { action: "bulk_import_notify", schoolId: ctx.schoolId }
      )
    )
  }
}

async function updateStudent(
  ctx: Ctx,
  row: PlannedRow,
  rec: StudentRec,
  records: RecordInput[]
) {
  const patch = { ...(row.patch ?? {}) }
  if (rec.newSection)
    patch.sectionId = await ensureSection(
      ctx,
      rec.newSection.gradeId,
      rec.newSection.letter,
      records
    )
  if (typeof patch.dateOfBirth === "string")
    patch.dateOfBirth = new Date(patch.dateOfBirth)

  await db.$transaction(async (tx) => {
    if (Object.keys(patch).length)
      await tx.student.update({
        where: { id: row.matchId!, schoolId: ctx.schoolId },
        data: patch,
      })
    if (rec.guardians.length) {
      for (const g of provisionGuardians(rec))
        await createOrLinkGuardian(tx, {
          ...g,
          email: g.email ?? null,
          phone: g.phone ?? null,
          occupation: null,
          schoolId: ctx.schoolId,
          studentId: row.matchId!,
          isPrimary: false,
        })
    }
  })

  records.push({
    entity: "student",
    entityId: row.matchId!,
    action: "UPDATED",
    before: row.before,
  })
  await recordNewGuardians(ctx, row.matchId!, records)
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

async function createTeacher(
  ctx: Ctx,
  rec: TeacherRec,
  records: RecordInput[]
) {
  const departmentId = rec.newDepartment
    ? await ensureDepartment(ctx, rec.newDepartment, records)
    : rec.departmentId
  const name = `${rec.firstName} ${rec.lastName}`.trim()

  const out = await db.$transaction(async (tx) => {
    const userId = await createLogin(
      tx,
      ctx,
      "TEACHER",
      rec.employeeId || rec.email?.split("@")[0] || name,
      rec.email
    )
    const teacher = await tx.teacher.create({
      data: {
        schoolId: ctx.schoolId,
        userId,
        employeeId: rec.employeeId ?? null,
        firstName: rec.firstName,
        lastName: rec.lastName,
        emailAddress: rec.email ?? null,
        gender: rec.gender ?? null,
        lang: detectScript(name),
        // Without any way to reach them the profile is still incomplete.
        wizardStep: rec.email || rec.phone ? null : "contact",
      },
      select: { id: true },
    })
    if (rec.phone)
      await tx.teacherPhoneNumber.create({
        data: {
          schoolId: ctx.schoolId,
          teacherId: teacher.id,
          phoneNumber: rec.phone,
          isPrimary: true,
        },
      })
    if (departmentId)
      await tx.teacherDepartment.create({
        data: {
          schoolId: ctx.schoolId,
          teacherId: teacher.id,
          departmentId,
          isPrimary: true,
        },
      })
    if (rec.subjectIds.length)
      await tx.teacherSubjectExpertise.createMany({
        data: rec.subjectIds.map((subjectId, i) => ({
          schoolId: ctx.schoolId,
          teacherId: teacher.id,
          subjectId,
          expertiseLevel: i === 0 ? "PRIMARY" : "SECONDARY",
        })),
        skipDuplicates: true,
      })
    return { teacherId: teacher.id, userId }
  })
  records.push({
    entity: "teacher",
    entityId: out.teacherId,
    userId: out.userId,
    action: "CREATED",
  })
}

async function updateTeacher(
  ctx: Ctx,
  row: PlannedRow,
  rec: TeacherRec,
  records: RecordInput[]
) {
  const teacherId = row.matchId!
  const departmentId = rec.newDepartment
    ? await ensureDepartment(ctx, rec.newDepartment, records)
    : rec.departmentId

  await db.$transaction(async (tx) => {
    if (row.patch && Object.keys(row.patch).length)
      await tx.teacher.update({
        where: { id: teacherId, schoolId: ctx.schoolId },
        data: row.patch,
      })
    if (rec.phone) {
      const has = await tx.teacherPhoneNumber.findFirst({
        where: { schoolId: ctx.schoolId, teacherId, phoneNumber: rec.phone },
        select: { id: true },
      })
      if (!has)
        await tx.teacherPhoneNumber.create({
          data: {
            schoolId: ctx.schoolId,
            teacherId,
            phoneNumber: rec.phone,
            isPrimary: false,
          },
        })
    }
    if (departmentId) {
      const has = await tx.teacherDepartment.findFirst({
        where: { schoolId: ctx.schoolId, teacherId, departmentId },
        select: { id: true },
      })
      if (!has)
        await tx.teacherDepartment.create({
          data: { schoolId: ctx.schoolId, teacherId, departmentId },
        })
    }
    if (rec.subjectIds.length)
      await tx.teacherSubjectExpertise.createMany({
        data: rec.subjectIds.map((subjectId) => ({
          schoolId: ctx.schoolId,
          teacherId,
          subjectId,
          expertiseLevel: "SECONDARY",
        })),
        skipDuplicates: true,
      })
  })
  records.push({
    entity: "teacher",
    entityId: teacherId,
    action: "UPDATED",
    before: row.before,
  })
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

async function createStaff(ctx: Ctx, rec: StaffRec, records: RecordInput[]) {
  const departmentId = rec.newDepartment
    ? await ensureDepartment(ctx, rec.newDepartment, records)
    : rec.departmentId
  const name = `${rec.firstName} ${rec.lastName}`.trim()

  const out = await db.$transaction(async (tx) => {
    const userId = await createLogin(
      tx,
      ctx,
      "STAFF",
      rec.employeeId || rec.email?.split("@")[0] || name,
      rec.email
    )
    const staff = await tx.staffMember.create({
      data: {
        schoolId: ctx.schoolId,
        userId,
        employeeId: rec.employeeId ?? null,
        firstName: rec.firstName,
        lastName: rec.lastName,
        emailAddress: rec.email ?? null,
        gender: rec.gender ?? null,
        position: rec.position ?? null,
        departmentId: departmentId ?? null,
        employmentType: rec.employmentType ?? "FULL_TIME",
        phoneNumber: rec.phone ?? null,
      },
      select: { id: true },
    })
    if (rec.phone)
      await tx.staffPhoneNumber.create({
        data: {
          schoolId: ctx.schoolId,
          staffMemberId: staff.id,
          phoneNumber: rec.phone,
          isPrimary: true,
        },
      })
    return { staffId: staff.id, userId }
  })
  records.push({
    entity: "staff",
    entityId: out.staffId,
    userId: out.userId,
    action: "CREATED",
  })
}

async function updateStaff(
  ctx: Ctx,
  row: PlannedRow,
  rec: StaffRec,
  records: RecordInput[]
) {
  const patch = { ...(row.patch ?? {}) }
  const before = { ...(row.before ?? {}) }
  if (rec.newDepartment) {
    patch.departmentId = await ensureDepartment(ctx, rec.newDepartment, records)
    before.departmentId ??= null
  }
  await db.staffMember.update({
    where: { id: row.matchId!, schoolId: ctx.schoolId },
    data: patch,
  })
  records.push({
    entity: "staff",
    entityId: row.matchId!,
    action: "UPDATED",
    before,
  })
}

// ---------------------------------------------------------------------------
// Guardians
// ---------------------------------------------------------------------------

async function linkStudents(
  tx: Tx,
  ctx: Ctx,
  guardianId: string,
  rec: GuardianRec
) {
  if (!rec.studentIds.length) return
  const typeId = await guardianTypeId(tx, ctx, rec.relation)
  for (const studentId of rec.studentIds) {
    const hasPrimary = await tx.studentGuardian.findFirst({
      where: { schoolId: ctx.schoolId, studentId, isPrimary: true },
      select: { id: true },
    })
    await tx.studentGuardian.upsert({
      where: {
        schoolId_studentId_guardianId: {
          schoolId: ctx.schoolId,
          studentId,
          guardianId,
        },
      },
      create: {
        schoolId: ctx.schoolId,
        studentId,
        guardianId,
        guardianTypeId: typeId,
        isPrimary: !hasPrimary,
      },
      update: {},
    })
  }
}

async function createGuardian(
  ctx: Ctx,
  rec: GuardianRec,
  records: RecordInput[]
) {
  const name = `${rec.firstName} ${rec.lastName}`.trim()
  const out = await db.$transaction(async (tx) => {
    const userId = await createLogin(
      tx,
      ctx,
      "GUARDIAN",
      rec.email?.split("@")[0] || name,
      rec.email
    )
    const guardian = await tx.guardian.create({
      data: {
        schoolId: ctx.schoolId,
        userId,
        firstName: rec.firstName,
        lastName: rec.lastName,
        emailAddress: rec.email ?? null,
        lang: detectScript(name),
      },
      select: { id: true },
    })
    if (rec.phone)
      await tx.guardianPhoneNumber.create({
        data: {
          schoolId: ctx.schoolId,
          guardianId: guardian.id,
          phoneNumber: rec.phone,
          isPrimary: true,
        },
      })
    await linkStudents(tx, ctx, guardian.id, rec)
    return { guardianId: guardian.id, userId }
  })
  ctx.recordedGuardians.add(out.guardianId)
  records.push({
    entity: "guardian",
    entityId: out.guardianId,
    userId: out.userId,
    action: "CREATED",
  })
}

async function updateGuardian(
  ctx: Ctx,
  row: PlannedRow,
  rec: GuardianRec,
  records: RecordInput[]
) {
  const guardianId = row.matchId!
  await db.$transaction(async (tx) => {
    if (row.patch && Object.keys(row.patch).length)
      await tx.guardian.update({
        where: { id: guardianId, schoolId: ctx.schoolId },
        data: row.patch,
      })
    if (rec.phone)
      await tx.guardianPhoneNumber.upsert({
        where: {
          schoolId_guardianId_phoneNumber: {
            schoolId: ctx.schoolId,
            guardianId,
            phoneNumber: rec.phone,
          },
        },
        create: {
          schoolId: ctx.schoolId,
          guardianId,
          phoneNumber: rec.phone,
          isPrimary: false,
        },
        update: {},
      })
    await linkStudents(tx, ctx, guardianId, rec)
  })
  records.push({
    entity: "guardian",
    entityId: guardianId,
    action: "UPDATED",
    before: row.before,
  })
}

// ---------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------

async function executeRow(
  ctx: Ctx,
  row: PlannedRow,
  records: RecordInput[],
  issues: Issue[]
) {
  const rec = row.rec!
  const create = row.action === "create"
  switch (rec.kind) {
    case "students":
      return create
        ? createStudent(ctx, row, rec, records, issues)
        : updateStudent(ctx, row, rec, records)
    case "teachers":
      return create
        ? createTeacher(ctx, rec, records)
        : updateTeacher(ctx, row, rec, records)
    case "staff":
      return create
        ? createStaff(ctx, rec, records)
        : updateStaff(ctx, row, rec, records)
    case "guardians":
      return create
        ? createGuardian(ctx, rec, records)
        : updateGuardian(ctx, row, rec, records)
  }
}

/**
 * Was this CREATE row already written by an earlier, interrupted run? Looks
 * for the person by the same keys the planner matches on, created since the
 * batch started. Records it when found.
 */
async function findWritten(
  ctx: Ctx,
  row: PlannedRow,
  records: RecordInput[]
): Promise<boolean> {
  if (row.action !== "create" || !row.rec) return false
  const rec = row.rec
  const since = { gte: ctx.startedAt }
  const base = { schoolId: ctx.schoolId, createdAt: since }
  const nameMatch = { firstName: rec.firstName, lastName: rec.lastName }
  let hit: { id: string; userId: string | null } | null = null
  const select = { id: true, userId: true } as const
  switch (rec.kind) {
    case "students":
      hit = await db.student.findFirst({
        where: {
          ...base,
          ...(rec.admissionNumber
            ? { admissionNumber: rec.admissionNumber }
            : rec.email
              ? { email: rec.email }
              : nameMatch),
        },
        select,
      })
      break
    case "teachers":
      hit = await db.teacher.findFirst({
        where: {
          ...base,
          ...(rec.employeeId
            ? { employeeId: rec.employeeId }
            : rec.email
              ? { emailAddress: rec.email }
              : nameMatch),
        },
        select,
      })
      break
    case "staff":
      hit = await db.staffMember.findFirst({
        where: {
          ...base,
          ...(rec.employeeId
            ? { employeeId: rec.employeeId }
            : rec.email
              ? { emailAddress: rec.email }
              : nameMatch),
        },
        select,
      })
      break
    case "guardians":
      hit = await db.guardian.findFirst({
        where: {
          ...base,
          ...(rec.email ? { emailAddress: rec.email } : nameMatch),
        },
        select,
      })
      break
  }
  if (!hit) return false
  const already = await db.importBatchRecord.count({
    where: { batchId: ctx.batchId, entityId: hit.id },
  })
  if (already === 0)
    records.push({
      entity:
        rec.kind === "students"
          ? "student"
          : rec.kind === "teachers"
            ? "teacher"
            : rec.kind === "staff"
              ? "staff"
              : "guardian",
      entityId: hit.id,
      userId: hit.userId,
      action: "CREATED",
    })
  if (rec.kind === "students") await recordNewGuardians(ctx, hit.id, records)
  return true
}

const ENTITY_OF: Record<ImportType, string> = {
  students: "student",
  teachers: "teacher",
  staff: "staff",
  guardians: "guardian",
}

const LISTING_PATH: Record<ImportType, string> = {
  students: "students",
  teachers: "teachers",
  staff: "staff",
  guardians: "parents",
}

function revalidate(type: ImportType) {
  try {
    revalidatePath(`/[lang]/s/[subdomain]/${LISTING_PATH[type]}`, "page")
    revalidatePath("/[lang]/s/[subdomain]/school/bulk", "page")
    if (type === "students")
      revalidatePath("/[lang]/s/[subdomain]/admission/applications", "page")
  } catch {
    // Outside a request scope (a resumed run) — the listings revalidate on
    // their own next visit.
  }
}

/**
 * Execute a batch's remaining rows. Safe to call twice: only one caller can
 * claim a batch (PENDING, or RUNNING but stalled), and it starts from the
 * first row the last run did not finish.
 */
export async function runBatch(batchId: string): Promise<void> {
  const stalledBefore = new Date(Date.now() - STALL_MS)
  const claim = await db.importBatch.updateMany({
    where: {
      id: batchId,
      OR: [
        { status: "PENDING" },
        { status: "RUNNING", updatedAt: { lt: stalledBefore } },
      ],
    },
    data: { status: "RUNNING" },
  })
  if (claim.count === 0) return

  const batch = await db.importBatch.findUniqueOrThrow({
    where: { id: batchId },
  })
  const startedAt = batch.startedAt ?? new Date()
  if (!batch.startedAt)
    await db.importBatch.update({
      where: { id: batchId },
      data: { startedAt },
    })

  const rows = ((batch.payload as unknown as PlannedRow[] | null) ?? []).filter(
    (r) => r.action === "create" || r.action === "update"
  )
  const issues = (batch.issues as unknown as Issue[] | null) ?? []
  const schoolId = batch.schoolId

  const [users, sectionLetters, recorded, schoolYear] = await Promise.all([
    db.user.findMany({
      where: { schoolId, username: { not: null } },
      select: { username: true },
    }),
    db.section.findMany({ where: { schoolId }, select: { letter: true } }),
    db.importBatchRecord.findMany({
      where: { batchId, entity: "guardian" },
      select: { entityId: true },
    }),
    db.schoolYear.findFirst({
      where: { schoolId },
      orderBy: { startDate: "desc" },
      select: { yearName: true },
    }),
  ])

  const ctx: Ctx = {
    schoolId,
    batchId,
    startedAt: new Date(startedAt.getTime() - 1000),
    options: batch.options as unknown as ImportOptions,
    takenUsernames: new Set(users.map((u) => u.username!)),
    sections: new Map(),
    departments: new Map(),
    guardianTypes: new Map(),
    recordedGuardians: new Set(recorded.map((r) => r.entityId)),
    // New sections follow the school's existing naming; Arabic by default.
    sectionScript:
      sectionLetters.length &&
      sectionLetters.every((s) => /^[A-Za-z]/.test(s.letter))
        ? "en"
        : "ar",
    academicYear: schoolYear?.yearName ?? undefined,
  }

  let { processed, created, updated, failed } = batch
  const resumeAt = processed > 0 ? processed : -1

  for (let i = processed; i < rows.length; i++) {
    const row = rows[i]
    const records: RecordInput[] = []
    try {
      // The row in flight when the last process died may have been written
      // without the counter moving — don't write it twice.
      const written =
        i === resumeAt ? await findWritten(ctx, row, records) : false
      if (!written) await executeRow(ctx, row, records, issues)
      if (row.action === "create") created++
      else updated++
    } catch (error) {
      failed++
      issues.push({
        row: row.row,
        code: "ROW_FAILED",
        level: "error",
        params: {
          message: (error instanceof Error ? error.message : String(error))
            .split("\n")
            .filter(Boolean)
            .pop()!
            .slice(0, 200),
        },
      })
      logger.error(
        "bulk import row failed",
        error instanceof Error ? error : new Error(String(error)),
        { action: "bulk_import_row", schoolId, batchId, row: row.row }
      )
    }
    if (records.length)
      await db.importBatchRecord.createMany({
        data: records.map((r) => ({
          schoolId,
          batchId,
          row: row.row,
          entity: r.entity,
          entityId: r.entityId,
          userId: r.userId ?? null,
          action: r.action,
          before: (r.before as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        })),
      })
    processed = i + 1
    const last = processed === rows.length
    await db.importBatch.update({
      where: { id: batchId },
      data: {
        processed,
        created,
        updated,
        failed,
        ...(last || processed % 25 === 0
          ? { issues: issues as unknown as Prisma.InputJsonValue }
          : {}),
      },
    })
  }

  // Final counts from what was actually recorded — exact even when a resumed
  // run re-met a row the interrupted one had already written.
  const entity = ENTITY_OF[batch.type as ImportType]
  const [createdCount, updatedCount] = await Promise.all([
    db.importBatchRecord.count({
      where: { batchId, entity, action: "CREATED" },
    }),
    db.importBatchRecord.count({
      where: { batchId, entity, action: "UPDATED" },
    }),
  ])

  await db.importBatch.update({
    where: { id: batchId },
    data: {
      status: "DONE",
      created: createdCount,
      updated: updatedCount,
      payload: Prisma.DbNull,
      issues: issues as unknown as Prisma.InputJsonValue,
      finishedAt: new Date(),
    },
  })
  revalidate(batch.type as ImportType)
}

// ---------------------------------------------------------------------------
// Logins
// ---------------------------------------------------------------------------

const ROLE_OF: Record<string, string> = {
  student: "STUDENT",
  teacher: "TEACHER",
  staff: "STAFF",
  guardian: "GUARDIAN",
}

async function namesFor(
  schoolId: string,
  ids: Record<string, string[]>
): Promise<Map<string, string>> {
  const pick = (r: { id: string; firstName: string; lastName: string }) =>
    [r.id, `${r.firstName} ${r.lastName}`.trim()] as const
  const select = { id: true, firstName: true, lastName: true } as const
  const [s, t, st, g] = await Promise.all([
    db.student.findMany({
      where: { schoolId, id: { in: ids.student ?? [] } },
      select,
    }),
    db.teacher.findMany({
      where: { schoolId, id: { in: ids.teacher ?? [] } },
      select,
    }),
    db.staffMember.findMany({
      where: { schoolId, id: { in: ids.staff ?? [] } },
      select,
    }),
    db.guardian.findMany({
      where: { schoolId, id: { in: ids.guardian ?? [] } },
      select,
    }),
  ])
  return new Map([...s, ...t, ...st, ...g].map(pick))
}

/**
 * Fresh passwords for every account the batch created whose owner has not
 * signed in yet. Each call replaces the previous ones — passwords are never
 * stored, so this is the only way to hand them out again.
 */
export async function reissueLogins(
  schoolId: string,
  batchId: string
): Promise<ReissueResult> {
  const records = await db.importBatchRecord.findMany({
    where: { schoolId, batchId, action: "CREATED", userId: { not: null } },
    orderBy: { row: "asc" },
    select: { entity: true, entityId: true, userId: true },
  })
  const users = await db.user.findMany({
    where: { schoolId, id: { in: records.map((r) => r.userId!) } },
    select: { id: true, username: true, email: true, passwordChangedAt: true },
  })
  const userById = new Map(users.map((u) => [u.id, u]))
  const ids: Record<string, string[]> = {}
  for (const r of records) (ids[r.entity] ??= []).push(r.entityId)
  const names = await namesFor(schoolId, ids)

  const credentials: LoginCredential[] = []
  let active = 0
  for (const r of records) {
    const user = userById.get(r.userId!)
    if (!user) continue
    if (user.passwordChangedAt) {
      active++
      continue
    }
    const { plain, hashed } = await mintTempPassword(8)
    await db.user.update({
      where: { id: user.id },
      data: { password: hashed, mustChangePassword: true },
    })
    // Email-only accounts sign in with their email.
    credentials.push({
      name: names.get(r.entityId) ?? "",
      role: ROLE_OF[r.entity] ?? r.entity,
      username: user.username ?? user.email ?? "",
      email: user.email && !user.email.endsWith(".local") ? user.email : null,
      password: plain,
    })
  }
  return { credentials, active }
}

/** Accounts per batch that have never signed in. */
export async function pendingLoginCounts(
  schoolId: string,
  batchIds: string[]
): Promise<Map<string, number>> {
  const records = await db.importBatchRecord.findMany({
    where: {
      schoolId,
      batchId: { in: batchIds },
      action: "CREATED",
      userId: { not: null },
    },
    select: { batchId: true, userId: true },
  })
  const pending = new Set(
    (
      await db.user.findMany({
        where: {
          schoolId,
          id: { in: records.map((r) => r.userId!) },
          passwordChangedAt: null,
        },
        select: { id: true },
      })
    ).map((u) => u.id)
  )
  const out = new Map<string, number>()
  for (const r of records)
    if (pending.has(r.userId!))
      out.set(r.batchId, (out.get(r.batchId) ?? 0) + 1)
  return out
}

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------

const RESTORE_DATES = new Set(["dateOfBirth"])

/**
 * Reverse a batch: restore what it updated, delete what it created — unless
 * someone has started using it (signed in, or a guardian still linked to a
 * child this batch did not create). Those are kept and counted.
 */
export async function undoBatch(
  schoolId: string,
  batchId: string
): Promise<UndoResult> {
  const records = await db.importBatchRecord.findMany({
    where: { schoolId, batchId },
    orderBy: { createdAt: "desc" },
  })
  const result: UndoResult = { removed: 0, restored: 0, kept: 0 }

  const activeUsers = new Set(
    (
      await db.user.findMany({
        where: {
          schoolId,
          id: { in: records.filter((r) => r.userId).map((r) => r.userId!) },
          passwordChangedAt: { not: null },
        },
        select: { id: true },
      })
    ).map((u) => u.id)
  )

  // People first, guardians after their children are gone, then the
  // sections and departments the batch created for them.
  const order = [
    "student",
    "teacher",
    "staff",
    "guardian",
    "section",
    "department",
  ]
  records.sort((a, b) => order.indexOf(a.entity) - order.indexOf(b.entity))

  for (const r of records) {
    try {
      if (r.action === "UPDATED") {
        const before = (r.before as Record<string, unknown> | null) ?? {}
        const data: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(before))
          data[k] =
            RESTORE_DATES.has(k) && typeof v === "string" ? new Date(v) : v
        if (Object.keys(data).length) {
          const where = { id: r.entityId, schoolId }
          if (r.entity === "student") await db.student.update({ where, data })
          else if (r.entity === "teacher")
            await db.teacher.update({ where, data })
          else if (r.entity === "staff")
            await db.staffMember.update({ where, data })
          else if (r.entity === "guardian")
            await db.guardian.update({ where, data })
        }
        result.restored++
        continue
      }

      if (r.userId && activeUsers.has(r.userId)) {
        result.kept++
        continue
      }

      const removed = await db.$transaction(async (tx) => {
        const where = { id: r.entityId, schoolId }
        switch (r.entity) {
          case "student": {
            const s = await tx.student.findFirst({
              where,
              select: { applicationId: true },
            })
            if (!s) return true
            await tx.student.delete({ where })
            if (s.applicationId)
              await tx.application.deleteMany({
                where: { id: s.applicationId, schoolId },
              })
            break
          }
          case "teacher":
            await tx.teacher.deleteMany({ where })
            break
          case "staff":
            await tx.staffMember.deleteMany({ where })
            break
          case "guardian": {
            const links = await tx.studentGuardian.count({
              where: { schoolId, guardianId: r.entityId },
            })
            if (links > 0) return false
            await tx.guardian.deleteMany({ where })
            break
          }
          case "section": {
            const used = await tx.student.count({
              where: { schoolId, sectionId: r.entityId },
            })
            if (used > 0) return false
            await tx.section.deleteMany({ where })
            return true
          }
          case "department": {
            const [t, s] = await Promise.all([
              tx.teacherDepartment.count({
                where: { schoolId, departmentId: r.entityId },
              }),
              tx.staffMember.count({
                where: { schoolId, departmentId: r.entityId },
              }),
            ])
            if (t + s > 0) return false
            await tx.department.deleteMany({ where })
            return true
          }
        }
        if (r.userId)
          await tx.user.deleteMany({ where: { id: r.userId, schoolId } })
        return true
      })
      if (removed) result.removed++
      else result.kept++
    } catch (error) {
      result.kept++
      logger.error(
        "bulk import undo: record kept",
        error instanceof Error ? error : new Error(String(error)),
        { action: "bulk_import_undo", schoolId, batchId, entity: r.entity }
      )
    }
  }

  await db.importBatch.update({
    where: { id: batchId },
    data: { status: "UNDONE", undoneAt: new Date() },
  })
  return result
}
