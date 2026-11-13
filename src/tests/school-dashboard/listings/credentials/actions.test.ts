// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { lastSuccessfulSignIn } from "@/lib/audit-log"
import { mintTempPassword } from "@/lib/credentials"
import { db } from "@/lib/db"
import { generateCredentials } from "@/components/school-dashboard/listings/credentials/actions"
import {
  getStudentCredentials,
  resetStudentPassword,
} from "@/components/school-dashboard/listings/students/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/server", () => ({ after: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn().mockResolvedValue({ schoolId: "school-1" }),
}))
vi.mock("@/lib/credentials-access", () => ({
  canManageCredentials: vi.fn().mockReturnValue(true),
}))
vi.mock("@/lib/credentials", () => ({ mintTempPassword: vi.fn() }))
vi.mock("@/lib/credentials-delivery", () => ({ deliverCredentials: vi.fn() }))
vi.mock("@/lib/audit-log", () => ({
  clearLoginFailures: vi.fn(),
  lastSuccessfulSignIn: vi.fn(),
}))
vi.mock("@/lib/login-code", () => ({
  allocateLoginCode: vi.fn().mockResolvedValue("260099"),
  LOGIN_CODE_RE: /^\d{6}$/,
}))
vi.mock("@/lib/login-email", () => ({
  ensureLoginEmail: vi.fn(
    async (_db, o: { current?: string | null }) => o.current ?? null
  ),
  isPlaceholderEmail: vi.fn().mockReturnValue(false),
}))
vi.mock("@/lib/name-utils", () => ({
  displayName: (p: { firstName?: string | null; lastName?: string | null }) =>
    [p.firstName, p.lastName].filter(Boolean).join(" "),
}))
vi.mock("@/components/school-dashboard/listings/students/actions", () => ({
  getStudentCredentials: vi.fn(),
  resetStudentPassword: vi.fn(),
}))
vi.mock("@/lib/db", () => {
  const db = {
    teacher: { findFirst: vi.fn(), update: vi.fn() },
    guardian: { findFirst: vi.fn(), update: vi.fn() },
    staffMember: { findFirst: vi.fn(), update: vi.fn() },
    student: { findFirst: vi.fn() },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  return { db }
})

const SIGNED_IN = new Date("2026-11-07T20:18:00.000Z")
const CHOSE_OWN = new Date("2026-10-30T09:00:00.000Z")

const teacherRow = (userId: string | null) => ({
  id: "t1",
  userId,
  emailAddress: "noor@example.com",
  firstName: "نور",
  middleName: null,
  lastName: "أحمد",
  phoneNumbers: [{ phoneNumber: "+249900000000" }],
})

const userRow = (over: Record<string, unknown> = {}) => ({
  email: "noor@example.com",
  username: "260070",
  emailVerified: new Date("2026-10-01T00:00:00.000Z"),
  passwordChangedAt: null,
  mustChangePassword: true,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN", schoolId: "school-1" },
  } as never)
  vi.mocked(mintTempPassword).mockResolvedValue({
    plain: "1122",
    hashed: "hashed-1122",
  } as never)
  vi.mocked(db.$transaction).mockImplementation((async (
    fn: (tx: typeof db) => unknown
  ) => fn(db)) as never)
  vi.mocked(db.user.update).mockResolvedValue({} as never)
  vi.mocked(lastSuccessfulSignIn).mockResolvedValue(null)
})

describe("generateCredentials — a member (teacher / guardian / staff)", () => {
  it("keeps the password of a login that has signed its owner in, and writes nothing", async () => {
    vi.mocked(db.teacher.findFirst).mockResolvedValue(teacherRow("u1") as never)
    vi.mocked(db.user.findUnique).mockResolvedValue(userRow() as never)
    vi.mocked(lastSuccessfulSignIn).mockResolvedValue(SIGNED_IN)

    const r = await generateCredentials({ role: "teacher", id: "t1" })

    expect(r.success).toBe(true)
    expect(r.success && r.data).toMatchObject({
      username: "260070",
      password: null,
      passwordKept: true,
      lastSignedInAt: SIGNED_IN.toISOString(),
      isNew: false,
    })
    expect(lastSuccessfulSignIn).toHaveBeenCalledWith("school-1", [
      "260070",
      "noor@example.com",
    ])
    expect(db.user.update).not.toHaveBeenCalled()
    expect(db.$transaction).not.toHaveBeenCalled()
    expect(mintTempPassword).not.toHaveBeenCalled()
  })

  it("mints a PIN for a login nobody has ever signed in with", async () => {
    vi.mocked(db.teacher.findFirst).mockResolvedValue(teacherRow("u1") as never)
    vi.mocked(db.user.findUnique).mockResolvedValue(userRow() as never)

    const r = await generateCredentials({ role: "teacher", id: "t1" })

    expect(r.success && r.data).toMatchObject({
      username: "260070",
      password: "1122",
      isNew: false,
    })
    expect(r.success && r.data?.passwordKept).toBeFalsy()
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          password: "hashed-1122",
          mustChangePassword: true,
        }),
      })
    )
  })

  it("an explicit reset replaces a working password", async () => {
    vi.mocked(db.teacher.findFirst).mockResolvedValue(teacherRow("u1") as never)
    vi.mocked(db.user.findUnique).mockResolvedValue(userRow() as never)
    vi.mocked(lastSuccessfulSignIn).mockResolvedValue(SIGNED_IN)

    const r = await generateCredentials({
      role: "teacher",
      id: "t1",
      reset: true,
    })

    expect(r.success && r.data?.password).toBe("1122")
    expect(lastSuccessfulSignIn).not.toHaveBeenCalled()
    expect(db.user.update).toHaveBeenCalledTimes(1)
  })

  it("keeps a password its owner chose, even with no sign-in on record", async () => {
    vi.mocked(db.teacher.findFirst).mockResolvedValue(teacherRow("u1") as never)
    vi.mocked(db.user.findUnique).mockResolvedValue(
      userRow({
        passwordChangedAt: CHOSE_OWN,
        mustChangePassword: false,
      }) as never
    )

    const r = await generateCredentials({ role: "teacher", id: "t1" })

    expect(r.success && r.data).toMatchObject({
      password: null,
      passwordKept: true,
      lastSignedInAt: CHOSE_OWN.toISOString(),
    })
    expect(db.user.update).not.toHaveBeenCalled()
  })

  it("mints over a PIN the admin issued and nobody has used yet", async () => {
    // Re-issued after the owner once chose their own: `passwordChangedAt` is
    // old news, `mustChangePassword` says the current PIN is still unused.
    vi.mocked(db.teacher.findFirst).mockResolvedValue(teacherRow("u1") as never)
    vi.mocked(db.user.findUnique).mockResolvedValue(
      userRow({
        passwordChangedAt: CHOSE_OWN,
        mustChangePassword: true,
      }) as never
    )

    const r = await generateCredentials({ role: "teacher", id: "t1" })

    expect(r.success && r.data?.password).toBe("1122")
    expect(db.user.update).toHaveBeenCalledTimes(1)
  })

  it("keeps the password when it cannot tell whether the login works", async () => {
    vi.mocked(db.teacher.findFirst).mockResolvedValue(teacherRow("u1") as never)
    vi.mocked(db.user.findUnique).mockResolvedValue(userRow() as never)
    vi.mocked(lastSuccessfulSignIn).mockRejectedValue(new Error("db down"))
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {})

    const r = await generateCredentials({ role: "teacher", id: "t1" })

    expect(r.success && r.data).toMatchObject({
      password: null,
      passwordKept: true,
      lastSignedInAt: null,
    })
    expect(db.user.update).not.toHaveBeenCalled()
    quiet.mockRestore()
  })

  it("mints a new account for a person who has none", async () => {
    vi.mocked(db.teacher.findFirst).mockResolvedValue(teacherRow(null) as never)
    vi.mocked(db.user.findFirst).mockResolvedValue(null)
    vi.mocked(db.user.create).mockResolvedValue({
      id: "u-new",
      email: "noor@example.com",
    } as never)

    const r = await generateCredentials({ role: "teacher", id: "t1" })

    expect(r.success && r.data).toMatchObject({
      username: "260099",
      password: "1122",
      isNew: true,
    })
    expect(lastSuccessfulSignIn).not.toHaveBeenCalled()
  })
})

describe("generateCredentials — a student", () => {
  const existing = {
    success: true as const,
    data: {
      username: "260064",
      email: null,
      password: null,
      isNew: false,
      isSelfOnboarded: false,
    },
  }
  const minted = {
    success: true as const,
    data: { ...existing.data, password: "3456" },
  }

  beforeEach(() => {
    vi.mocked(getStudentCredentials).mockResolvedValue(existing as never)
    vi.mocked(resetStudentPassword).mockResolvedValue(minted as never)
    vi.mocked(db.student.findFirst).mockResolvedValue({
      user: userRow({ username: "260064", email: null }),
      firstName: "عبد المحسن",
      middleName: null,
      lastName: "محمد",
      email: null,
      mobileNumber: null,
      alternatePhone: null,
      studentGuardians: [],
    } as never)
  })

  it("does not replace the PIN of a student who has signed in", async () => {
    vi.mocked(lastSuccessfulSignIn).mockResolvedValue(SIGNED_IN)

    const r = await generateCredentials({ role: "student", id: "st1" })

    expect(resetStudentPassword).not.toHaveBeenCalled()
    expect(r.success && r.data).toMatchObject({
      username: "260064",
      password: null,
      passwordKept: true,
      lastSignedInAt: SIGNED_IN.toISOString(),
    })
  })

  it("mints a PIN for a student who has never signed in", async () => {
    const r = await generateCredentials({ role: "student", id: "st1" })

    expect(resetStudentPassword).toHaveBeenCalledTimes(1)
    expect(r.success && r.data).toMatchObject({
      password: "3456",
      passwordKept: false,
      lastSignedInAt: null,
    })
  })

  it("an explicit reset mints without asking whether the login works", async () => {
    vi.mocked(lastSuccessfulSignIn).mockResolvedValue(SIGNED_IN)

    const r = await generateCredentials({
      role: "student",
      id: "st1",
      reset: true,
    })

    expect(resetStudentPassword).toHaveBeenCalledTimes(1)
    expect(getStudentCredentials).not.toHaveBeenCalled()
    expect(lastSuccessfulSignIn).not.toHaveBeenCalled()
    expect(r.success && r.data?.password).toBe("3456")
  })

  it("leaves a self-onboarded student's own password alone, as before", async () => {
    vi.mocked(getStudentCredentials).mockResolvedValue({
      success: true,
      data: { ...existing.data, isSelfOnboarded: true },
    } as never)

    const r = await generateCredentials({ role: "student", id: "st1" })

    expect(resetStudentPassword).not.toHaveBeenCalled()
    expect(lastSuccessfulSignIn).not.toHaveBeenCalled()
    expect(r.success && r.data?.password).toBeNull()
  })
})
