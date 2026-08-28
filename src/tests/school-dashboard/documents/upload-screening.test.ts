// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * `createDocumentTemplate`'s three outcomes.
 *
 * `docx-validate.test.ts` proves the validator reads a `.docx` correctly; this
 * proves the ACTION acts on that reading — which is the half that decides
 * whether a school ends up with an unfillable template sitting in its list. The
 * branching is deliberately asymmetric (refuse one case, store the other two)
 * and easy to "simplify" into a single path by someone who has not seen the
 * bug, so it is pinned here.
 *
 * The validator itself runs for real against real `.docx` buffers; only the
 * network fetch, auth, and db are mocked.
 */
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { loadTemplateBufferFromUrl } from "@/lib/docx-fill"
import { buildDocx } from "@/lib/docx-fill/build"
import { getTenantContext } from "@/lib/tenant-context"
import { createDocumentTemplate } from "@/components/school-dashboard/documents/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    documentTemplate: { create: vi.fn() },
    school: { findUnique: vi.fn() },
  },
}))

// Partial mock: the fetch is stubbed, `validateDocxTemplate` stays REAL — the
// point of this suite is that the action reads a genuine `.docx` correctly.
vi.mock("@/lib/docx-fill", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/docx-fill")>()
  return { ...actual, loadTemplateBufferFromUrl: vi.fn() }
})

const SCHOOL = "school-1"

const input = {
  category: "EXAM_PAPER" as const,
  name: "Ministry exam paper",
  fileUrl: "https://cdn.example/tpl.docx",
}

/** Serve `buffer` as the uploaded file. */
function uploaded(buffer: Buffer) {
  vi.mocked(loadTemplateBufferFromUrl).mockResolvedValue(buffer)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u-1", role: "ADMIN" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId: SCHOOL } as never)
  vi.mocked(db.documentTemplate.create).mockResolvedValue({
    id: "tpl-1",
  } as never)
})

describe("createDocumentTemplate — refuses what can never fill", () => {
  it("does not store a template whose loop is never closed", async () => {
    uploaded(buildDocx([{ text: "{{#questions}}" }, { text: "{{order}}" }]))

    const res = await createDocumentTemplate(input)

    expect(res.success).toBe(false)
    expect(res.error).toBe("TEMPLATE_INVALID")
    // The whole point: no row. Storing it is what made the template sit in the
    // list looking healthy while every fill failed.
    expect(db.documentTemplate.create).not.toHaveBeenCalled()
  })

  it("names the offending tag so the school can fix it in Word", async () => {
    uploaded(buildDocx([{ text: "{{#questions}}" }, { text: "{{order}}" }]))

    const res = await createDocumentTemplate(input)

    expect(res.details).toBe("questions")
  })

  it("refuses a file it cannot even read", async () => {
    vi.mocked(loadTemplateBufferFromUrl).mockRejectedValue(
      new Error("fetch failed")
    )

    const res = await createDocumentTemplate(input)

    expect(res.error).toBe("TEMPLATE_INVALID")
    expect(db.documentTemplate.create).not.toHaveBeenCalled()
  })
})

describe("createDocumentTemplate — stores what fills, with warnings", () => {
  it("stores a single-brace template and reports the markers", async () => {
    // It fills mechanically, and a bare `{word}` can be innocent prose — so
    // this is a warning, NOT a rejection.
    uploaded(
      buildDocx([
        { text: "{{schoolName}}" },
        { text: "{#questions}" },
        { text: "{{order}}. {{text}}" },
        { text: "{/questions}" },
      ])
    )

    const res = await createDocumentTemplate(input)

    expect(res.success).toBe(true)
    expect(db.documentTemplate.create).toHaveBeenCalled()
    expect(res.data?.singleBraceMarkers).toEqual(
      expect.arrayContaining(["{#questions}", "{/questions}"])
    )
  })

  it("stores a misspelled tag and flags it as unknown", async () => {
    uploaded(
      buildDocx([{ text: "{{schoolName}}" }, { text: "{{schoolNmae}}" }])
    )

    const res = await createDocumentTemplate(input)

    expect(res.success).toBe(true)
    expect(res.data?.unknownFields).toEqual(["schoolNmae"])
    // The correctly-spelled sibling must NOT be flagged.
    expect(res.data?.mergeFields).toContain("schoolName")
  })

  it("persists the detected tags on the row", async () => {
    uploaded(buildDocx([{ text: "{{schoolName}}" }, { text: "{{examTitle}}" }]))

    await createDocumentTemplate(input)

    const arg = vi.mocked(db.documentTemplate.create).mock.calls[0][0]
    const data = (arg as { data: Record<string, unknown> }).data
    expect(data.mergeFields).toEqual(
      expect.arrayContaining(["schoolName", "examTitle"])
    )
    expect(data.schoolId).toBe(SCHOOL)
  })

  it("reports a clean template with nothing to warn about", async () => {
    uploaded(
      buildDocx([
        { text: "{{schoolName}}" },
        { text: "{{#sections}}" },
        { text: "{{number}}. {{title}}" },
        { text: "{{#questions}}" },
        { text: "{{order}}. {{text}}" },
        { text: "{{/questions}}" },
        { text: "{{/sections}}" },
      ])
    )

    const res = await createDocumentTemplate(input)

    expect(res.success).toBe(true)
    expect(res.data?.unknownFields).toEqual([])
    expect(res.data?.singleBraceMarkers).toEqual([])
  })

  it("still stores a template with no tags at all", async () => {
    // Fills as an unchanged copy of itself — worth warning about (the dialog
    // does), but the school may be mid-edit. Not a rejection.
    uploaded(buildDocx([{ text: "Plain letterhead, no tags" }]))

    const res = await createDocumentTemplate(input)

    expect(res.success).toBe(true)
    expect(res.data?.mergeFields).toEqual([])
  })
})

describe("createDocumentTemplate — the gate still applies", () => {
  it("is closed to non-manager roles before it reads any file", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u-1", role: "STUDENT" },
    } as never)

    const res = await createDocumentTemplate(input)

    expect(res.error).toBe("UNAUTHORIZED")
    expect(loadTemplateBufferFromUrl).not.toHaveBeenCalled()
  })

  it("judges unknown tags against the template's OWN category", async () => {
    // `studentName` is a REPORT_CARD field and NOT an EXAM_PAPER one, so the
    // same file is clean in one category and flagged in the other.
    uploaded(buildDocx([{ text: "{{studentName}}" }]))
    const asExam = await createDocumentTemplate(input)
    expect(asExam.data?.unknownFields).toEqual(["studentName"])

    uploaded(buildDocx([{ text: "{{studentName}}" }]))
    const asReport = await createDocumentTemplate({
      ...input,
      category: "REPORT_CARD",
    })
    expect(asReport.data?.unknownFields).toEqual([])
  })
})
