// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Login email — the address a school member signs in with, next to their
 * 6-digit login code. It lives on `User.email`; the person records
 * (Teacher.emailAddress, Guardian.emailAddress, Student.email, …) are contact
 * data and may differ.
 *
 * The credentials dialog only ever shows the login email, so an admin never
 * hands out an address that doesn't sign anyone in. When a User has no email
 * yet but the person record carries one, issuing credentials adopts it as the
 * login email — unless another account in the school already holds it.
 */

import type { PrismaClient } from "@prisma/client"

type Client = Pick<PrismaClient, "user">

/** Synthetic addresses (`@school.local`, `@parent.local`) can't receive mail
 *  and aren't anything a person would type. */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase().endsWith(".local")
}

/**
 * The login email for `userId`, adopting `candidate` from the person record
 * when the User has none. Admin-issued, so it is stamped verified — the
 * verification gate must not stall an email login the admin handed out.
 * Returns null when the account has no usable login email.
 */
export async function ensureLoginEmail(
  client: Client,
  params: {
    userId: string
    schoolId: string
    current: string | null | undefined
    candidate: string | null | undefined
  }
): Promise<string | null> {
  const { userId, schoolId, current, candidate } = params
  if (current && !isPlaceholderEmail(current)) return current
  if (!candidate || isPlaceholderEmail(candidate)) return null

  const email = candidate.trim().toLowerCase()
  const taken = await client.user.findFirst({
    where: {
      schoolId,
      email: { equals: email, mode: "insensitive" },
      id: { not: userId },
    },
    select: { id: true },
  })
  if (taken) return null

  await client.user.update({
    where: { id: userId },
    data: { email, emailVerified: new Date() },
  })
  return email
}
