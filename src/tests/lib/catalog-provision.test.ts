// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { generateUniqueJoinCode } from "@/lib/join-code"
import {
  getProvisioningStatus,
  repairProvisioning,
  resolveEffectiveStructureSlug,
} from "@/components/catalog/provision"
import {
  ensureSubjectSelections,
  setupCatalogForSchool,
  setupDefaultsForSchool,
} from "@/components/catalog/setup"

vi.mock("@/lib/db", () => ({
  db: {
    school: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    yearLevel: { count: vi.fn() },
    department: { count: vi.fn() },
    scoreRange: { count: vi.fn() },
    academicLevel: { count: vi.fn() },
    academicGrade: { count: vi.fn(), findMany: vi.fn() },
    academicStream: { count: vi.fn() },
    subjectSelection: { count: vi.fn() },
    schoolYear: { count: vi.fn(), findFirst: vi.fn() },
    period: { count: vi.fn() },
    term: { count: vi.fn() },
    schoolWeekConfig: { count: vi.fn() },
    classroomType: { count: vi.fn(), findFirst: vi.fn(), upsert: vi.fn() },
    section: { count: vi.fn() },
    timetable: { count: vi.fn() },
    schoolBook: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/join-code", () => ({
  generateUniqueJoinCode: vi.fn(),
}))

// Isolate the doctor from the provisioning engine — those stages are tested
// in catalog-setup.test.ts; here we assert the doctor calls them correctly.
vi.mock("@/components/catalog/setup", () => ({
  ensureSubjectSelections: vi.fn(),
  setupCatalogForSchool: vi.fn(),
  setupDefaultsForSchool: vi.fn(),
}))

const schoolId = "school-1"

type Counts = {
  yearLevel?: number
  department?: number
  scoreRange?: number
  academicLevel?: number
  academicGrade?: number
  academicStream?: number
  subjectSelection?: number
  schoolYear?: number
  period?: number
  term?: number
  weekConfig?: number
  classroomType?: number
  section?: number
  timetable?: number
  schoolBook?: number
}

function mockCounts(counts: Counts) {
  vi.mocked(db.yearLevel.count).mockResolvedValue(counts.yearLevel ?? 0)
  vi.mocked(db.department.count).mockResolvedValue(counts.department ?? 0)
  vi.mocked(db.scoreRange.count).mockResolvedValue(counts.scoreRange ?? 0)
  vi.mocked(db.academicLevel.count).mockResolvedValue(counts.academicLevel ?? 0)
  vi.mocked(db.academicGrade.count).mockResolvedValue(counts.academicGrade ?? 0)
  vi.mocked(db.academicStream.count).mockResolvedValue(
    counts.academicStream ?? 0
  )
  vi.mocked(db.subjectSelection.count).mockResolvedValue(
    counts.subjectSelection ?? 0
  )
  vi.mocked(db.schoolYear.count).mockResolvedValue(counts.schoolYear ?? 0)
  vi.mocked(db.period.count).mockResolvedValue(counts.period ?? 0)
  vi.mocked(db.term.count).mockResolvedValue(counts.term ?? 0)
  vi.mocked(db.schoolWeekConfig.count).mockResolvedValue(counts.weekConfig ?? 0)
  vi.mocked(db.classroomType.count).mockResolvedValue(counts.classroomType ?? 0)
  vi.mocked(db.section.count).mockResolvedValue(counts.section ?? 0)
  vi.mocked(db.timetable.count).mockResolvedValue(counts.timetable ?? 0)
  vi.mocked(db.schoolBook.count).mockResolvedValue(counts.schoolBook ?? 0)
}

const HEALTHY_COUNTS: Counts = {
  yearLevel: 14,
  department: 6,
  scoreRange: 9,
  academicLevel: 3,
  academicGrade: 12,
  academicStream: 6,
  subjectSelection: 120,
  schoolYear: 1,
  period: 8,
  term: 2,
  weekConfig: 1,
  classroomType: 1,
  section: 24,
  timetable: 600,
  schoolBook: 51,
}

function mockSchool(
  overrides: Partial<{
    timetableStructure: string | null
    joinCode: string | null
    country: string
    schoolType: string | null
    schoolLevel: string
    sectionsPerGrade: number
    studentsPerSection: number
  }> = {}
) {
  vi.mocked(db.school.findUnique).mockResolvedValue({
    timetableStructure: "sd-gov-default",
    joinCode: "JOIN99",
    country: "SD",
    schoolType: "private",
    schoolLevel: "both",
    sectionsPerGrade: 2,
    studentsPerSection: 30,
    ...overrides,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getProvisioningStatus", () => {
  it("reports a fully provisioned school as healthy", async () => {
    mockSchool()
    mockCounts(HEALTHY_COUNTS)

    const status = await getProvisioningStatus(schoolId)

    expect(status.missing).toEqual([])
    expect(status.healthy).toBe(true)
    expect(status.hasJoinCode).toBe(true)
    expect(status.counts.subjectSelections).toBe(120)
  })

  it("reports every stage missing on a fresh school with a timetable structure", async () => {
    mockSchool({ joinCode: null })
    mockCounts({})

    const status = await getProvisioningStatus(schoolId)

    expect(status.missing).toEqual([
      "defaults",
      "academicStructure",
      "subjectSelections",
      "schedule",
      "sections",
      "timetable",
      "joinCode",
    ])
    expect(status.healthy).toBe(false)
  })

  it("marks schedule/timetable missing even when the school has no timetable structure (zero-click auto-provision)", async () => {
    mockSchool({ timetableStructure: null, joinCode: null })
    mockCounts({})

    const status = await getProvisioningStatus(schoolId)

    // Every school auto-provisions a timetable now — the stages are no longer
    // gated on a pre-selected structure; the doctor derives a default.
    expect(status.missing).toContain("schedule")
    expect(status.missing).toContain("timetable")
  })

  it("treats streams and library books as optional", async () => {
    mockSchool()
    mockCounts({ ...HEALTHY_COUNTS, academicStream: 0, schoolBook: 0 })

    const status = await getProvisioningStatus(schoolId)

    expect(status.healthy).toBe(true)
    expect(status.counts.academicStreams).toBe(0)
    expect(status.counts.libraryBooks).toBe(0)
  })

  it("throws school_not_found for a non-existent school", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue(null)

    await expect(getProvisioningStatus(schoolId)).rejects.toThrow(
      "school_not_found"
    )
  })
})

describe("repairProvisioning", () => {
  it("does nothing on a healthy school", async () => {
    mockSchool()
    mockCounts(HEALTHY_COUNTS)

    const result = await repairProvisioning(schoolId)

    expect(result.repaired).toEqual([])
    expect(result.failed).toEqual([])
    expect(result.healthy).toBe(true)
    expect(setupDefaultsForSchool).not.toHaveBeenCalled()
    expect(setupCatalogForSchool).not.toHaveBeenCalled()
    expect(db.school.update).not.toHaveBeenCalled()
  })

  it("runs the missing stages in dependency order and persists a derived structure slug", async () => {
    // Fresh school WITHOUT a timetable structure: the doctor derives a default
    // slug, persists it, and the non-schedule stages run. (The schedule +
    // timetable stages are attempted but land in `failed` here because their
    // deep DB calls aren't mocked — that's exercised end-to-end elsewhere.)
    mockSchool({ timetableStructure: null, joinCode: null })
    mockCounts({})
    // autoProvisionSections internals: no grades yet → graceful no-op
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([])
    vi.mocked(db.classroomType.findFirst).mockResolvedValue(null)
    vi.mocked(generateUniqueJoinCode).mockResolvedValue("NEW123")

    const result = await repairProvisioning(schoolId)

    // Non-schedule stages still run, in order.
    expect(result.repaired).toEqual(
      expect.arrayContaining([
        "defaults",
        "academicStructure",
        "subjectSelections",
        "sections",
        "joinCode",
      ])
    )
    expect(setupDefaultsForSchool).toHaveBeenCalledWith(schoolId, "both")
    expect(setupCatalogForSchool).toHaveBeenCalledWith(schoolId, {
      country: "SD",
      schoolType: "private",
    })
    expect(ensureSubjectSelections).toHaveBeenCalledWith(schoolId)
    expect(db.classroomType.upsert).toHaveBeenCalled()
    // The derived structure slug is persisted back onto the school.
    expect(db.school.update).toHaveBeenCalledWith({
      where: { id: schoolId },
      data: { timetableStructure: expect.any(String) },
    })
    // And the join code is still minted.
    expect(db.school.update).toHaveBeenCalledWith({
      where: { id: schoolId },
      data: { joinCode: "NEW123" },
    })
  })

  it("skips the selections self-heal when the structure repair already created them", async () => {
    mockSchool({ timetableStructure: null })
    mockCounts({ ...HEALTHY_COUNTS, subjectSelection: 0 })
    // First count (status read) sees 0; the in-stage recheck sees the rows
    // setupCatalogForSchool just created.
    vi.mocked(db.subjectSelection.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValue(120)

    const result = await repairProvisioning(schoolId)

    expect(result.repaired).toEqual(["subjectSelections"])
    expect(ensureSubjectSelections).not.toHaveBeenCalled()
  })

  it("collects a stage failure without aborting the remaining stages", async () => {
    mockSchool({ timetableStructure: null, joinCode: null })
    mockCounts({ ...HEALTHY_COUNTS, section: 0 })
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([])
    vi.mocked(db.classroomType.findFirst).mockResolvedValue(null)
    vi.mocked(db.classroomType.upsert).mockRejectedValue(
      new Error("db unreachable")
    )
    vi.mocked(generateUniqueJoinCode).mockResolvedValue("NEW123")

    const result = await repairProvisioning(schoolId)

    expect(result.failed).toEqual([
      { stage: "sections", error: "db unreachable" },
    ])
    expect(result.repaired).toEqual(["joinCode"])
    expect(db.school.update).toHaveBeenCalled()
  })

  it("throws school_not_found for a non-existent school", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue(null)

    await expect(repairProvisioning(schoolId)).rejects.toThrow(
      "school_not_found"
    )
  })

  it("unknown timetable slug lands in failed[] instead of repaired[]", async () => {
    // School has a timetable structure set but it is an unknown slug
    mockSchool({
      timetableStructure: "unknown-slug-xyz",
      joinCode: "JOIN99",
    })
    mockCounts({ ...HEALTHY_COUNTS, period: 0, term: 0, weekConfig: 0 })

    const result = await repairProvisioning(schoolId)

    // schedule stage should be in failed, not repaired
    expect(result.failed.some((f) => f.stage === "schedule")).toBe(true)
    expect(result.repaired).not.toContain("schedule")
    const scheduleFail = result.failed.find((f) => f.stage === "schedule")
    expect(scheduleFail?.error).toContain("unknown-slug-xyz")
  })
})

describe("resolveEffectiveStructureSlug", () => {
  it("returns the school's explicit structure when set", async () => {
    const slug = await resolveEffectiveStructureSlug({
      country: "SD",
      schoolType: "private",
      schoolLevel: "both",
      timetableStructure: "sd-british",
    })
    expect(slug).toBe("sd-british")
  })

  it("derives a country-recommended default when none is set", async () => {
    const slug = await resolveEffectiveStructureSlug({
      country: "SD",
      schoolType: "private",
      schoolLevel: "both",
      timetableStructure: null,
    })
    expect(typeof slug).toBe("string")
    expect(slug.length).toBeGreaterThan(0)
  })

  it("falls back to a generic default for an unknown country", async () => {
    const slug = await resolveEffectiveStructureSlug({
      country: null,
      schoolType: null,
      schoolLevel: null,
      timetableStructure: null,
    })
    expect(slug).toBe("intl-default")
  })
})

describe("getProvisioningStatus — enhanced doctor checks", () => {
  it("reports weekConfigs count in counts object", async () => {
    mockSchool()
    mockCounts({ ...HEALTHY_COUNTS, weekConfig: 3 })

    const status = await getProvisioningStatus(schoolId)

    expect(status.counts.weekConfigs).toBe(3)
  })

  it("marks schedule missing when weekConfigs === 0 but periods and terms exist", async () => {
    mockSchool()
    mockCounts({ ...HEALTHY_COUNTS, weekConfig: 0 })

    const status = await getProvisioningStatus(schoolId)

    expect(status.missing).toContain("schedule")
  })

  it("marks schedule missing when periods === 0", async () => {
    mockSchool()
    mockCounts({ ...HEALTHY_COUNTS, period: 0, weekConfig: 1 })

    const status = await getProvisioningStatus(schoolId)

    expect(status.missing).toContain("schedule")
  })

  it("marks schedule missing when terms === 0", async () => {
    mockSchool()
    mockCounts({ ...HEALTHY_COUNTS, term: 0, weekConfig: 1 })

    const status = await getProvisioningStatus(schoolId)

    expect(status.missing).toContain("schedule")
  })

  it("marks sections missing when classroomTypes === 0 even if sections > 0", async () => {
    mockSchool()
    mockCounts({ ...HEALTHY_COUNTS, classroomType: 0 })

    const status = await getProvisioningStatus(schoolId)

    expect(status.missing).toContain("sections")
  })

  it("marks sections missing when sections === 0 even if classroomTypes > 0", async () => {
    mockSchool()
    mockCounts({ ...HEALTHY_COUNTS, section: 0 })

    const status = await getProvisioningStatus(schoolId)

    expect(status.missing).toContain("sections")
  })

  it("does NOT mark sections missing when both classroomTypes > 0 and sections > 0", async () => {
    mockSchool()
    mockCounts(HEALTHY_COUNTS)

    const status = await getProvisioningStatus(schoolId)

    expect(status.missing).not.toContain("sections")
  })
})
