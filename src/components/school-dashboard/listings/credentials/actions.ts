// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { after } from "next/server"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { makeUniqueUsername, mintTempPassword } from "@/lib/credentials"
import { deliverCredentials } from "@/lib/credentials-delivery"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  getStudentCredentials,
  resetStudentPassword,
} from "../students/actions"
import type { CredentialsPayload, CredentialsRole } from "./types"

const inputSchema = z.object({
  role: z.enum(["student", "teacher", "guardian", "staff"]),
  id: z.string().min(1),
})

type MemberRole = Exclude<CredentialsRole, "student">

const ROLE_TO_USER_ROLE: Record<MemberRole, "TEACHER" | "GUARDIAN" | "STAFF"> =
  {
    teacher: "TEACHER",
    guardian: "GUARDIAN",
    staff: "STAFF",
  }

const ROLE_PREFIX: Record<MemberRole, string> = {
  teacher: "tch",
  guardian: "grd",
  staff: "stf",
}

// ============================================================================
// Public entry — one action: generate a shareable login.
// ============================================================================

/**
 * Generate a shareable login for any school member and return it with the best
 * contact on file (so the dialog's Share icon can pick a channel). The login is
 * never displayed — the caller only copies/shares it.
 *
 * "Generate" means: mint a fresh temp password the admin can hand out. The one
 * exception is a self-onboarded student who set their own password during
 * sign-up — we don't clobber it; the admin just re-shares the username + URL.
 */
export async function generateCredentials(input: {
  role: CredentialsRole
  id: string
}): Promise<ActionResponse<CredentialsPayload>> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const { role, id } = inputSchema.parse(input)

    if (role === "student") {
      return handleStudent(id, schoolId)
    }
    return handleMember(role, id, schoolId)
  } catch (error) {
    console.error("[generateCredentials] Error:", error)
    return actionError(
      ACTION_ERRORS.CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Student — delegate to the existing, battle-tested student flow, then enrich
// the payload with the best phone/email contact for the share channel.
// ============================================================================

async function handleStudent(
  id: string,
  schoolId: string
): Promise<ActionResponse<CredentialsPayload>> {
  // First open creates the User (and mints a password); an existing admin-
  // managed account returns password:null — mint a fresh one so there's always
  // something to share. A self-onboarded student keeps their own password.
  const initial = await getStudentCredentials({ studentId: id })
  if (!initial.success || !initial.data) {
    return { success: false, error: initial.error, code: initial.code }
  }

  let data = initial.data
  if (!data.password && !data.isSelfOnboarded) {
    const reset = await resetStudentPassword({ studentId: id })
    if (reset.success && reset.data) data = reset.data
  }

  const contact = await loadStudentContact(id, schoolId)
  return {
    success: true,
    data: {
      ...data,
      phone: contact.phone,
      email: data.email ?? contact.email,
    },
  }
}

async function loadStudentContact(
  id: string,
  schoolId: string
): Promise<{ phone: string | null; email: string | null }> {
  const student = await db.student.findFirst({
    where: { id, schoolId },
    select: {
      email: true,
      mobileNumber: true,
      alternatePhone: true,
      studentGuardians: {
        orderBy: { isPrimary: "desc" },
        take: 1,
        select: {
          guardian: {
            select: {
              emailAddress: true,
              phoneNumbers: {
                orderBy: { isPrimary: "desc" },
                take: 1,
                select: { phoneNumber: true },
              },
            },
          },
        },
      },
    },
  })

  const guardian = student?.studentGuardians?.[0]?.guardian
  const phone =
    student?.mobileNumber ||
    student?.alternatePhone ||
    guardian?.phoneNumbers?.[0]?.phoneNumber ||
    null
  const email = student?.email || guardian?.emailAddress || null
  return { phone, email }
}

// ============================================================================
// Members (teacher / guardian / staff) — mint a User on first open, reuse the
// shared crypto password + delivery primitives, resolve best phone/email.
// ============================================================================

interface MemberEntity {
  id: string
  userId: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
}

async function loadMember(
  role: MemberRole,
  id: string,
  schoolId: string
): Promise<MemberEntity | null> {
  if (role === "teacher") {
    const t = await db.teacher.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        userId: true,
        emailAddress: true,
        firstName: true,
        lastName: true,
        phoneNumbers: {
          orderBy: { isPrimary: "desc" },
          take: 1,
          select: { phoneNumber: true },
        },
      },
    })
    if (!t) return null
    return {
      id: t.id,
      userId: t.userId,
      email: t.emailAddress ?? null,
      firstName: t.firstName,
      lastName: t.lastName,
      phone: t.phoneNumbers?.[0]?.phoneNumber ?? null,
    }
  }

  if (role === "guardian") {
    const g = await db.guardian.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        userId: true,
        emailAddress: true,
        firstName: true,
        lastName: true,
        phoneNumbers: {
          orderBy: { isPrimary: "desc" },
          take: 1,
          select: { phoneNumber: true },
        },
      },
    })
    if (!g) return null
    return {
      id: g.id,
      userId: g.userId,
      email: g.emailAddress ?? null,
      firstName: g.firstName,
      lastName: g.lastName,
      phone: g.phoneNumbers?.[0]?.phoneNumber ?? null,
    }
  }

  // staff
  const s = await db.staffMember.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      userId: true,
      emailAddress: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      alternatePhone: true,
      staffPhoneNumbers: {
        orderBy: { isPrimary: "desc" },
        take: 1,
        select: { phoneNumber: true },
      },
    },
  })
  if (!s) return null
  return {
    id: s.id,
    userId: s.userId,
    email: s.emailAddress ?? null,
    firstName: s.firstName,
    lastName: s.lastName,
    phone:
      s.phoneNumber ||
      s.alternatePhone ||
      s.staffPhoneNumbers?.[0]?.phoneNumber ||
      null,
  }
}

async function linkMemberUser(
  role: MemberRole,
  entityId: string,
  userId: string
): Promise<void> {
  if (role === "teacher") {
    await db.teacher.update({ where: { id: entityId }, data: { userId } })
  } else if (role === "guardian") {
    await db.guardian.update({ where: { id: entityId }, data: { userId } })
  } else {
    await db.staffMember.update({ where: { id: entityId }, data: { userId } })
  }
}

/** Login-valid, school-unique username from email local-part or name. */
async function buildMemberUsername(
  role: MemberRole,
  entity: MemberEntity,
  schoolId: string
): Promise<string> {
  const base =
    entity.email?.split("@")[0] ||
    [entity.firstName, entity.lastName].filter(Boolean).join(".")

  const taken = new Set<string>()
  // Preload colliding usernames so makeUniqueUsername can suffix around them.
  const sanitizedSeed = base
    ?.toLowerCase()
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/^[._-]+/, "")
    .slice(0, 16)
  if (sanitizedSeed) {
    const existing = await db.user.findMany({
      where: { schoolId, username: { startsWith: sanitizedSeed } },
      select: { username: true },
    })
    existing.forEach((u) => u.username && taken.add(u.username))
  }
  return makeUniqueUsername(base, taken, ROLE_PREFIX[role])
}

async function handleMember(
  role: MemberRole,
  id: string,
  schoolId: string
): Promise<ActionResponse<CredentialsPayload>> {
  const entity = await loadMember(role, id, schoolId)
  if (!entity) return actionError(ACTION_ERRORS.NOT_FOUND)

  const { plain, hashed } = await mintTempPassword()

  // Path 1: no User yet — mint one so the admin has something to share.
  if (!entity.userId) {
    const username = await buildMemberUsername(role, entity, schoolId)
    const newUser = await db.user.create({
      data: {
        email: entity.email,
        emailVerified: new Date(),
        password: hashed,
        role: ROLE_TO_USER_ROLE[role],
        schoolId,
        username,
        mustChangePassword: true,
      },
    })
    await linkMemberUser(role, entity.id, newUser.id)
    queueDeliver(schoolId, newUser.id, username, plain, true)

    return {
      success: true,
      data: {
        username,
        email: entity.email,
        password: plain,
        phone: entity.phone,
        isNew: true,
        isSelfOnboarded: false,
      },
    }
  }

  // Existing User: ensure a username, then mint a fresh shareable password.
  const user = await db.user.findUnique({
    where: { id: entity.userId },
    select: { email: true, username: true },
  })

  let username = user?.username ?? null
  if (!username) {
    username = await buildMemberUsername(role, entity, schoolId)
  }

  await db.user.update({
    where: { id: entity.userId },
    data: { password: hashed, mustChangePassword: true, username },
  })
  queueDeliver(schoolId, entity.userId, username, plain, false)

  return {
    success: true,
    data: {
      username,
      email: user?.email ?? entity.email,
      password: plain,
      phone: entity.phone,
      isNew: false,
      isSelfOnboarded: false,
    },
  }
}

/**
 * Push credentials over notification channels AFTER the response is sent
 * (`after()`), so the dialog gets its credentials back fast and isn't blocked
 * on email/WhatsApp delivery. Never fatal.
 */
function queueDeliver(
  schoolId: string,
  userId: string,
  username: string,
  tempPassword: string,
  isFirstTime: boolean
): void {
  after(async () => {
    try {
      await deliverCredentials({
        schoolId,
        userId,
        username,
        tempPassword,
        isFirstTime,
      })
    } catch (deliveryErr) {
      console.error("[credentials] delivery failed:", deliveryErr)
    }
  })
}
