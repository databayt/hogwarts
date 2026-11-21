// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Quick-check DRAFT handling: a student or guardian never sees a draft or its
 * questions; a teacher edits, deletes and publishes only their own draft.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getStudentScopes } from "@/lib/teaching-scope"
import { getTenantContext } from "@/lib/tenant-context"
import {
  deleteQuickAssessment,
  getQuickAssessment,
  getQuickAssessments,
  launchQuickAssessment,
  updateQuickAssessment,
} from "@/components/school-dashboard/exams/quick/actions"

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
    quickAssessment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    questionBank: { findMany: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    conferenceResource: { deleteMany: vi.fn() },
    student: { findMany: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/teaching-scope", () => ({ getStudentScopes: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/components/school-dashboard/teaching-scope/resolve", () => ({
  resolveTeachingScope: vi.fn(),
}))
vi.mock("@/components/school-dashboard/grades/lib/gradebook", () => ({
  resolveStudentSubjectContext: vi.fn(),
  upsertGradebookResult: vi.fn(),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL = "school-1"
const ME = "teacher-1"

const as = (role: string, id = ME) =>
  vi.mocked(auth).mockResolvedValue({
    user: { id, schoolId: SCHOOL, role },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  } as never)

const draft = (over: Record<string, unknown> = {}) => ({
  id: "qa1",
  status: "DRAFT",
  createdBy: ME,
  questionIds: ["q1", "q2", "q3"],
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  as("TEACHER")
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    requestId: "r",
    role: "TEACHER",
    isPlatformAdmin: false,
  } as never)
  vi.mocked(db.$transaction).mockImplementation((async (ops: unknown[]) =>
    Promise.all(ops)) as never)
  vi.mocked(db.quickAssessment.findMany).mockResolvedValue([])
  vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(draft() as never)
  vi.mocked(db.questionBank.findMany).mockResolvedValue([])
})

describe("audience filter: students and guardians see no DRAFT", () => {
  beforeEach(() => {
    vi.mocked(db.student.findMany).mockResolvedValue([{ id: "stu1" }] as never)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
      { studentId: "stu1" },
    ] as never)
    vi.mocked(getStudentScopes).mockResolvedValue([
      { studentId: "stu1", sectionId: "7a", gradeId: "g7" },
    ])
  })

  it.each(["STUDENT", "GUARDIAN"])("%s list is limited to ACTIVE and CLOSED", async (role) => {
    as(role, "viewer")
    await getQuickAssessments()
    const where = vi.mocked(db.quickAssessment.findMany).mock.calls[0][0]!.where
    expect(where).toMatchObject({
      schoolId: SCHOOL,
      status: { in: ["ACTIVE", "CLOSED"] },
      OR: [
        { sectionId: { in: ["7a"] } },
        { sectionId: null, gradeId: { in: ["g7"] } },
      ],
    })
  })

  it("a single fetch (and so its questions) is limited the same way", async () => {
    as("STUDENT", "viewer")
    vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null)
    expect(await getQuickAssessment("qa1")).toBeNull()
    expect(
      vi.mocked(db.quickAssessment.findFirst).mock.calls[0][0]!.where
    ).toMatchObject({ id: "qa1", schoolId: SCHOOL, status: { in: ["ACTIVE", "CLOSED"] } })
    // No draft → the question bank is never read
    expect(db.questionBank.findMany).not.toHaveBeenCalled()
  })

  it("a teacher still sees drafts (no status filter)", async () => {
    as("TEACHER")
    await getQuickAssessments()
    const where = vi.mocked(db.quickAssessment.findMany).mock.calls[0][0]!
      .where as Record<string, unknown>
    expect(where.status).toBeUndefined()
    expect(where.schoolId).toBe(SCHOOL)
  })
})

describe("updateQuickAssessment", () => {
  it("refuses a non-author role", async () => {
    as("STUDENT")
    const r = await updateQuickAssessment("qa1", { title: "x" })
    expect(r.success).toBe(false)
    expect(db.quickAssessment.findFirst).not.toHaveBeenCalled()
  })

  it("scopes the lookup by school: another school's id is NOT_FOUND", async () => {
    vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null)
    const r = await updateQuickAssessment("qa-other", { title: "x" })
    expect(!r.success && r.code).toBe("NOT_FOUND")
    expect(vi.mocked(db.quickAssessment.findFirst).mock.calls[0][0]!.where).toEqual({
      id: "qa-other",
      schoolId: SCHOOL,
    })
    expect(db.quickAssessment.updateMany).not.toHaveBeenCalled()
  })

  it("refuses a published (non-draft) quick check", async () => {
    vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(
      draft({ status: "ACTIVE" }) as never
    )
    const r = await updateQuickAssessment("qa1", { title: "x" })
    expect(!r.success && r.code).toBe("NOT_DRAFT")
    expect(db.quickAssessment.updateMany).not.toHaveBeenCalled()
  })

  it("refuses another teacher's draft, but an admin may edit it", async () => {
    vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(
      draft({ createdBy: "someone-else" }) as never
    )
    const r = await updateQuickAssessment("qa1", { title: "x" })
    expect(!r.success && r.code).toBe("FORBIDDEN")

    as("ADMIN", "admin-1")
    const ok = await updateQuickAssessment("qa1", { title: "عنوان جديد" })
    expect(ok.success).toBe(true)
  })

  it("renames, reorders and removes, deleting the dropped hidden questions", async () => {
    const r = await updateQuickAssessment("qa1", {
      title: "  عنوان  ",
      questionIds: ["q3", "q1"],
    })
    expect(r.success).toBe(true)
    expect(db.quickAssessment.updateMany).toHaveBeenCalledWith({
      where: { id: "qa1", schoolId: SCHOOL, status: "DRAFT" },
      data: { title: "عنوان", questionIds: ["q3", "q1"] },
    })
    expect(db.questionBank.deleteMany).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL, id: { in: ["q2"] }, wizardStep: "ai-draft" },
    })
  })

  it("refuses a question that is not already in the quick check", async () => {
    const r = await updateQuickAssessment("qa1", { questionIds: ["q1", "foreign"] })
    expect(!r.success && r.code).toBe("VALIDATION_ERROR")
    expect(db.quickAssessment.updateMany).not.toHaveBeenCalled()
  })
})

describe("deleteQuickAssessment", () => {
  it("refuses a non-author role", async () => {
    as("GUARDIAN")
    expect((await deleteQuickAssessment("qa1")).success).toBe(false)
    expect(db.quickAssessment.deleteMany).not.toHaveBeenCalled()
  })

  it("other school's id is NOT_FOUND", async () => {
    vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(null)
    const r = await deleteQuickAssessment("qa-other")
    expect(!r.success && r.code).toBe("NOT_FOUND")
    expect(db.quickAssessment.deleteMany).not.toHaveBeenCalled()
  })

  it("refuses a published quick check and another teacher's draft", async () => {
    vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(
      draft({ status: "CLOSED" }) as never
    )
    expect((await deleteQuickAssessment("qa1")) as { code?: string }).toMatchObject({
      code: "NOT_DRAFT",
    })
    vi.mocked(db.quickAssessment.findFirst).mockResolvedValue(
      draft({ createdBy: "x" }) as never
    )
    expect((await deleteQuickAssessment("qa1")) as { code?: string }).toMatchObject({
      code: "FORBIDDEN",
    })
    expect(db.quickAssessment.deleteMany).not.toHaveBeenCalled()
  })

  it("deletes the draft with its links and its unlaunched AI questions", async () => {
    const r = await deleteQuickAssessment("qa1")
    expect(r.success).toBe(true)
    expect(db.conferenceResource.deleteMany).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL, quickAssessmentId: "qa1" },
    })
    expect(db.quickAssessment.deleteMany).toHaveBeenCalledWith({
      where: { id: "qa1", schoolId: SCHOOL, status: "DRAFT" },
    })
    expect(db.questionBank.deleteMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL,
        id: { in: ["q1", "q2", "q3"] },
        wizardStep: "ai-draft",
      },
    })
  })
})

describe("launchQuickAssessment un-hides the AI draft questions", () => {
  it("clears the ai-draft sentinel and activates, scoped by school", async () => {
    const r = await launchQuickAssessment("qa1")
    expect(r.success).toBe(true)
    expect(db.questionBank.updateMany).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL, id: { in: ["q1", "q2", "q3"] }, wizardStep: "ai-draft" },
      data: { wizardStep: null },
    })
    expect(db.quickAssessment.updateMany).toHaveBeenCalledWith({
      where: { id: "qa1", schoolId: SCHOOL },
      data: { status: "ACTIVE" },
    })
  })
})
