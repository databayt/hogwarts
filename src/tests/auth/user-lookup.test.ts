// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Login lookup — email OR username, for every school role.
 *
 * Emails are matched case-insensitively (admins type `Ahmed@Gmail.com`, people
 * type `ahmed@gmail.com`), and when two rows in one school share an address
 * the password picks the row it opens.
 */

import bcrypt from "bcryptjs"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  getUserByEmail,
  getUsersByIdentifier,
  normalizeEmail,
  resolveLoginUser,
} from "@/components/auth/user"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: { user: { findMany: vi.fn() } } }))

const findMany = vi.mocked(db.user.findMany)

type Row = {
  id: string
  role: string
  email: string | null
  username: string
  schoolId: string | null
  password: string
}

/** A tiny in-memory User table that honours the where-clauses the lookup uses. */
function seed(rows: Row[]) {
  findMany.mockImplementation((async (args: {
    where: {
      email?: { equals: string; mode: string }
      username?: string
      schoolId?: string | null
    }
  }) => {
    const w = args.where
    return rows.filter((r) => {
      if ("schoolId" in w && r.schoolId !== w.schoolId) return false
      if (w.username !== undefined && r.username !== w.username) return false
      if (w.email) {
        expect(w.email.mode).toBe("insensitive")
        if ((r.email ?? "").toLowerCase() !== w.email.equals.toLowerCase())
          return false
      }
      return true
    })
  }) as never)
}

const hash = (p: string) => bcrypt.hashSync(p, 4)
const SCHOOL = "school-1"

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Omer@Gmail.COM ")).toBe("omer@gmail.com")
  })
})

describe("login by username AND email, every role", () => {
  const roles = ["TEACHER", "STUDENT", "GUARDIAN", "STAFF"] as const
  const rows: Row[] = roles.map((role, i) => ({
    id: `u-${role}`,
    role,
    // Stored with the casing the admin typed.
    email: `${role[0]}${role.slice(1).toLowerCase()}.Person@Gmail.com`,
    username: `26000${i + 1}`,
    schoolId: SCHOOL,
    password: hash(`11${i}2`),
  }))

  beforeEach(() => {
    findMany.mockReset()
    seed(rows)
  })

  it.each(roles.map((r, i) => [r, i] as const))(
    "%s signs in with the login code",
    async (role, i) => {
      const user = await resolveLoginUser(`26000${i + 1}`, `11${i}2`, SCHOOL)
      expect(user?.id).toBe(`u-${role}`)
      expect(await bcrypt.compare(`11${i}2`, user!.password!)).toBe(true)
    }
  )

  it.each(roles.map((r, i) => [r, i] as const))(
    "%s signs in with the email, typed in any case",
    async (role, i) => {
      const stored = rows[i].email!
      for (const typed of [stored, stored.toLowerCase(), stored.toUpperCase()]) {
        const user = await resolveLoginUser(typed, `11${i}2`, SCHOOL)
        expect(user?.id).toBe(`u-${role}`)
      }
    }
  )

  it("password reset finds a mixed-case row from the lowercased address", async () => {
    const user = await getUserByEmail("teacher.person@gmail.com", SCHOOL)
    expect(user?.id).toBe("u-TEACHER")
  })
})

describe("two rows in one school share an email", () => {
  beforeEach(() => {
    findMany.mockReset()
    seed([
      {
        id: "older",
        role: "TEACHER",
        email: "alh@gmail.com",
        username: "abd-t-010",
        schoolId: SCHOOL,
        password: hash("1212"),
      },
      {
        id: "newer",
        role: "TEACHER",
        email: "Alh@gmail.com",
        username: "260050",
        schoolId: SCHOOL,
        password: hash("3456"),
      },
    ])
  })

  it("returns both candidates for the email", async () => {
    expect(await getUsersByIdentifier("ALH@gmail.com", SCHOOL)).toHaveLength(2)
  })

  it.each([
    ["1212", "older"],
    ["3456", "newer"],
  ])("password %s opens the %s account", async (pw, id) => {
    const user = await resolveLoginUser("alh@gmail.com", pw, SCHOOL)
    expect(user?.id).toBe(id)
  })

  it("a wrong password still returns a row so the caller rejects it", async () => {
    const user = await resolveLoginUser("alh@gmail.com", "0000", SCHOOL)
    expect(user).not.toBeNull()
    expect(await bcrypt.compare("0000", user!.password!)).toBe(false)
  })
})

describe("usernames stay school-scoped", () => {
  it("no school → no username login", async () => {
    findMany.mockReset()
    expect(await getUsersByIdentifier("260001", null)).toEqual([])
    expect(findMany).not.toHaveBeenCalled()
  })
})
