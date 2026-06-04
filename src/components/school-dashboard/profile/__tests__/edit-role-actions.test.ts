// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  canSelfEdit,
  getOwnEntity,
  getSelfEditableSteps,
} from "../edit-role-actions"

vi.mock("@/lib/db", () => ({
  db: {
    teacher: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))

const SCHOOL_ID = "school-1"
const USER_ID = "user-1"

function asAuthed() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
  } as never)
}

function asUnauthed() {
  vi.mocked(auth).mockResolvedValue(null as never)
}

function asAuthedNoSchool() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId: null } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getOwnEntity", () => {
  it("rejects unauthenticated callers", async () => {
    asUnauthed()
    const res = await getOwnEntity("teacher")
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("NOT_AUTHENTICATED")
  })

  it("rejects callers without a school context", async () => {
    asAuthedNoSchool()
    const res = await getOwnEntity("teacher")
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("MISSING_SCHOOL")
  })

  it("loads the teacher entity scoped by userId + schoolId", async () => {
    asAuthed()
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "tch-1" } as never)
    const res = await getOwnEntity("teacher")
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.entityId).toBe("tch-1")
    const call = vi.mocked(db.teacher.findFirst).mock.calls[0][0] as {
      where: { userId: string; schoolId: string }
    }
    expect(call.where).toMatchObject({ userId: USER_ID, schoolId: SCHOOL_ID })
  })

  it("returns TEACHER_NOT_FOUND when no teacher entity exists", async () => {
    asAuthed()
    vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
    const res = await getOwnEntity("teacher")
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("TEACHER_NOT_FOUND")
  })

  it("loads the student entity scoped by userId + schoolId", async () => {
    asAuthed()
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    const res = await getOwnEntity("student")
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.entityId).toBe("stu-1")
    const call = vi.mocked(db.student.findFirst).mock.calls[0][0] as {
      where: { userId: string; schoolId: string }
    }
    expect(call.where).toMatchObject({ userId: USER_ID, schoolId: SCHOOL_ID })
  })

  it("returns STUDENT_NOT_FOUND when no student entity exists", async () => {
    asAuthed()
    vi.mocked(db.student.findFirst).mockResolvedValue(null)
    const res = await getOwnEntity("student")
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("STUDENT_NOT_FOUND")
  })
})

describe("canSelfEdit / getSelfEditableSteps (shared SELF_EDITABLE_STEPS)", () => {
  it("allows a teacher to self-edit contact, qualifications, experience", async () => {
    expect(await canSelfEdit("teacher", "contact")).toBe(true)
    expect(await canSelfEdit("teacher", "qualifications")).toBe(true)
    expect(await canSelfEdit("teacher", "experience")).toBe(true)
  })

  it("forbids a teacher from self-editing admin-only sections", async () => {
    expect(await canSelfEdit("teacher", "employment")).toBe(false)
  })

  it("allows a student to self-edit only contact", async () => {
    expect(await canSelfEdit("student", "contact")).toBe(true)
    expect(await canSelfEdit("student", "enrollment")).toBe(false)
  })

  it("returns the self-editable step lists from the single source", async () => {
    expect(await getSelfEditableSteps("teacher")).toEqual([
      "contact",
      "qualifications",
      "experience",
    ])
    expect(await getSelfEditableSteps("student")).toEqual(["contact"])
  })
})
