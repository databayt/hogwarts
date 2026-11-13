// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest"

import { lastSuccessfulSignIn } from "@/lib/audit-log"
import { db } from "@/lib/db"

vi.mock("@/lib/db", () => ({
  db: { loginAttempt: { findFirst: vi.fn() } },
}))

beforeEach(() => vi.clearAllMocks())

describe("lastSuccessfulSignIn", () => {
  it("returns the newest successful sign-in for any of the logins, in this school", async () => {
    const at = new Date("2026-11-07T20:18:00.000Z")
    vi.mocked(db.loginAttempt.findFirst).mockResolvedValue({
      timestamp: at,
    } as never)

    expect(
      await lastSuccessfulSignIn("school-1", ["260064", " Noor@Example.com "])
    ).toBe(at)

    const arg = vi.mocked(db.loginAttempt.findFirst).mock.calls[0]![0]!
    expect(arg.orderBy).toEqual({ timestamp: "desc" })
    expect(arg.where).toMatchObject({
      success: true,
      AND: [
        {
          OR: [
            { email: { equals: "260064", mode: "insensitive" } },
            { email: { equals: "noor@example.com", mode: "insensitive" } },
          ],
        },
        { OR: [{ schoolId: "school-1" }, { schoolId: null }] },
      ],
    })
  })

  it("is null when nobody has signed in", async () => {
    vi.mocked(db.loginAttempt.findFirst).mockResolvedValue(null)
    expect(await lastSuccessfulSignIn("school-1", ["260064"])).toBeNull()
  })

  it("asks nothing when there is no login to look for", async () => {
    expect(
      await lastSuccessfulSignIn("school-1", [null, undefined, " "])
    ).toBeNull()
    expect(db.loginAttempt.findFirst).not.toHaveBeenCalled()
  })

  it("lets a database error through, so the caller can keep the password", async () => {
    vi.mocked(db.loginAttempt.findFirst).mockRejectedValue(new Error("down"))
    await expect(lastSuccessfulSignIn("school-1", ["260064"])).rejects.toThrow(
      "down"
    )
  })
})
