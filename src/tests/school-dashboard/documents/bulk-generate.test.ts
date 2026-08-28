// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The bulk fill path. Two things are worth pinning:
 *
 *  - the `BULK_MAX_ENTITIES` cap, which is a real memory/payload guard (a filled
 *    document is held in memory, zipped, then base64'd into the action response
 *    — a whole term in one call is tens of megabytes), not a style choice; and
 *  - the role gate, since the resolver scopes by `schoolId` but takes an
 *    arbitrary entity id.
 */
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { BULK_MAX_ENTITIES } from "@/components/school-dashboard/documents/config"
import { generateFromDefaultTemplateBulk } from "@/components/school-dashboard/documents/generate"
import { getReportCardIdsForTemplate } from "@/components/school-dashboard/grades/actions/report-cards"

vi.mock("@/lib/db", () => ({
  db: {
    documentTemplate: { findFirst: vi.fn() },
    reportCard: { findMany: vi.fn() },
    school: { findUnique: vi.fn() },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/docx-fill", () => ({
  fillDocxTemplate: vi.fn(() => Buffer.from("docx")),
  loadTemplateBufferFromUrl: vi.fn(async () => Buffer.from("tpl")),
}))
vi.mock("@/components/school-dashboard/documents/resolvers", () => ({
  resolveDocumentData: vi.fn(async () => ({ studentName: "Sara" })),
}))

const SCHOOL = "school-1"

function asRole(role: string | null, schoolId: string | null = SCHOOL) {
  vi.mocked(auth).mockResolvedValue(
    role ? ({ user: { id: "u-1", role, schoolId } } as never) : null
  )
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  asRole("ADMIN")
  vi.mocked(db.school.findUnique).mockResolvedValue({
    preferredLanguage: "ar",
  } as never)
  vi.mocked(db.documentTemplate.findFirst).mockResolvedValue({
    id: "tpl-1",
    name: "Report card",
    category: "REPORT_CARD",
    fileUrl: "https://cdn.example/tpl.docx",
  } as never)
})

describe("generateFromDefaultTemplateBulk", () => {
  it("zips one document per entity", async () => {
    const r = await generateFromDefaultTemplateBulk("REPORT_CARD", [
      "rc-1",
      "rc-2",
    ])
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data?.mime).toBe("application/zip")
      expect(r.data?.filename).toContain("2")
    }
  })

  it("refuses a slice larger than the cap instead of building it", async () => {
    const ids = Array.from(
      { length: BULK_MAX_ENTITIES + 1 },
      (_, i) => `rc-${i}`
    )
    const r = await generateFromDefaultTemplateBulk("REPORT_CARD", ids)
    expect(r.success).toBe(false)
    // The template is never even loaded — the guard fires first.
    expect(db.documentTemplate.findFirst).not.toHaveBeenCalled()
  })

  it("refuses an empty slice", async () => {
    const r = await generateFromDefaultTemplateBulk("REPORT_CARD", [])
    expect(r.success).toBe(false)
  })

  it("is closed to non-manager roles", async () => {
    asRole("STUDENT")
    const r = await generateFromDefaultTemplateBulk("REPORT_CARD", ["rc-1"])
    expect(r.success).toBe(false)
    expect(db.documentTemplate.findFirst).not.toHaveBeenCalled()
  })

  it("reports a school with no uploaded template rather than throwing", async () => {
    vi.mocked(db.documentTemplate.findFirst).mockResolvedValue(null as never)
    const r = await generateFromDefaultTemplateBulk("REPORT_CARD", ["rc-1"])
    expect(r.success).toBe(false)
  })
})

describe("getReportCardIdsForTemplate", () => {
  it("returns rank-ordered ids scoped by schoolId and term", async () => {
    vi.mocked(db.reportCard.findMany).mockResolvedValue([
      { id: "rc-1" },
      { id: "rc-2" },
    ] as never)

    const r = await getReportCardIdsForTemplate({
      termId: "term-1",
      gradeId: "ag-1",
    })

    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.ids).toEqual(["rc-1", "rc-2"])

    const arg = vi.mocked(db.reportCard.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>
      orderBy: unknown
    }
    expect(arg.where).toMatchObject({ schoolId: SCHOOL, termId: "term-1" })
    expect(arg.where.student).toEqual({ academicGradeId: "ag-1" })
    expect(arg.orderBy).toEqual({ rank: "asc" })
  })

  it("is closed to non-staff roles", async () => {
    asRole("STUDENT")
    const r = await getReportCardIdsForTemplate({ termId: "term-1" })
    expect(r.success).toBe(false)
    expect(db.reportCard.findMany).not.toHaveBeenCalled()
  })
})
