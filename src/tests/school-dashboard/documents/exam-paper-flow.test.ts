// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { generateExamPaperFromTemplate } from "@/components/school-dashboard/documents/exam-paper-flow"
import { generateDocument } from "@/components/school-dashboard/documents/generate"
import { autoGenerateExamQuestions } from "@/components/school-dashboard/exams/wizard/exam-wizard-v2/questions/auto-generate"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))

vi.mock("@/lib/db", () => ({
  db: {
    generatedExam: { findFirst: vi.fn(), create: vi.fn() },
    schoolExamTemplate: { findFirst: vi.fn() },
    class: { findFirst: vi.fn() },
    schoolExam: { create: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock(
  "@/components/school-dashboard/exams/wizard/exam-wizard-v2/questions/auto-generate",
  () => ({ autoGenerateExamQuestions: vi.fn() })
)

vi.mock("@/components/school-dashboard/documents/generate", () => ({
  generateDocument: vi.fn(),
}))

const SCHOOL_A = "school-1"
const EXAM_ID = "exam-1"
const GENERATED_ID = "gen-1"

const blueprintInput = {
  mode: "blueprint" as const,
  documentTemplateId: "tpl-1",
  blueprintId: "bp-1",
  classId: "class-1",
  title: "Geography — final",
  examDate: "2026-08-01",
  examType: "FINAL" as const,
}

function signInAs(role: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_A,
  } as never)
}

/** Happy-path stubs for the blueprint branch, up to question selection. */
function stubBlueprintPath() {
  vi.mocked(db.schoolExamTemplate.findFirst).mockResolvedValue({
    id: "bp-1",
    subjectId: "subj-1",
    duration: 60,
    totalMarks: 40,
  } as never)
  vi.mocked(db.class.findFirst).mockResolvedValue({ id: "class-1" } as never)
  vi.mocked(db.$transaction).mockResolvedValue({
    examId: EXAM_ID,
    generatedExamId: GENERATED_ID,
  } as never)
}

describe("generateExamPaperFromTemplate", () => {
  beforeEach(() => vi.clearAllMocks())

  it("refuses roles that cannot manage templates", async () => {
    signInAs("STUDENT")
    const res = await generateExamPaperFromTemplate(blueprintInput)
    expect(res.success).toBe(false)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("will not fill a generated exam belonging to another school", async () => {
    signInAs("ADMIN")
    // Tenant-scoped lookup finds nothing → the id is not ours.
    vi.mocked(db.generatedExam.findFirst).mockResolvedValue(null)

    const res = await generateExamPaperFromTemplate({
      mode: "existing",
      documentTemplateId: "tpl-1",
      generatedExamId: "someone-elses",
    })

    expect(res.success).toBe(false)
    expect(generateDocument).not.toHaveBeenCalled()
  })

  it("rolls the new exam back when the question bank cannot satisfy the blueprint", async () => {
    signInAs("ADMIN")
    stubBlueprintPath()
    vi.mocked(autoGenerateExamQuestions).mockResolvedValue({
      success: false,
      error: "No matching questions in the bank for this template.",
    } as never)

    const res = await generateExamPaperFromTemplate(blueprintInput)

    expect(res.success).toBe(false)
    // The empty exam must not survive on the school's schedule.
    expect(db.schoolExam.deleteMany).toHaveBeenCalledWith({
      where: { id: EXAM_ID, schoolId: SCHOOL_A },
    })
    expect(generateDocument).not.toHaveBeenCalled()
  })

  it("rolls the new exam back when the document fill fails", async () => {
    signInAs("ADMIN")
    stubBlueprintPath()
    vi.mocked(autoGenerateExamQuestions).mockResolvedValue({
      success: true,
      data: { totalQuestions: 10 },
    } as never)
    vi.mocked(generateDocument).mockResolvedValue({
      success: false,
      error: "TEMPLATE_NOT_FOUND",
    } as never)

    const res = await generateExamPaperFromTemplate(blueprintInput)

    expect(res.success).toBe(false)
    expect(db.schoolExam.deleteMany).toHaveBeenCalledWith({
      where: { id: EXAM_ID, schoolId: SCHOOL_A },
    })
  })

  it("keeps the exam and returns the document on success", async () => {
    signInAs("TEACHER")
    stubBlueprintPath()
    vi.mocked(autoGenerateExamQuestions).mockResolvedValue({
      success: true,
      data: { totalQuestions: 10 },
    } as never)
    vi.mocked(generateDocument).mockResolvedValue({
      success: true,
      data: { filename: "paper.docx", base64: "AAA", mime: "application/docx" },
    } as never)

    const res = await generateExamPaperFromTemplate(blueprintInput)

    expect(res.success).toBe(true)
    expect(db.schoolExam.deleteMany).not.toHaveBeenCalled()
    expect(generateDocument).toHaveBeenCalledWith("tpl-1", GENERATED_ID)
  })

  it("rejects a blueprint request missing its class", async () => {
    signInAs("ADMIN")
    const res = await generateExamPaperFromTemplate({
      ...blueprintInput,
      classId: "",
    })
    expect(res.success).toBe(false)
    expect(db.$transaction).not.toHaveBeenCalled()
  })
})
