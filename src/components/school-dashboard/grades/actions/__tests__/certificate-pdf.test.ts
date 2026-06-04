// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getProvider } from "@/components/file/providers/factory"

import {
  batchGenerateCertificatePDFs,
  generateCertificatePDF,
  previewCertificate,
  renderPendingCertificatePDFs,
} from "../certificate-pdf"

vi.mock("@/lib/db", () => ({
  db: {
    examCertificate: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    examCertificateConfig: { findFirst: vi.fn() },
  },
}))

// Keep the heavy React-PDF template tree out of the test — we only care
// that the action renders SOMETHING and persists the uploaded URL.
vi.mock("@react-pdf/renderer", () => ({ renderToBuffer: vi.fn() }))
// NOTE: vi.mock paths resolve relative to THIS test file. certificate-pdf.ts
// imports `../templates/composable` (= grades/templates/composable); from
// grades/actions/__tests__/ that same module is `../../templates/composable`.
vi.mock("../../templates/composable", () => ({
  ComposableCertificate: () => null,
}))
vi.mock("@/components/file/providers/factory", () => ({ getProvider: vi.fn() }))
vi.mock("@/lib/i18n-format", () => ({ formatDate: () => "2026-01-01" }))

const SCHOOL = "school-1"

function asSchool(schoolId: string | null = SCHOOL) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role: "ADMIN", schoolId },
  } as never)
}

const uploadMock = vi.fn()

function mockCert(over: Record<string, unknown> = {}) {
  return {
    id: "cert-1",
    recipientName: "John Smith",
    recipientNameAr: null,
    examTitle: "Final Exam",
    examDate: new Date("2026-01-01"),
    score: 92,
    grade: "A",
    rank: null,
    certificateNumber: "CERT-1",
    verificationCode: "VC1",
    verificationUrl: null,
    student: { studentId: "2026-1", photoUrl: null },
    config: {
      titleText: "Certificate",
      titleTextAr: null,
      bodyTemplate: "Awarded to {{studentName}} — {{score}} on {{date}}",
      bodyTemplateAr: null,
      signatures: [{ name: "Principal", title: "Head", signatureUrl: "u" }],
      templateStyle: "elegant",
      orientation: "landscape",
      pageSize: "A4",
      compositionConfig: null,
      regionPreset: null,
    },
    school: { name: "Demo School", logoUrl: null },
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  asSchool(SCHOOL)
  uploadMock.mockResolvedValue("https://cdn/certificates/x.pdf")
  vi.mocked(getProvider).mockReturnValue({
    upload: uploadMock,
  } as never)
  vi.mocked(renderToBuffer).mockResolvedValue(Buffer.from("%PDF-fake") as never)
})

describe("generateCertificatePDF", () => {
  it("renders, uploads to S3 and persists pdfUrl (schoolId-scoped lookup)", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue(
      mockCert() as never
    )
    vi.mocked(db.examCertificate.update).mockResolvedValue({} as never)

    const r = await generateCertificatePDF("cert-1", "en")

    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.pdfUrl).toBe("https://cdn/certificates/x.pdf")
    expect(renderToBuffer).toHaveBeenCalled()
    expect(uploadMock).toHaveBeenCalled()

    const where = vi.mocked(db.examCertificate.findFirst).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      id: "cert-1",
      schoolId: SCHOOL,
    })
    const updateArg = vi.mocked(db.examCertificate.update).mock.calls[0][0]
    expect(
      (updateArg as { data: { pdfUrl: string } }).data.pdfUrl
    ).toBe("https://cdn/certificates/x.pdf")
  })

  it("rejects when not authenticated", async () => {
    asSchool(null)
    const r = await generateCertificatePDF("cert-1")
    expect(r.success).toBe(false)
  })

  it("404s for a missing / cross-tenant certificate", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue(null)
    const r = await generateCertificatePDF("cert-x")
    expect(r.success).toBe(false)
    expect(db.examCertificate.update).not.toHaveBeenCalled()
  })

  it("reports failure when rendering throws (no pdfUrl written)", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue(
      mockCert() as never
    )
    vi.mocked(renderToBuffer).mockRejectedValue(new Error("render boom"))
    const r = await generateCertificatePDF("cert-1")
    expect(r.success).toBe(false)
    expect(db.examCertificate.update).not.toHaveBeenCalled()
  })
})

describe("batchGenerateCertificatePDFs", () => {
  it("renders only certs missing a pdfUrl and accounts results", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
      id: "cfg-1",
      templateStyle: "elegant",
      orientation: "landscape",
      pageSize: "A4",
      compositionConfig: null,
      regionPreset: null,
      titleText: "Certificate",
      titleTextAr: null,
      bodyTemplate: "Awarded to {{studentName}}",
      bodyTemplateAr: null,
      signatures: [],
    } as never)
    vi.mocked(db.examCertificate.findMany).mockResolvedValue([
      mockCert({ id: "c1" }),
      mockCert({ id: "c2" }),
    ] as never)
    vi.mocked(db.examCertificate.update).mockResolvedValue({} as never)

    const r = await batchGenerateCertificatePDFs("cfg-1", "exam-1", "en")

    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data?.generated).toBe(2)
      expect(r.data?.failed).toBe(0)
    }
    // the work-queue filter must include pdfUrl: null + schoolId
    const where = vi.mocked(db.examCertificate.findMany).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      schoolId: SCHOOL,
      configId: "cfg-1",
      pdfUrl: null,
      status: "active",
    })
  })

  it("CONFIG_NOT_FOUND-style failure when config missing", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(null)
    const r = await batchGenerateCertificatePDFs("cfg-x")
    expect(r.success).toBe(false)
  })
})

describe("renderPendingCertificatePDFs (cron worker)", () => {
  it("renders pending certs across schools and writes pdfUrl", async () => {
    vi.mocked(db.examCertificate.findMany).mockResolvedValue([
      {
        ...mockCert({ id: "c1" }),
        schoolId: "school-a",
        school: {
          name: "School A",
          logoUrl: null,
          preferredLanguage: "ar",
        },
      },
      {
        ...mockCert({ id: "c2" }),
        schoolId: "school-b",
        school: {
          name: "School B",
          logoUrl: null,
          preferredLanguage: "en",
        },
      },
    ] as never)
    vi.mocked(db.examCertificate.update).mockResolvedValue({} as never)

    const r = await renderPendingCertificatePDFs({ limit: 10 })

    expect(r.processed).toBe(2)
    expect(r.generated).toBe(2)
    expect(r.failed).toBe(0)
    // work-queue filter: only un-rendered, active certs
    const where = vi.mocked(db.examCertificate.findMany).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      pdfUrl: null,
      status: "active",
    })
    expect(db.examCertificate.update).toHaveBeenCalledTimes(2)
  })

  it("counts a failure without throwing the whole run", async () => {
    vi.mocked(db.examCertificate.findMany).mockResolvedValue([
      {
        ...mockCert({ id: "c1" }),
        schoolId: "school-a",
        school: { name: "A", logoUrl: null, preferredLanguage: "ar" },
      },
    ] as never)
    vi.mocked(renderToBuffer).mockRejectedValue(new Error("render boom"))

    const r = await renderPendingCertificatePDFs()

    expect(r.processed).toBe(1)
    expect(r.generated).toBe(0)
    expect(r.failed).toBe(1)
    expect(db.examCertificate.update).not.toHaveBeenCalled()
  })
})

describe("previewCertificate", () => {
  it("returns a base64 PDF without persisting anything", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
      id: "cfg-1",
      templateStyle: "elegant",
      orientation: "landscape",
      pageSize: "A4",
      compositionConfig: null,
      regionPreset: null,
      titleText: "Certificate",
      titleTextAr: null,
      bodyTemplate: "Body",
      bodyTemplateAr: null,
      signatures: [],
      school: { name: "Demo School", logoUrl: null },
    } as never)

    const r = await previewCertificate("cfg-1", "en")

    expect(r.success).toBe(true)
    if (r.success) {
      expect(typeof r.data?.pdfBase64).toBe("string")
      expect(r.data?.pdfBase64.length).toBeGreaterThan(0)
    }
    expect(db.examCertificate.update).not.toHaveBeenCalled()
  })
})
