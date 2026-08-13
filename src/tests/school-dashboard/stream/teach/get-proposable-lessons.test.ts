// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getProposableCatalog,
  getProposableChapters,
  MAX_PROPOSABLE_RESULTS,
  searchProposableLessons,
} from "@/components/stream/teach/get-proposable-lessons"
import { getLabels } from "@/components/translation/person"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/components/translation/person", () => ({
  getLabels: vi.fn(async () => new Map<string, string>()),
}))

vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findMany: vi.fn() },
    subject: { findMany: vi.fn() },
    chapter: { findMany: vi.fn() },
    subjectSelection: { findMany: vi.fn() },
    contentOverride: { findMany: vi.fn() },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockLessonFindMany = db.lesson.findMany as ReturnType<typeof vi.fn>
const mockSubjectFindMany = db.subject.findMany as ReturnType<typeof vi.fn>
const mockChapterFindMany = db.chapter.findMany as ReturnType<typeof vi.fn>
const mockSelectionFindMany = db.subjectSelection.findMany as ReturnType<
  typeof vi.fn
>
const mockOverrideFindMany = db.contentOverride.findMany as ReturnType<
  typeof vi.fn
>
const mockGetLabels = getLabels as ReturnType<typeof vi.fn>

/** The `where` the search handed to Prisma. */
function lessonWhere() {
  return mockLessonFindMany.mock.calls[0][0] as {
    where: {
      chapter: { subject: Record<string, unknown> }
      OR?: Array<Record<string, any>>
    }
    orderBy: Array<Record<string, unknown>>
    take: number
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockLessonFindMany.mockResolvedValue([])
  mockSubjectFindMany.mockResolvedValue([])
  mockChapterFindMany.mockResolvedValue([])
  mockOverrideFindMany.mockResolvedValue([])
  // Default: a school with one selected subject (school-role path reaches the
  // lesson query).
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockSelectionFindMany.mockResolvedValue([
    {
      catalogSubjectId: "subj-1",
      customName: null,
      grade: { id: "grade-1", gradeNumber: 1 },
    },
  ])
})

describe("searchProposableLessons — security", () => {
  it("returns nothing for an unauthenticated caller", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await searchProposableLessons()
    expect(result).toEqual({ lessons: [], hasMore: false })
    expect(mockLessonFindMany).not.toHaveBeenCalled()
  })

  it("returns nothing for a session with no role", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1" } })
    const result = await searchProposableLessons()
    expect(result).toEqual({ lessons: [], hasMore: false })
    expect(mockLessonFindMany).not.toHaveBeenCalled()
  })

  it.each(["STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "USER"] as const)(
    "denies role %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      const result = await searchProposableLessons()
      expect(result).toEqual({ lessons: [], hasMore: false })
      expect(mockLessonFindMany).not.toHaveBeenCalled()
    }
  )

  it.each(["DEVELOPER", "ADMIN", "TEACHER"] as const)(
    "permits role %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      await searchProposableLessons()
      expect(mockLessonFindMany).toHaveBeenCalledOnce()
    }
  )
})

describe("searchProposableLessons — school scoping", () => {
  it("DEVELOPER searches the global catalog (no SubjectSelection scope)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "dev-1", role: "DEVELOPER" } })
    await searchProposableLessons()
    expect(mockSelectionFindMany).not.toHaveBeenCalled()
    expect(mockOverrideFindMany).not.toHaveBeenCalled()
    expect(lessonWhere().where.chapter.subject).not.toHaveProperty("id")
  })

  it("scopes a TEACHER to the school's selected subjects", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    mockSelectionFindMany.mockResolvedValueOnce([
      {
        catalogSubjectId: "subj-1",
        customName: null,
        grade: { id: "grade-1", gradeNumber: 1 },
      },
      {
        catalogSubjectId: "subj-2",
        customName: null,
        grade: { id: "grade-1", gradeNumber: 1 },
      },
    ])
    await searchProposableLessons()
    const subject = lessonWhere().where.chapter.subject as {
      status: string
      id: { in: string[] }
    }
    expect(subject.status).toBe("PUBLISHED")
    expect(subject.id.in).toEqual(["subj-1", "subj-2"])
  })

  it("returns nothing for a school role without school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "a-1", role: "ADMIN" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await searchProposableLessons()
    expect(result).toEqual({ lessons: [], hasMore: false })
    expect(mockLessonFindMany).not.toHaveBeenCalled()
  })

  it("returns nothing when the school has selected no subjects", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "a-1", role: "ADMIN" } })
    mockSelectionFindMany.mockResolvedValueOnce([])
    const result = await searchProposableLessons()
    expect(result).toEqual({ lessons: [], hasMore: false })
    expect(mockLessonFindMany).not.toHaveBeenCalled()
  })
})

describe("searchProposableLessons — tier narrowing", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "t-1", role: "TEACHER" } })
  })

  it("refuses subject ids outside the caller's scope", async () => {
    // The scope + id lookup finds nothing → the subjects aren't the school's.
    mockSubjectFindMany.mockResolvedValueOnce([])
    const result = await searchProposableLessons({
      subjectIds: ["other-school"],
    })
    expect(result).toEqual({ lessons: [], hasMore: false })
    expect(mockLessonFindMany).not.toHaveBeenCalled()
  })

  it("AND-s the requested subjects with the scope instead of replacing it", async () => {
    mockSubjectFindMany.mockResolvedValueOnce([{ id: "subj-1" }])
    await searchProposableLessons({ subjectIds: ["subj-1", "other-school"] })
    // The permission probe must keep the tenant scope alongside the ids — a
    // merged `{ ...scope, id }` would drop `id: { in: [...] }` and let any
    // published subject through.
    const probe = mockSubjectFindMany.mock.calls[0][0] as {
      where: { AND: Array<Record<string, any>> }
    }
    expect(probe.where.AND[0].id.in).toEqual(["subj-1"])
    expect(probe.where.AND[1].id.in).toEqual(["subj-1", "other-school"])

    // Only the ids that survived the probe reach the lesson query.
    const subject = lessonWhere().where.chapter.subject as {
      AND: Array<Record<string, any>>
    }
    expect(subject.AND[0].id.in).toEqual(["subj-1"])
    expect(subject.AND[1].id.in).toEqual(["subj-1"])
  })

  it("filters a chapter through the subject scope, with no probe of its own", async () => {
    await searchProposableLessons({ chapterId: "chap-9" })
    const chapter = lessonWhere().where.chapter as {
      AND: Array<{ id: string }>
      subject: { id: { in: string[] } }
    }
    // A chapter hanging off another school's subject matches nothing, because
    // the scope travels in the same clause.
    expect(chapter.AND).toEqual([{ id: "chap-9" }])
    expect(chapter.subject.id.in).toEqual(["subj-1"])
    expect(mockSubjectFindMany).not.toHaveBeenCalled()
  })

  it("excludes the school's LMS-hidden lessons and chapters from the search", async () => {
    mockOverrideFindMany.mockResolvedValueOnce([
      { catalogChapterId: "chap-hidden", catalogLessonId: null },
      { catalogChapterId: null, catalogLessonId: "lesson-hidden" },
      // Video-level override — no chapter/lesson id, must be a no-op here.
      { catalogChapterId: null, catalogLessonId: null },
    ])
    await searchProposableLessons({ chapterId: "chap-9" })
    const where = lessonWhere().where as {
      id: { notIn: string[] }
      chapter: { AND: Array<Record<string, unknown>> }
    }
    expect(where.id.notIn).toEqual(["lesson-hidden"])
    // The requested chapter AND the hides coexist — a hidden chapter stays
    // unreachable even when named directly.
    expect(where.chapter.AND).toEqual([
      { id: "chap-9" },
      { id: { notIn: ["chap-hidden"] } },
    ])
  })
})

describe("searchProposableLessons — query", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "t-1", role: "TEACHER" } })
  })

  it("filters by published subject status", async () => {
    await searchProposableLessons()
    const subject = lessonWhere().where.chapter.subject as { status: string }
    expect(subject.status).toBe("PUBLISHED")
  })

  it("orders by subject.name → chapter.sequenceOrder → lesson.sequenceOrder", async () => {
    await searchProposableLessons()
    expect(lessonWhere().orderBy).toHaveLength(3)
  })

  it("never text-matches in the database", async () => {
    await searchProposableLessons()
    // The catalog stores one language and the dialog displays another, so a
    // `contains` here would match text the user cannot see. Filtering is the
    // client's job, over the translated page.
    expect(lessonWhere().where.OR).toBeUndefined()
  })

  it("clamps take to the page ceiling and fetches one extra row", async () => {
    await searchProposableLessons({ take: 5000 })
    expect(lessonWhere().take).toBe(MAX_PROPOSABLE_RESULTS + 1)
  })

  it("sizes the page so a whole subject fits", async () => {
    // Client-side filtering is only complete if the page holds the subject;
    // school subjects run ~30-60 lessons.
    expect(MAX_PROPOSABLE_RESULTS).toBeGreaterThanOrEqual(100)
  })

  it("reports hasMore and trims the probe row off the page", async () => {
    mockLessonFindMany.mockResolvedValueOnce(
      Array.from({ length: 3 }, (_, i) => ({
        id: `l-${i}`,
        name: `Lesson ${i}`,
        chapter: {
          name: "Chapter 1",
          subject: { id: "subj-1", name: "Math", slug: "math" },
        },
      }))
    )
    const result = await searchProposableLessons({ take: 2 })
    expect(result.lessons).toHaveLength(2)
    expect(result.hasMore).toBe(true)
  })

  it("flattens nested chapter+subject into the result", async () => {
    mockLessonFindMany.mockResolvedValueOnce([
      {
        id: "l-1",
        name: "Algebra basics",
        chapter: {
          name: "Chapter 1",
          subject: { id: "subj-1", name: "Math", slug: "math" },
        },
      },
    ])
    const result = await searchProposableLessons()
    expect(result).toEqual({
      lessons: [
        {
          id: "l-1",
          name: "Algebra basics",
          chapterName: "Chapter 1",
          subjectId: "subj-1",
          subjectName: "Math",
          subjectSlug: "math",
        },
      ],
      hasMore: false,
    })
  })
})

describe("getProposableCatalog", () => {
  it("returns [] for a denied role", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "s-1", role: "STUDENT" } })
    expect(await getProposableCatalog()).toEqual([])
    expect(mockSubjectFindMany).not.toHaveBeenCalled()
  })

  it("buckets subjects under the grade the school selected them for", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    mockSelectionFindMany.mockResolvedValueOnce([
      // Same subject NAME per grade — the catalog seeds one Subject per grade
      // and leaves the grade out of the name, which is why grade comes first.
      {
        catalogSubjectId: "math-g2",
        customName: null,
        grade: { id: "grade-2", gradeNumber: 2 },
      },
      {
        catalogSubjectId: "math-g1",
        customName: null,
        grade: { id: "grade-1", gradeNumber: 1 },
      },
      // Second row for the same (subject, grade) — one per academic stream.
      {
        catalogSubjectId: "math-g1",
        customName: null,
        grade: { id: "grade-1", gradeNumber: 1 },
      },
      // Selected, but the subject has no lessons yet.
      {
        catalogSubjectId: "art-g1",
        customName: null,
        grade: { id: "grade-1", gradeNumber: 1 },
      },
    ])
    mockSubjectFindMany.mockResolvedValueOnce([
      { id: "math-g1", name: "Math", slug: "math-1", grades: [1] },
      { id: "math-g2", name: "Math", slug: "math-2", grades: [2] },
      { id: "art-g1", name: "Art", slug: "art-1", grades: [1] },
    ])
    mockChapterFindMany.mockResolvedValueOnce([
      { subjectId: "math-g1", _count: { lessons: 4 } },
      { subjectId: "math-g1", _count: { lessons: 3 } },
      { subjectId: "math-g2", _count: { lessons: 2 } },
      { subjectId: "art-g1", _count: { lessons: 0 } },
    ])

    const result = await getProposableCatalog()
    // Ordered by grade number; the stream duplicate is deduped; the
    // lesson-less subject is dropped (it also gates the upload button).
    expect(result).toEqual([
      {
        id: "grade-1",
        gradeNumber: 1,
        subjects: [
          { id: "math-g1", name: "Math", slug: "math-1", lessonCount: 7 },
        ],
      },
      {
        id: "grade-2",
        gradeNumber: 2,
        subjects: [
          { id: "math-g2", name: "Math", slug: "math-2", lessonCount: 2 },
        ],
      },
    ])
  })

  it("counts lessons minus the school's LMS-hidden chapters and lessons", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    mockOverrideFindMany.mockResolvedValueOnce([
      { catalogChapterId: "chap-hidden", catalogLessonId: null },
      { catalogChapterId: null, catalogLessonId: "lesson-hidden" },
    ])
    mockSubjectFindMany.mockResolvedValueOnce([
      { id: "subj-1", name: "Math", slug: "math", grades: [1] },
    ])
    mockChapterFindMany.mockResolvedValueOnce([
      { subjectId: "subj-1", _count: { lessons: 2 } },
    ])
    await getProposableCatalog()
    const call = mockChapterFindMany.mock.calls[0][0] as {
      where: { id: { notIn: string[] } }
      select: {
        _count: { select: { lessons: { where: { id: { notIn: string[] } } } } }
      }
    }
    // Hidden chapters never reach the count; hidden lessons are subtracted
    // inside the relation count itself.
    expect(call.where.id.notIn).toEqual(["chap-hidden"])
    expect(call.select._count.select.lessons.where.id.notIn).toEqual([
      "lesson-hidden",
    ])
  })

  it("prefers the school's own subject rename", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    mockSelectionFindMany.mockResolvedValueOnce([
      {
        catalogSubjectId: "subj-1",
        customName: "Applied Maths",
        grade: { id: "grade-1", gradeNumber: 1 },
      },
    ])
    mockSubjectFindMany.mockResolvedValueOnce([
      { id: "subj-1", name: "Math", slug: "math", grades: [1] },
    ])
    mockChapterFindMany.mockResolvedValueOnce([
      { subjectId: "subj-1", _count: { lessons: 1 } },
    ])
    const result = await getProposableCatalog()
    expect(result[0].subjects[0].name).toBe("Applied Maths")
  })

  it("buckets the platform catalog by the subject's own grade numbers", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "dev-1", role: "DEVELOPER" } })
    mockSubjectFindMany.mockResolvedValueOnce([
      { id: "subj-1", name: "Math", slug: "math", grades: [1, 2] },
      { id: "subj-2", name: "Life skills", slug: "life", grades: [] },
    ])
    mockChapterFindMany.mockResolvedValueOnce([
      { subjectId: "subj-1", _count: { lessons: 5 } },
      { subjectId: "subj-2", _count: { lessons: 1 } },
    ])
    const result = await getProposableCatalog()
    expect(mockSelectionFindMany).not.toHaveBeenCalled()
    // A multi-grade subject shows under each of its grades; an ungraded one
    // stays reachable under 0 rather than vanishing.
    expect(result.map((g) => g.id)).toEqual(["grade:0", "grade:1", "grade:2"])
    expect(result[1].subjects[0].id).toBe("subj-1")
    expect(result[2].subjects[0].id).toBe("subj-1")
    expect(result[0].subjects[0].id).toBe("subj-2")
  })
})

describe("getProposableChapters", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "t-1", role: "TEACHER" } })
  })

  it("returns [] for a denied role", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "s-1", role: "STUDENT" } })
    expect(await getProposableChapters("subj-1")).toEqual([])
    expect(mockChapterFindMany).not.toHaveBeenCalled()
  })

  it("scopes the subject and drops empty chapters", async () => {
    mockChapterFindMany.mockResolvedValueOnce([
      { id: "chap-1", name: "Numbers", _count: { lessons: 6 } },
      { id: "chap-2", name: "Placeholder", _count: { lessons: 0 } },
    ])
    const result = await getProposableChapters("subj-1")
    const call = mockChapterFindMany.mock.calls[0][0] as {
      where: { subjectId: string; subject: { id: { in: string[] } } }
    }
    expect(call.where.subjectId).toBe("subj-1")
    expect(call.where.subject.id.in).toEqual(["subj-1"])
    expect(result).toEqual([{ id: "chap-1", name: "Numbers", lessonCount: 6 }])
  })

  it("excludes the school's LMS-hidden chapters and lesson counts", async () => {
    mockOverrideFindMany.mockResolvedValueOnce([
      { catalogChapterId: "chap-hidden", catalogLessonId: null },
      { catalogChapterId: null, catalogLessonId: "lesson-hidden" },
    ])
    await getProposableChapters("subj-1")
    const call = mockChapterFindMany.mock.calls[0][0] as {
      where: { id: { notIn: string[] } }
      select: {
        _count: { select: { lessons: { where: { id: { notIn: string[] } } } } }
      }
    }
    expect(call.where.id.notIn).toEqual(["chap-hidden"])
    expect(call.select._count.select.lessons.where.id.notIn).toEqual([
      "lesson-hidden",
    ])
  })
})

describe("translation", () => {
  it("translates search-result names through the batched label map", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    mockLessonFindMany.mockResolvedValueOnce([
      {
        id: "l-1",
        name: "الدرس الأول",
        chapter: {
          name: "الوحدة الأولى",
          subject: { id: "subj-1", name: "الرياضيات", slug: "math" },
        },
      },
    ])
    mockGetLabels.mockResolvedValueOnce(
      new Map([
        ["الدرس الأول", "Lesson One"],
        ["الرياضيات", "Mathematics"],
      ])
    )
    const result = await searchProposableLessons({ lang: "en" })
    expect(mockGetLabels).toHaveBeenCalledWith(
      ["الدرس الأول", "الوحدة الأولى", "الرياضيات"],
      "en",
      "school-1"
    )
    // Mapped names swap; a cache miss falls back to the source text.
    expect(result.lessons[0]).toMatchObject({
      name: "Lesson One",
      chapterName: "الوحدة الأولى",
      subjectName: "Mathematics",
    })
  })

  it("skips translation without a lang and for the platform scope", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    await searchProposableLessons()
    expect(mockGetLabels).not.toHaveBeenCalled()

    mockAuth.mockResolvedValueOnce({ user: { id: "dev-1", role: "DEVELOPER" } })
    await searchProposableLessons({ lang: "en" })
    expect(mockGetLabels).not.toHaveBeenCalled()
  })

  it("translates subject names only — grade labels derive from the number", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    mockSubjectFindMany.mockResolvedValueOnce([
      { id: "subj-1", name: "الرياضيات", slug: "math", grades: [1] },
    ])
    mockChapterFindMany.mockResolvedValueOnce([
      { subjectId: "subj-1", _count: { lessons: 3 } },
    ])
    mockSelectionFindMany.mockResolvedValueOnce([
      {
        catalogSubjectId: "subj-1",
        customName: null,
        grade: { id: "grade-1", gradeNumber: 1 },
      },
    ])
    mockGetLabels.mockResolvedValueOnce(new Map([["الرياضيات", "Mathematics"]]))
    const result = await getProposableCatalog("en")
    expect(mockGetLabels).toHaveBeenCalledWith(["الرياضيات"], "en", "school-1")
    expect(result[0]).not.toHaveProperty("name")
    expect(result[0].subjects[0].name).toBe("Mathematics")
  })
})
