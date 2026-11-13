// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { after } from "next/server"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { clearLoginFailures, lastSuccessfulSignIn } from "@/lib/audit-log"
import { mintTempPassword } from "@/lib/credentials"
import { canManageCredentials } from "@/lib/credentials-access"
import { deliverCredentials } from "@/lib/credentials-delivery"
import { db } from "@/lib/db"
import { allocateLoginCode, LOGIN_CODE_RE } from "@/lib/login-code"
import { ensureLoginEmail, isPlaceholderEmail } from "@/lib/login-email"
import { displayName } from "@/lib/name-utils"
import { getTenantContext } from "@/lib/tenant-context"

import {
  getStudentCredentials,
  resetStudentPassword,
} from "../students/actions"
import type { CredentialsPayload, CredentialsRole } from "./types"

const inputSchema = z.object({
  role: z.enum(["student", "teacher", "guardian", "staff"]),
  id: z.string().min(1),
  /** Force a new password even for a student who chose their own — the
   *  admin's recovery path when someone has lost access. */
  reset: z.boolean().optional(),
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
 * "Generate" means: mint a fresh temp password the admin can hand out. Two
 * exceptions, both for a login its owner already uses: a self-onboarded
 * student who set their own password during sign-up, and ANY account that has
 * signed its owner in (`workingLogin`). Those keep their password — opening
 * the dialog to look a login up must never lock someone out — and the admin
 * re-issues only by asking for it (`reset`).
 */
export async function generateCredentials(input: {
  role: CredentialsRole
  id: string
  reset?: boolean
}): Promise<ActionResponse<CredentialsPayload>> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    // A fresh password comes back in plain text — admins only.
    if (!canManageCredentials(session.user.role))
      return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const { role, id, reset } = inputSchema.parse(input)

    if (role === "student") {
      return handleStudent(id, schoolId, reset)
    }
    return handleMember(role, id, schoolId, reset)
  } catch (error) {
    console.error("[generateCredentials] Error:", error)
    return actionError(
      ACTION_ERRORS.CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Does this login already work for its owner? (hogwarts#473)
// ============================================================================

type LoginOwner = {
  email: string | null
  username: string | null
  passwordChangedAt: Date | null
  mustChangePassword: boolean
}

const LOGIN_OWNER_SELECT = {
  email: true,
  username: true,
  passwordChangedAt: true,
  mustChangePassword: true,
} as const

/**
 * A login "works" once it has signed its owner in, or once they chose their
 * own password and still hold it. Minting over such a login replaces a PIN
 * the family is using: on 2026-11-09, opening this dialog to look logins up
 * re-minted six working students at Al-Ibda, one of whom had signed in three
 * minutes earlier, and they found out at class time.
 *
 * When the lookup itself fails the answer is "keep": a missing PIN costs one
 * more tap on Reset, a replaced one costs a child a class.
 */
async function workingLogin(
  schoolId: string,
  user: LoginOwner | null | undefined
): Promise<{ keep: boolean; at: Date | null }> {
  if (!user) return { keep: false, at: null }
  try {
    const signedIn = await lastSuccessfulSignIn(schoolId, [
      user.username,
      user.email,
    ])
    if (signedIn) return { keep: true, at: signedIn }
    if (user.passwordChangedAt && !user.mustChangePassword) {
      return { keep: true, at: user.passwordChangedAt }
    }
    return { keep: false, at: null }
  } catch (error) {
    console.error(
      "[credentials] sign-in lookup failed; keeping the password:",
      error
    )
    return { keep: true, at: null }
  }
}

// ============================================================================
// Student — delegate to the existing, battle-tested student flow, then enrich
// the payload with the best phone/email contact for the share channel.
// ============================================================================

async function handleStudent(
  id: string,
  schoolId: string,
  reset = false
): Promise<ActionResponse<CredentialsPayload>> {
  // First open creates the User (and mints a password); an existing admin-
  // managed account returns password:null. If nobody has ever signed in with
  // it, mint a fresh one so there is something to share. A login that works
  // (a self-onboarded student, or anyone who has signed in) keeps its
  // password unless the admin explicitly resets it (`reset`).
  const initial = reset
    ? await resetStudentPassword({ studentId: id })
    : await getStudentCredentials({ studentId: id })
  if (!initial.success || !initial.data) {
    return { success: false, error: initial.error, code: initial.code }
  }

  let data = initial.data
  let kept: { at: Date | null } | null = null
  if (!data.password && !data.isSelfOnboarded) {
    const owner = await db.student.findFirst({
      where: { id, schoolId },
      select: { user: { select: LOGIN_OWNER_SELECT } },
    })
    const working = await workingLogin(schoolId, owner?.user)
    if (working.keep) {
      kept = { at: working.at }
    } else {
      const minted = await resetStudentPassword({ studentId: id })
      if (minted.success && minted.data) data = minted.data
    }
  }

  const [contact, person] = await Promise.all([
    loadStudentContact(id, schoolId),
    db.student.findFirst({
      where: { id, schoolId },
      select: { firstName: true, middleName: true, lastName: true },
    }),
  ])
  return {
    success: true,
    data: {
      ...data,
      fullName: person ? displayName(person, "full") : undefined,
      phone: contact.phone,
      email: data.email,
      contactEmail: contact.email ?? data.email,
      lastSignedInAt: kept?.at ? kept.at.toISOString() : null,
      passwordKept: kept !== null,
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
  middleName?: string | null
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
        middleName: true,
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
      middleName: t.middleName,
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
        middleName: true,
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
      middleName: g.middleName,
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
      middleName: true,
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
    middleName: s.middleName,
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

async function handleMember(
  role: MemberRole,
  id: string,
  schoolId: string,
  reset = false
): Promise<ActionResponse<CredentialsPayload>> {
  const entity = await loadMember(role, id, schoolId)
  if (!entity) return actionError(ACTION_ERRORS.NOT_FOUND)

  // Path 1: no User yet — mint one so the admin has something to share.
  // The username is the school's next 6-digit login code (YY + serial).
  if (!entity.userId) {
    const { plain, hashed } = await mintTempPassword()
    const { newUser, username } = await db.$transaction(async (tx) => {
      const username = await allocateLoginCode(tx, schoolId)
      const newUser = await tx.user.create({
        data: {
          email: await loginEmailFor(tx, schoolId, entity.email),
          emailVerified: new Date(),
          password: hashed,
          role: ROLE_TO_USER_ROLE[role],
          schoolId,
          username,
          mustChangePassword: true,
        },
      })
      return { newUser, username }
    })
    await linkMemberUser(role, entity.id, newUser.id)
    queueDeliver(schoolId, newUser.id, username, plain, true)

    return {
      success: true,
      data: {
        username,
        fullName: displayName(entity, "full"),
        email: newUser.email,
        contactEmail: entity.email,
        password: plain,
        phone: entity.phone,
        isNew: true,
        isSelfOnboarded: false,
      },
    }
  }

  const user = await db.user.findUnique({
    where: { id: entity.userId },
    select: { ...LOGIN_OWNER_SELECT, emailVerified: true },
  })

  // Path 2: a login its owner already uses — hand back what signs them in and
  // leave the password alone. Nothing is written.
  if (!reset) {
    const working = await workingLogin(schoolId, user)
    if (working.keep) {
      return {
        success: true,
        data: {
          username: user?.username ?? "",
          fullName: displayName(entity, "full"),
          email: user?.email ?? null,
          contactEmail: entity.email ?? user?.email ?? null,
          password: null,
          phone: entity.phone,
          isNew: false,
          isSelfOnboarded: false,
          lastSignedInAt: working.at ? working.at.toISOString() : null,
          passwordKept: true,
        },
      }
    }
  }

  // Path 3: nobody has signed in with it (or the admin asked for a reset):
  // ensure a username, then mint a fresh shareable password.
  const { plain, hashed } = await mintTempPassword()

  // Regenerating moves an older login (email local-part, first.last) onto
  // the 6-digit code; someone already on a code keeps it.
  const userId = entity.userId
  const username = await db.$transaction(async (tx) => {
    const username =
      user?.username && LOGIN_CODE_RE.test(user.username)
        ? user.username
        : await allocateLoginCode(tx, schoolId)
    // tokenVersion bump signs the old holder out on web + mobile.
    await tx.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        mustChangePassword: true,
        username,
        // Admin-issued: an email login must work like the code login, now
        // and after the person picks their own password.
        ...(user?.email && !user.emailVerified
          ? { emailVerified: new Date() }
          : {}),
        tokenVersion: { increment: 1 },
      },
    })
    return username
  })
  const loginEmail = await ensureLoginEmail(db, {
    userId,
    schoolId,
    current: user?.email,
    candidate: entity.email,
  })
  // A reset is also the recovery path — lift any lockout right away.
  await clearLoginFailures(schoolId, [username, user?.username, user?.email])
  queueDeliver(schoolId, entity.userId, username, plain, false)

  return {
    success: true,
    data: {
      username,
      fullName: displayName(entity, "full"),
      email: loginEmail,
      contactEmail: entity.email ?? loginEmail,
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

/** A new User's login email: the person record's address, unless it is a
 *  placeholder or another account in the school already signs in with it. */
async function loginEmailFor(
  tx: Pick<typeof db, "user">,
  schoolId: string,
  email: string | null | undefined
): Promise<string | null> {
  if (!email || isPlaceholderEmail(email)) return null
  const taken = await tx.user.findFirst({
    where: {
      schoolId,
      email: { equals: email.trim(), mode: "insensitive" },
    },
    select: { id: true },
  })
  return taken ? null : email.trim().toLowerCase()
}
