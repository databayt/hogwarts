// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { db } from "@/lib/db"

import {
  schoolDirectorySelect,
  toSchoolDirectoryDto,
} from "../lib/school-directory"
import { buildAuthResponse } from "./jwt"

/**
 * The user row a social sign-in resolved to, before a school is chosen.
 */
export interface SocialIdentity {
  id: string
  email: string | null
  schoolId: string | null
  role: string
  username: string | null
  image: string | null
  isSuspended?: boolean | null
  tokenVersion?: number | null
}

/**
 * Finish a social sign-in without ever minting a token whose schoolId is null.
 *
 * Accounts are per school: one person is a separate `User` row in each school
 * they belong to, joined only by email (the same rule `POST /api/mobile/auth`
 * uses for password login). A Google/Apple/Facebook identity usually resolves
 * to the platform row (schoolId null), so:
 *
 *  - identity already school-scoped → tokens for it, as before;
 *  - `school_id` given AND a same-email row exists in that school → tokens for
 *    that school row (its own suspension flag applies);
 *  - otherwise → 200 `{ needs_school: true, schools }`, no tokens. `schools`
 *    lists only the schools the email already belongs to, in the same shape as
 *    `GET /api/mobile/schools`; an identity with no email (Apple "Hide My
 *    Email" without a prior link) gets an empty list.
 *
 * Callers must only pass an identity whose email the provider has VERIFIED —
 * the email is what grants entry to the school row.
 */
export async function completeSocialLogin(
  identity: SocialIdentity,
  requestedSchoolId: string | undefined
): Promise<NextResponse> {
  if (identity.schoolId) {
    return NextResponse.json(await buildAuthResponse(identity))
  }

  const memberships = identity.email
    ? await db.user.findMany({
        where: {
          email: { equals: identity.email, mode: "insensitive" },
          schoolId: { not: null },
        },
        select: {
          id: true,
          email: true,
          schoolId: true,
          role: true,
          username: true,
          image: true,
          isSuspended: true,
          tokenVersion: true,
          school: { select: { ...schoolDirectorySelect, isActive: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
    : []

  if (requestedSchoolId) {
    const member = memberships.find((m) => m.schoolId === requestedSchoolId)
    if (member) {
      if (member.isSuspended) {
        return NextResponse.json(
          { error: "Account is suspended" },
          { status: 403 }
        )
      }
      return NextResponse.json(await buildAuthResponse(member))
    }
  }

  const seen = new Set<string>()
  const schools = memberships
    .map((m) => m.school)
    .filter((s): s is NonNullable<typeof s> => !!s && s.isActive)
    .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
    .map(toSchoolDirectoryDto)

  return NextResponse.json({ needs_school: true, schools })
}
