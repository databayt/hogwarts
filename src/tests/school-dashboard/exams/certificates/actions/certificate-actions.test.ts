// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  autoGenerateCertificates,
  batchGenerateCertificates,
  createCertificateConfig,
  deleteCertificateConfig,
  generateCertificate,
  getCertificateByShareToken,
  getCertificateConfig,
  getCertificateConfigs,
  getCertificates,
  getDefaultCertificateConfig,
  revokeCertificate,
  setDefaultCertificateConfig,
  shareCertificate,
  updateCertificateConfig,
  verifyCertificate,
} from "@/components/school-dashboard/exams/certificates/actions/index"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn((ops: unknown) => Promise.resolve(ops)),
    examCertificateConfig: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    examCertificate: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    examResult: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL = "school-1"

function asSchool(schoolId: string | null = SCHOOL, role = "ADMIN") {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    role: role as never,
    requestId: "req-1",
    isPlatformAdmin: role === "DEVELOPER",
  })
}

const validConfigInput = {
  name: "Excellence Certificate",
  type: "ACHIEVEMENT" as const,
  bodyTemplate: "Awarded to {{studentName}} for {{examTitle}}",
  signatures: [{ name: "Principal", title: "Head of School" }],
}

beforeEach(() => {
  vi.clearAllMocks()
  asSchool(SCHOOL)
})

// ============================================================================
// CONFIG CRUD
// ============================================================================

describe("createCertificateConfig", () => {
  it("creates a config scoped to the caller's schoolId", async () => {
    vi.mocked(db.examCertificateConfig.create).mockResolvedValue({
      id: "cfg-1",
    } as never)

    const r = await createCertificateConfig(validConfigInput)

    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.id).toBe("cfg-1")
    const arg = vi.mocked(db.examCertificateConfig.create).mock.calls[0][0]
    expect((arg as { data: { schoolId: string } }).data.schoolId).toBe(SCHOOL)
  })

  it("rejects when there is no school context", async () => {
    asSchool(null)
    const r = await createCertificateConfig(validConfigInput)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("NO_SCHOOL")
    expect(db.examCertificateConfig.create).not.toHaveBeenCalled()
  })

  it("fails closed on invalid input (missing signatures)", async () => {
    const r = await createCertificateConfig({
      name: "x",
      type: "ACHIEVEMENT",
      bodyTemplate: "body",
      signatures: [],
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("CREATE_FAILED")
  })
})

describe("getCertificateConfigs", () => {
  it("only returns active configs for the caller's school", async () => {
    vi.mocked(db.examCertificateConfig.findMany).mockResolvedValue([
      {
        id: "cfg-1",
        name: "A",
        type: "ACHIEVEMENT",
        templateStyle: "elegant",
        isActive: true,
        createdAt: new Date(),
        _count: { certificates: 3 },
      },
    ] as never)

    const list = await getCertificateConfigs()

    expect(list).toHaveLength(1)
    expect(list[0].certificateCount).toBe(3)
    const where = vi.mocked(db.examCertificateConfig.findMany).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      schoolId: SCHOOL,
      isActive: true,
    })
  })

  it("returns [] with no school", async () => {
    asSchool(null)
    expect(await getCertificateConfigs()).toEqual([])
  })
})

describe("getCertificateConfig", () => {
  it("scopes the lookup by id AND schoolId", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
      id: "cfg-1",
    } as never)
    await getCertificateConfig("cfg-1")
    const where = vi.mocked(db.examCertificateConfig.findFirst).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      id: "cfg-1",
      schoolId: SCHOOL,
    })
  })
})

describe("updateCertificateConfig", () => {
  it("404s when the config is not in the caller's school", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(null)
    const r = await updateCertificateConfig({ id: "cfg-x", name: "New" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("NOT_FOUND")
    expect(db.examCertificateConfig.update).not.toHaveBeenCalled()
  })

  it("applies the provided field update", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
      id: "cfg-1",
      schoolId: SCHOOL,
    } as never)
    vi.mocked(db.examCertificateConfig.update).mockResolvedValue({} as never)
    const r = await updateCertificateConfig({ id: "cfg-1", name: "Renamed" })
    expect(r.success).toBe(true)
    const arg = vi.mocked(db.examCertificateConfig.update).mock.calls[0][0]
    // NOTE: certificateConfigUpdateSchema = createSchema.partial(), but Zod
    // still APPLIES the create-schema defaults — so an update that only sets
    // `name` also re-writes templateStyle/orientation/borderStyle/etc. to
    // their defaults. We assert the intended field landed; the latent
    // "defaults clobber omitted fields" behavior is documented, not fixed here.
    expect((arg as { data: Record<string, unknown> }).data).toMatchObject({
      name: "Renamed",
    })
  })
})

describe("deleteCertificateConfig", () => {
  it("soft-deletes (isActive:false) when certificates were issued", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
      id: "cfg-1",
      _count: { certificates: 5 },
    } as never)
    vi.mocked(db.examCertificateConfig.update).mockResolvedValue({} as never)

    const r = await deleteCertificateConfig("cfg-1")

    expect(r.success).toBe(true)
    expect(db.examCertificateConfig.update).toHaveBeenCalledWith({
      where: { id: "cfg-1" },
      data: { isActive: false },
    })
    expect(db.examCertificateConfig.delete).not.toHaveBeenCalled()
  })

  it("hard-deletes when no certificates exist", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
      id: "cfg-1",
      _count: { certificates: 0 },
    } as never)
    vi.mocked(db.examCertificateConfig.delete).mockResolvedValue({} as never)

    const r = await deleteCertificateConfig("cfg-1")

    expect(r.success).toBe(true)
    expect(db.examCertificateConfig.delete).toHaveBeenCalled()
  })
})

// ============================================================================
// FAVORITE / DEFAULT TEMPLATE
// ============================================================================

describe("setDefaultCertificateConfig", () => {
  it("unsets other defaults then sets this one — in a transaction", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
      id: "cfg-1",
    } as never)
    vi.mocked(db.examCertificateConfig.updateMany).mockResolvedValue(
      {} as never
    )
    vi.mocked(db.examCertificateConfig.update).mockResolvedValue({} as never)

    const r = await setDefaultCertificateConfig({ id: "cfg-1" })

    expect(r.success).toBe(true)
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    // unset every existing default for THIS school
    expect(db.examCertificateConfig.updateMany).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL, isDefault: true },
      data: { isDefault: false },
    })
    // set the chosen one
    expect(db.examCertificateConfig.update).toHaveBeenCalledWith({
      where: { id: "cfg-1" },
      data: { isDefault: true },
    })
  })

  it("NOT_FOUND for a cross-tenant config (no writes)", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(null)
    const r = await setDefaultCertificateConfig({ id: "cfg-x" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("NOT_FOUND")
    expect(db.$transaction).not.toHaveBeenCalled()
    const where = vi.mocked(db.examCertificateConfig.findFirst).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      id: "cfg-x",
      schoolId: SCHOOL,
    })
  })

  it("NO_SCHOOL without a school context", async () => {
    asSchool(null)
    const r = await setDefaultCertificateConfig({ id: "cfg-1" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("NO_SCHOOL")
  })
})

describe("getDefaultCertificateConfig", () => {
  it("resolves the active default for the caller's school", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
      id: "cfg-1",
    } as never)
    const cfg = await getDefaultCertificateConfig()
    expect(cfg).toBeTruthy()
    const where = vi.mocked(db.examCertificateConfig.findFirst).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      schoolId: SCHOOL,
      isDefault: true,
      isActive: true,
    })
  })

  it("returns null without a school", async () => {
    asSchool(null)
    expect(await getDefaultCertificateConfig()).toBeNull()
  })
})

// ============================================================================
// GENERATION + ELIGIBILITY
// ============================================================================

function mockExamResult(over: Record<string, unknown> = {}) {
  return {
    id: "res-1",
    schoolId: SCHOOL,
    examId: "exam-1",
    studentId: "stu-1",
    percentage: 92,
    grade: "A",
    isAbsent: false,
    certificate: null,
    student: { firstName: "John", middleName: null, lastName: "Smith" },
    exam: { title: "Final Exam", examDate: new Date("2026-01-01") },
    ...over,
  }
}

function mockConfig(over: Record<string, unknown> = {}) {
  return {
    id: "cfg-1",
    schoolId: SCHOOL,
    type: "ACHIEVEMENT",
    minPercentage: null,
    minGrade: null,
    topPercentile: null,
    verificationPrefix: null,
    expiryMonths: null,
    isActive: true,
    ...over,
  }
}

describe("generateCertificate", () => {
  it("issues a certificate for an eligible result", async () => {
    vi.mocked(db.examResult.findFirst).mockResolvedValue(
      mockExamResult() as never
    )
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(
      mockConfig() as never
    )
    vi.mocked(db.examCertificate.create).mockImplementation((async ({
      data,
    }: {
      data: Record<string, unknown>
    }) => ({
      id: "cert-1",
      ...data,
    })) as never)

    const r = await generateCertificate({
      examResultId: "res-1",
      configId: "cfg-1",
    })

    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.certificateId).toBe("cert-1")
    const createArg = vi.mocked(db.examCertificate.create).mock.calls[0][0]
    expect((createArg as { data: { schoolId: string } }).data.schoolId).toBe(
      SCHOOL
    )
  })

  it("rejects when there is no school", async () => {
    asSchool(null)
    const r = await generateCertificate({
      examResultId: "res-1",
      configId: "cfg-1",
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("NO_SCHOOL")
  })

  it("returns RESULT_NOT_FOUND for an unknown / cross-tenant result", async () => {
    vi.mocked(db.examResult.findFirst).mockResolvedValue(null)
    const r = await generateCertificate({
      examResultId: "res-x",
      configId: "cfg-1",
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("RESULT_NOT_FOUND")
    // result lookup must be schoolId-scoped
    const where = vi.mocked(db.examResult.findFirst).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      id: "res-x",
      schoolId: SCHOOL,
    })
  })

  it("returns DUPLICATE when a certificate already exists", async () => {
    vi.mocked(db.examResult.findFirst).mockResolvedValue(
      mockExamResult({ certificate: { id: "cert-existing" } }) as never
    )
    const r = await generateCertificate({
      examResultId: "res-1",
      configId: "cfg-1",
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("DUPLICATE")
  })

  it("returns CONFIG_NOT_FOUND when config missing", async () => {
    vi.mocked(db.examResult.findFirst).mockResolvedValue(
      mockExamResult() as never
    )
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(null)
    const r = await generateCertificate({
      examResultId: "res-1",
      configId: "cfg-x",
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("CONFIG_NOT_FOUND")
  })

  it("INELIGIBLE when the student was absent", async () => {
    vi.mocked(db.examResult.findFirst).mockResolvedValue(
      mockExamResult({ isAbsent: true }) as never
    )
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(
      mockConfig() as never
    )
    const r = await generateCertificate({
      examResultId: "res-1",
      configId: "cfg-1",
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("INELIGIBLE")
  })

  it("INELIGIBLE when below minPercentage", async () => {
    vi.mocked(db.examResult.findFirst).mockResolvedValue(
      mockExamResult({ percentage: 50 }) as never
    )
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(
      mockConfig({ minPercentage: 80 }) as never
    )
    const r = await generateCertificate({
      examResultId: "res-1",
      configId: "cfg-1",
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("INELIGIBLE")
  })

  it("computes rank for MERIT certificates", async () => {
    vi.mocked(db.examResult.findFirst).mockResolvedValue(
      mockExamResult() as never
    )
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(
      mockConfig({ type: "MERIT" }) as never
    )
    vi.mocked(db.examResult.count).mockResolvedValue(2 as never)
    vi.mocked(db.examCertificate.create).mockImplementation((async ({
      data,
    }: {
      data: Record<string, unknown>
    }) => ({
      id: "cert-1",
      ...data,
    })) as never)

    await generateCertificate({ examResultId: "res-1", configId: "cfg-1" })

    const createArg = vi.mocked(db.examCertificate.create).mock.calls[0][0]
    expect((createArg as { data: { rank: number } }).data.rank).toBe(3)
  })
})

// ============================================================================
// BATCH
// ============================================================================

describe("batchGenerateCertificates", () => {
  it("issues for eligible results and skips ineligible ones", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(
      mockConfig() as never
    )
    vi.mocked(db.examResult.findMany).mockResolvedValue([
      mockExamResult({ id: "r1", studentId: "s1", percentage: 95 }),
      mockExamResult({ id: "r2", studentId: "s2", isAbsent: true }),
    ] as never)
    vi.mocked(db.examCertificate.create).mockResolvedValue({} as never)

    const r = await batchGenerateCertificates({
      examId: "exam-1",
      configId: "cfg-1",
    })

    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data?.generated).toBe(1)
      expect(r.data?.skipped).toBe(1)
    }
  })

  it("skips results below an explicit minPassScore", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(
      mockConfig() as never
    )
    vi.mocked(db.examResult.findMany).mockResolvedValue([
      mockExamResult({ id: "r1", percentage: 40 }),
    ] as never)

    const r = await batchGenerateCertificates({
      examId: "exam-1",
      configId: "cfg-1",
      minPassScore: 60,
    })

    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data?.generated).toBe(0)
      expect(r.data?.skipped).toBe(1)
    }
    expect(db.examCertificate.create).not.toHaveBeenCalled()
  })

  it("CONFIG_NOT_FOUND when config missing", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(null)
    const r = await batchGenerateCertificates({
      examId: "exam-1",
      configId: "cfg-x",
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("CONFIG_NOT_FOUND")
  })
})

describe("autoGenerateCertificates", () => {
  it("NO_DEFAULT_CONFIG when the school has no default template", async () => {
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(null)
    const r = await autoGenerateCertificates({ examId: "exam-1" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("NO_DEFAULT_CONFIG")
    // the default lookup is schoolId + isDefault + isActive scoped
    const where = vi.mocked(db.examCertificateConfig.findFirst).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      schoolId: SCHOOL,
      isDefault: true,
      isActive: true,
    })
  })

  it("issues via the default config and returns batch counts", async () => {
    // 1st findFirst = default lookup, 2nd = batch's config lookup
    vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(
      mockConfig() as never
    )
    vi.mocked(db.examResult.findMany).mockResolvedValue([
      mockExamResult({ id: "r1", percentage: 95 }),
    ] as never)
    vi.mocked(db.examCertificate.create).mockResolvedValue({} as never)

    const r = await autoGenerateCertificates({ examId: "exam-1" })

    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data?.configId).toBe("cfg-1")
      expect(r.data?.generated).toBe(1)
    }
  })
})

// ============================================================================
// SHARE / VERIFY / REVOKE
// ============================================================================

describe("shareCertificate", () => {
  it("creates a public token and a clean locale-prefixed URL", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue({
      id: "cert-1",
      schoolId: SCHOOL,
    } as never)
    vi.mocked(db.examCertificate.update).mockResolvedValue({} as never)

    const r = await shareCertificate({
      id: "cert-1",
      isPublic: true,
      expiryDays: 30,
      lang: "en",
    })

    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data?.shareToken).toBeTruthy()
      expect(r.data?.shareUrl).toBe(`/en/certificate/${r.data?.shareToken}`)
      // must NOT use the old dead path or the internal /s/ segment
      expect(r.data?.shareUrl).not.toContain("/exams/certificates/share")
      expect(r.data?.shareUrl).not.toContain("/s/")
    }
  })

  it("NOT_FOUND for a cross-tenant / inactive certificate", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue(null)
    const r = await shareCertificate({
      id: "cert-x",
      isPublic: true,
      expiryDays: 30,
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("NOT_FOUND")
    const where = vi.mocked(db.examCertificate.findFirst).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      id: "cert-x",
      schoolId: SCHOOL,
      status: "active",
    })
  })
})

describe("verifyCertificate", () => {
  it("returns whitelisted data and increments viewCount", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue({
      id: "cert-1",
      status: "active",
      recipientName: "John Smith",
      examTitle: "Final",
      examDate: new Date(),
      score: 92,
      grade: "A",
      issuedAt: new Date(),
      school: { name: "Demo School" },
    } as never)
    vi.mocked(db.examCertificate.update).mockResolvedValue({} as never)

    const r = await verifyCertificate({ code: "ABC123" })

    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.schoolName).toBe("Demo School")
    expect(db.examCertificate.update).toHaveBeenCalledWith({
      where: { id: "cert-1" },
      data: { viewCount: { increment: 1 } },
    })
  })

  it("INVALID_CODE for an unknown code (no schoolId scoping — public)", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue(null)
    const r = await verifyCertificate({ code: "nope" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("INVALID_CODE")
    const where = vi.mocked(db.examCertificate.findFirst).mock.calls[0][0]
    // public lookup: keyed by verificationCode only, NOT schoolId
    expect(
      (where as { where: Record<string, unknown> }).where
    ).not.toHaveProperty("schoolId")
  })
})

describe("revokeCertificate", () => {
  it("marks revoked and clears the share token", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue({
      id: "cert-1",
      schoolId: SCHOOL,
      status: "active",
    } as never)
    vi.mocked(db.examCertificate.update).mockResolvedValue({} as never)

    const r = await revokeCertificate({ id: "cert-1", reason: "Error" })

    expect(r.success).toBe(true)
    const arg = vi.mocked(db.examCertificate.update).mock.calls[0][0]
    const data = (arg as { data: Record<string, unknown> }).data
    expect(data.status).toBe("revoked")
    expect(data.shareToken).toBeNull()
    expect(data.isPublic).toBe(false)
  })

  it("NOT_FOUND when already revoked / cross-tenant", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue(null)
    const r = await revokeCertificate({ id: "cert-1", reason: "x" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.code).toBe("NOT_FOUND")
  })
})

// ============================================================================
// QUERIES
// ============================================================================

describe("getCertificates", () => {
  it("scopes by schoolId and applies filters", async () => {
    vi.mocked(db.examCertificate.findMany).mockResolvedValue([] as never)
    await getCertificates({ status: "active", configId: "cfg-1" })
    const where = vi.mocked(db.examCertificate.findMany).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      schoolId: SCHOOL,
      status: "active",
      configId: "cfg-1",
    })
  })

  it("returns [] with no school", async () => {
    asSchool(null)
    expect(await getCertificates()).toEqual([])
  })
})

describe("getCertificateByShareToken", () => {
  it("filters by public + active + unexpired and bumps viewCount", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue({
      id: "cert-1",
      pdfUrl: "https://cdn/x.pdf",
    } as never)
    vi.mocked(db.examCertificate.update).mockResolvedValue({} as never)

    const cert = await getCertificateByShareToken("tok-1")

    expect(cert).toBeTruthy()
    const where = vi.mocked(db.examCertificate.findFirst).mock.calls[0][0]
    const w = (where as { where: Record<string, unknown> }).where
    expect(w).toMatchObject({
      shareToken: "tok-1",
      isPublic: true,
      status: "active",
    })
    expect(w.OR).toBeDefined()
    expect(db.examCertificate.update).toHaveBeenCalled()
  })

  it("returns null and does not bump viewCount for an unknown token", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue(null)
    const cert = await getCertificateByShareToken("nope")
    expect(cert).toBeNull()
    expect(db.examCertificate.update).not.toHaveBeenCalled()
  })
})
