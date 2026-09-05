// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Shared guardian creation/linking utilities.
 * Used by: admission enrollment, student wizard, CSV import.
 */

import type { PrismaClient } from "@prisma/client"

import { mintTempPassword, sanitizeUsername } from "@/lib/credentials"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuardianEntry {
  typeName: string // "father", "mother", "guardian", etc.
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  /**
   * WhatsApp number, stored as a second `GuardianPhoneNumber` row with
   * `phoneType: "whatsapp"` — the shape the admin wizard has always written.
   * The public application has no column for it and captured it in the
   * `*Email` fields; `confirmEnrollment` classifies those and routes a phone
   * number here instead of into `Guardian.emailAddress`.
   */
  whatsapp?: string | null
  occupation: string | null
  isPrimary: boolean
}

export interface GuardianFullNameEntry {
  typeName: string
  fullName: string
  email: string | null
  phone: string | null
  whatsapp?: string | null
  occupation: string | null
  isPrimary: boolean
}

interface CreateOrLinkResult {
  guardianId: string
  guardianTypeId: string
  studentGuardianId: string
  /** Set only when `createLogin` was requested AND a brand-new guardian User
   *  was minted (so the caller can surface the plaintext once). Null otherwise. */
  credentials: { username: string; password: string } | null
}

// Prisma transaction client type
type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

// ---------------------------------------------------------------------------
// Guardian roles
// ---------------------------------------------------------------------------

export type ParentRole = "father" | "mother"

// Every spelling the two parent roles are stored under. The seed writes the
// demo school's types in Arabic ("الأب"/"الأم"), the Al-Qabas / Aldar seeds
// capitalise ("Father"), and the wizard and admission create lowercase
// English. Anything that decides "does this student have a parent" or "which
// tab does this guardian belong to" must go through these, never a literal.
const FATHER_TYPE_NAMES = ["father", "Father", "FATHER", "الأب", "أب", "الوالد", "والد"] as const
const MOTHER_TYPE_NAMES = ["mother", "Mother", "MOTHER", "الأم", "أم", "الوالدة", "والدة"] as const

/** Stored names for one parent role — for `name: { in }` filters, which are
 *  case-sensitive in Prisma. */
export function guardianTypeNamesForRole(role: ParentRole): string[] {
  return [...(role === "father" ? FATHER_TYPE_NAMES : MOTHER_TYPE_NAMES)]
}

/** Both parent roles, every spelling. */
export const PARENT_GUARDIAN_TYPE_NAMES: readonly string[] = [
  ...FATHER_TYPE_NAMES,
  ...MOTHER_TYPE_NAMES,
]

/** Map a stored GuardianType name onto the parent role it denotes, or null
 *  for a non-parent type (guardian, grandparent, sibling, …). */
export function canonicalGuardianRole(
  name: string | null | undefined
): ParentRole | null {
  const n = (name ?? "").trim().toLowerCase()
  if (!n) return null
  if (FATHER_TYPE_NAMES.some((x) => x.toLowerCase() === n)) return "father"
  if (MOTHER_TYPE_NAMES.some((x) => x.toLowerCase() === n)) return "mother"
  return null
}

// ---------------------------------------------------------------------------
// Core utility
// ---------------------------------------------------------------------------

/**
 * Create or link a guardian to a student within a Prisma transaction.
 * Handles: GuardianType upsert, Guardian upsert by email, StudentGuardian link,
 * and phone number upsert.
 */
export async function createOrLinkGuardian(
  tx: TxClient,
  params: GuardianEntry & {
    schoolId: string
    studentId: string
    /** Mint a guardian portal login (User role GUARDIAN) when an email is
     *  present and the guardian has none yet. Bulk CSV import passes true (it
     *  gave families logins before this unification); admission + the student
     *  wizard omit it and keep guardians contact-only, as they do today. */
    createLogin?: boolean
  }
): Promise<CreateOrLinkResult> {
  const {
    schoolId,
    studentId,
    typeName,
    firstName,
    lastName,
    email,
    phone,
    whatsapp,
    occupation,
    isPrimary,
    createLogin,
  } = params
  let credentials: { username: string; password: string } | null = null

  // 1. Resolve the GuardianType. Callers always ask for the lowercase English
  //    role, but an Arabic-seeded school already holds the role as "الأب" /
  //    "الأم". Upserting by the exact name minted a SECOND type row per role
  //    in every such school, and the parent checks that key off the type then
  //    missed the seeded links. Reuse any spelling of the role that exists;
  //    create the requested name only when the school has none.
  const role = canonicalGuardianRole(typeName)
  const existingType = role
    ? await tx.guardianType.findFirst({
        where: { schoolId, name: { in: guardianTypeNamesForRole(role) } },
        orderBy: { createdAt: "asc" },
      })
    : null
  const guardianType =
    existingType ??
    (await tx.guardianType.upsert({
      where: {
        schoolId_name: { schoolId, name: typeName },
      },
      create: { schoolId, name: typeName },
      update: {},
    }))

  // 2. Create or find Guardian.
  //    - Unique by schoolId + email when provided.
  //    - Otherwise fall back to a phone-number lookup (GuardianPhoneNumber is
  //      schoolId-scoped) before creating — without this, two submissions
  //      for the same guardian with no email on file (e.g. the same father
  //      listed on two siblings' applications) always created a duplicate
  //      Guardian row instead of reusing the existing one.
  let guardian
  if (email) {
    guardian = await tx.guardian.upsert({
      where: {
        schoolId_emailAddress: { schoolId, emailAddress: email },
      },
      create: { schoolId, firstName, lastName, emailAddress: email },
      update: {},
    })
  } else if (phone) {
    //    The phone match is school-wide ON PURPOSE (siblings share a father),
    //    but it must never resolve to a guardian who is already THIS student's
    //    other parent. Families routinely give one household number for both
    //    parents; without this exclusion the mother resolved to the father's
    //    Guardian row, the StudentGuardian upsert below then hit the existing
    //    father link and no-op'd, and her name was silently discarded — the
    //    father's details showed up as the mother's.
    //    "Another role" is judged by ROLE, not by type id: a father linked
    //    under the English twin type ("father") is the same father when the
    //    save resolves to the school's seeded "الأب" row — comparing ids
    //    would call him taken and create a duplicate Guardian on every
    //    re-save of the personal step.
    const phoneMatches = await tx.guardianPhoneNumber.findMany({
      where: { schoolId, phoneNumber: phone },
      select: { guardianId: true },
    })
    const candidateIds = [...new Set(phoneMatches.map((p) => p.guardianId))]
    const conflicting = candidateIds.length
      ? await tx.studentGuardian.findMany({
          where: {
            schoolId,
            studentId,
            guardianId: { in: candidateIds },
            ...(role
              ? {
                  guardianType: {
                    name: { notIn: guardianTypeNamesForRole(role) },
                  },
                }
              : { guardianTypeId: { not: guardianType.id } }),
          },
          select: { guardianId: true },
        })
      : []
    const takenByAnotherRole = new Set(conflicting.map((c) => c.guardianId))
    const reusableId = candidateIds.find((id) => !takenByAnotherRole.has(id))
    const existingGuardian = reusableId
      ? await tx.guardian.findFirst({
          where: { id: reusableId, schoolId },
        })
      : null
    guardian =
      existingGuardian ??
      (await tx.guardian.create({
        data: { schoolId, firstName, lastName },
      }))
  } else {
    guardian = await tx.guardian.create({
      data: { schoolId, firstName, lastName },
    })
  }

  // 2.5 Optional guardian portal login (bulk-import parity). User is unique by
  //     (email, schoolId); reuse an existing account, else mint one with a
  //     temp password. username is non-unique so a sanitized base is fine.
  if (createLogin && email && !guardian.userId) {
    const existingUser = await tx.user.findFirst({
      where: { email, schoolId },
      select: { id: true },
    })
    let guardianUserId: string
    if (existingUser) {
      guardianUserId = existingUser.id
    } else {
      const { plain, hashed } = await mintTempPassword()
      const username =
        sanitizeUsername(email) ||
        sanitizeUsername(`${firstName}.${lastName}`) ||
        undefined
      const created = await tx.user.create({
        data: {
          email,
          username,
          role: "GUARDIAN",
          schoolId,
          emailVerified: new Date(),
          password: hashed,
        },
      })
      guardianUserId = created.id
      credentials = { username: username ?? email, password: plain }
    }
    await tx.guardian.update({
      where: { id: guardian.id },
      data: { userId: guardianUserId },
    })
  }

  // 3. Link student to guardian
  const studentGuardian = await tx.studentGuardian.upsert({
    where: {
      schoolId_studentId_guardianId: {
        schoolId,
        studentId,
        guardianId: guardian.id,
      },
    },
    create: {
      schoolId,
      studentId,
      guardianId: guardian.id,
      guardianTypeId: guardianType.id,
      isPrimary,
      occupation,
    },
    update: {},
  })

  // 4. Add phone number if provided
  if (phone) {
    await tx.guardianPhoneNumber.upsert({
      where: {
        schoolId_guardianId_phoneNumber: {
          schoolId,
          guardianId: guardian.id,
          phoneNumber: phone,
        },
      },
      create: {
        schoolId,
        guardianId: guardian.id,
        phoneNumber: phone,
        isPrimary: true,
      },
      update: {},
    })
  }

  // 5. WhatsApp — a second row typed "whatsapp". Both wizards auto-fill it
  //    from the phone, so the common case is the SAME number: skip it then,
  //    or the upsert would retype the primary row to "whatsapp" and the
  //    wizard's read-back (`phoneType !== "whatsapp"` = phone) would show the
  //    phone field empty on the next open.
  const whatsappNumber = whatsapp?.trim()
  if (whatsappNumber && whatsappNumber !== phone?.trim()) {
    await tx.guardianPhoneNumber.upsert({
      where: {
        schoolId_guardianId_phoneNumber: {
          schoolId,
          guardianId: guardian.id,
          phoneNumber: whatsappNumber,
        },
      },
      create: {
        schoolId,
        guardianId: guardian.id,
        phoneNumber: whatsappNumber,
        phoneType: "whatsapp",
        isPrimary: false,
      },
      update: { phoneType: "whatsapp" },
    })
  }

  return {
    guardianId: guardian.id,
    guardianTypeId: guardianType.id,
    studentGuardianId: studentGuardian.id,
    credentials,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Split a full name string into firstName + lastName.
 * Last word becomes lastName, everything else becomes firstName.
 */
export function splitGuardianName(fullName: string): {
  firstName: string
  lastName: string
} {
  const parts = fullName.trim().split(/\s+/)
  const lastName = parts.length > 1 ? parts.pop()! : ""
  const firstName = parts.join(" ") || fullName
  return { firstName, lastName }
}

/**
 * Convert a GuardianFullNameEntry (with single fullName) to a GuardianEntry
 * (with split firstName/lastName).
 */
export function fromFullName(entry: GuardianFullNameEntry): GuardianEntry {
  const { fullName, ...rest } = entry
  const { firstName, lastName } = splitGuardianName(fullName)
  return { ...rest, firstName, lastName }
}

// ---------------------------------------------------------------------------
// Guardian resolution for notification dispatch
// ---------------------------------------------------------------------------

export interface ResolvedGuardian {
  guardianId: string
  /** User ID for in-app + email notifications. Null if guardian has no auth account. */
  userId: string | null
  /** Primary phone number for SMS/WhatsApp. Null if none set. */
  primaryPhone: string | null
  isPrimary: boolean
}

/**
 * Resolve a student's guardians for contact (notifications, SMS, WhatsApp).
 * Returns one row per linked guardian, primary-flagged guardian first.
 *
 * Extracted from the include-chain pattern repeated across attendance, admission,
 * and notification code. Always scope by `schoolId` to enforce tenant isolation.
 */
export async function getGuardiansForStudent(
  db: PrismaClient,
  schoolId: string,
  studentId: string
): Promise<ResolvedGuardian[]> {
  const student = await db.student.findFirst({
    where: { id: studentId, schoolId },
    include: {
      studentGuardians: {
        include: {
          guardian: {
            include: {
              phoneNumbers: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  if (!student) return []

  const rows: ResolvedGuardian[] = student.studentGuardians.map((sg) => ({
    guardianId: sg.guardian.id,
    userId: sg.guardian.userId ?? null,
    primaryPhone: sg.guardian.phoneNumbers?.[0]?.phoneNumber ?? null,
    isPrimary: Boolean(sg.isPrimary),
  }))
  // Primary first
  rows.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
  return rows
}
