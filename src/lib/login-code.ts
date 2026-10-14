// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Login codes — the 6-digit username every school member signs in with.
 *
 *   YY NNNN   e.g. 260001, 260002 … 269999
 *   YY        last two digits of the current school year's start
 *   NNNN      one serial per school per year, shared by EVERY role, so a
 *             student and a parent can never hold the same code
 *
 * Uniqueness: allocation runs under a per-school advisory lock inside the
 * caller's transaction, and a partial unique index on User(schoolId,
 * username) for 6-digit usernames is the backstop. Existing users keep the
 * username they have; a code is assigned when credentials are (re)issued.
 */

import type { PrismaClient } from "@prisma/client"

/** Anything with raw queries + schoolYear: the db client or a transaction. */
type Client = Pick<PrismaClient, "$queryRaw" | "schoolYear">

export const LOGIN_CODE_RE = /^\d{6}$/
const SERIAL_MAX = 9999

/** Any numeric login: the 6-digit code or the older 8/9-char student code. */
export function isLoginCode(value: string | null | undefined): boolean {
  if (!value) return false
  return /^\d{6,9}$/.test(value) || /^\d{2}G\d{6}$/.test(value)
}

/** Two-digit year of the school year running now (or the latest started). */
export async function loginCodeYear(
  client: Client,
  schoolId: string,
  now: Date = new Date()
): Promise<string> {
  const year = await client.schoolYear.findFirst({
    where: { schoolId, startDate: { lte: now } },
    orderBy: { startDate: "desc" },
    select: { startDate: true },
  })
  const full = year?.startDate?.getFullYear() ?? now.getFullYear()
  return String(full % 100).padStart(2, "0")
}

/** Next serial after the highest `taken` code with this year prefix. */
export function nextSerials(
  yy: string,
  taken: Iterable<string | null | undefined>,
  count: number
): string[] {
  let max = 0
  for (const code of taken) {
    if (!code || !LOGIN_CODE_RE.test(code) || !code.startsWith(yy)) continue
    max = Math.max(max, parseInt(code.slice(2), 10))
  }
  if (max + count > SERIAL_MAX) {
    throw new Error(
      `LOGIN_CODES_EXHAUSTED: school has used ${max} of ${SERIAL_MAX} login codes for 20${yy}`
    )
  }
  return Array.from(
    { length: count },
    (_, i) => `${yy}${String(max + i + 1).padStart(4, "0")}`
  )
}

/**
 * Allocate `count` consecutive login codes for a school. Call inside the
 * same transaction that writes the users so the advisory lock holds until
 * the codes are stored.
 */
export async function allocateLoginCodes(
  client: Client,
  schoolId: string,
  count: number = 1
): Promise<string[]> {
  if (count <= 0) return []
  await client.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`login-code:${schoolId}`}))::text`
  const yy = await loginCodeYear(client, schoolId)
  const [latest] = await client.$queryRaw<{ username: string }[]>`
    SELECT username FROM "User"
    WHERE "schoolId" = ${schoolId} AND username ~ ${`^${yy}[0-9]{4}$`}
    ORDER BY username DESC LIMIT 1`
  return nextSerials(yy, [latest?.username], count)
}

/** One login code. */
export async function allocateLoginCode(
  client: Client,
  schoolId: string
): Promise<string> {
  const [code] = await allocateLoginCodes(client, schoolId, 1)
  return code
}
