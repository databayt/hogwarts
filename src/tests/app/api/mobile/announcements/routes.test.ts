// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

/**
 * The routes run the REAL `announcements/queries.ts` audience logic; only the
 * database is faked. The fake `findMany`/`count`/`findFirst` evaluate the
 * Prisma `where` against an in-memory table, so "a student does not see a
 * staff notice" is proven by the rows that come back, not by the shape of an
 * argument.
 */

type Row = {
  id: string
  schoolId: string
  title: string
  body: string
  lang: string
  scope: "school" | "class" | "role"
  priority: string
  role: string | null
  classId: string | null
  published: boolean
  publishedAt: Date | null
  scheduledFor: Date | null
  expiresAt: Date | null
  pinned: boolean
  featured: boolean
  wizardStep: string | null
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

const SCHOOL = "school-1"
const OTHER_SCHOOL = "school-2"
const USER = "user-1"

const at = (day: number) => new Date(Date.UTC(2026, 8, day))

const row = (over: Partial<Row> & Pick<Row, "id">): Row => ({
  schoolId: SCHOOL,
  title: `Notice ${over.id}`,
  body: "Body text",
  lang: "en",
  scope: "school",
  priority: "normal",
  role: null,
  classId: null,
  published: true,
  publishedAt: at(1),
  scheduledFor: null,
  expiresAt: null,
  pinned: false,
  featured: false,
  wizardStep: null,
  createdBy: null,
  createdAt: at(1),
  updatedAt: at(2),
  ...over,
})

const TABLE: Row[] = [
  row({ id: "ann-school", createdAt: at(5) }),
  row({ id: "ann-staff", scope: "role", role: "TEACHER", createdAt: at(6) }),
  row({ id: "ann-students", scope: "role", role: "STUDENT", createdAt: at(4) }),
  row({
    id: "ann-class-mine",
    scope: "class",
    classId: "class-a",
    createdAt: at(3),
  }),
  row({
    id: "ann-class-other",
    scope: "class",
    classId: "class-b",
    createdAt: at(2),
  }),
  row({
    id: "ann-draft",
    published: false,
    publishedAt: null,
    createdAt: at(7),
  }),
  row({ id: "ann-pinned", pinned: true, createdAt: at(1) }),
  row({ id: "ann-wizard", wizardStep: "content", createdAt: at(8) }),
  row({ id: "ann-foreign", schoolId: OTHER_SCHOOL, createdAt: at(9) }),
]

function matches(
  r: Record<string, unknown>,
  where: Record<string, unknown>
): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (key === "AND")
      return (cond as Record<string, unknown>[]).every((w) => matches(r, w))
    if (key === "OR")
      return (cond as Record<string, unknown>[]).some((w) => matches(r, w))
    const value = r[key]
    if (cond !== null && typeof cond === "object" && !(cond instanceof Date)) {
      const c = cond as Record<string, unknown>
      if ("in" in c) return (c.in as unknown[]).includes(value)
      if ("gt" in c) return value instanceof Date && value > (c.gt as Date)
      if ("contains" in c)
        return String(value ?? "")
          .toLowerCase()
          .includes(String(c.contains).toLowerCase())
      throw new Error(`fake db: unsupported condition on ${key}`)
    }
    return value === cond
  })
}

function query(args: {
  where: Record<string, unknown>
  orderBy?: Record<string, string>[]
  skip?: number
  take?: number
}) {
  const found = TABLE.filter((r) => matches(r, args.where))
  for (const order of [...(args.orderBy ?? [])].reverse()) {
    const [field, dir] = Object.entries(order)[0]
    found.sort((a, b) => {
      const x = a[field as keyof Row] as unknown as number
      const y = b[field as keyof Row] as unknown as number
      return (x > y ? 1 : x < y ? -1 : 0) * (dir === "desc" ? -1 : 1)
    })
  }
  const skip = args.skip ?? 0
  return found
    .slice(skip, args.take ? skip + args.take : undefined)
    .map((r) => ({
      ...r,
      creator: null,
      class: null,
      _count: { readReceipts: 0 },
    }))
}

vi.mock("@/lib/db", () => ({
  db: {
    announcement: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
    announcementRead: { findMany: vi.fn(), upsert: vi.fn() },
    studentClass: { findMany: vi.fn() },
    class: { findMany: vi.fn() },
  },
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))
vi.mock("@/components/translation/localize", () => ({
  localize: vi.fn(async (_m: string, rows: Array<Record<string, unknown>>) =>
    rows.map((r) => ({ ...r, title: `[ar] ${r.title}` }))
  ),
  localizeOne: vi.fn(async (_m: string, r: Record<string, unknown>) => ({
    ...r,
    title: `[ar] ${r.title}`,
  })),
}))

async function authAs(role: string, schoolId = SCHOOL) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: USER,
    email: "u@e.com",
    schoolId,
    role,
  })
}

const req = (path = "") =>
  new NextRequest(`http://localhost/api/mobile/announcements${path}`, {
    headers: { Authorization: "Bearer test" },
  })

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

const ids = (body: { data: Array<{ id: string }> }) =>
  body.data.map((a) => a.id)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.announcement.findMany).mockImplementation(((a: never) =>
    Promise.resolve(query(a))) as never)
  vi.mocked(db.announcement.count).mockImplementation(((a: {
    where: Record<string, unknown>
  }) =>
    Promise.resolve(TABLE.filter((r) => matches(r, a.where)).length)) as never)
  vi.mocked(db.announcement.findFirst).mockImplementation(((a: never) =>
    Promise.resolve(query(a)[0] ?? null)) as never)
  vi.mocked(db.announcementRead.findMany).mockResolvedValue([
    { announcementId: "ann-school" },
  ] as never)
  vi.mocked(db.announcementRead.upsert).mockResolvedValue({} as never)
  // The student sits in class-a; the teacher teaches class-a.
  vi.mocked(db.studentClass.findMany).mockResolvedValue([
    { classId: "class-a" },
  ] as never)
  vi.mocked(db.class.findMany).mockResolvedValue([{ id: "class-a" }] as never)
})

describe("GET /api/mobile/announcements", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { GET } = await import("@/app/api/mobile/announcements/route")
    expect((await GET(req())).status).toBe(401)
    expect(db.announcement.findMany).not.toHaveBeenCalled()
  })

  it("student: only published notices addressed to them — never a staff notice", async () => {
    await authAs("STUDENT")
    const { GET } = await import("@/app/api/mobile/announcements/route")
    const res = await GET(req())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(ids(body)).toEqual([
      "ann-pinned",
      "ann-school",
      "ann-students",
      "ann-class-mine",
    ])
    expect(ids(body)).not.toContain("ann-staff")
    expect(body.total).toBe(4)
  })

  it("unknown or missing role reads as an audience-only user, not staff", async () => {
    await authAs("SUPER_ADMIN")
    const { GET } = await import("@/app/api/mobile/announcements/route")
    const body = await (await GET(req())).json()
    expect(ids(body)).toEqual(["ann-pinned", "ann-school"])
  })

  it("teacher: the whole school list like the web table, drafts included, pinned first", async () => {
    await authAs("TEACHER")
    const { GET } = await import("@/app/api/mobile/announcements/route")
    const body = await (await GET(req("?page=1&per_page=20"))).json()
    expect(ids(body)).toEqual([
      "ann-pinned",
      "ann-draft",
      "ann-staff",
      "ann-school",
      "ann-students",
      "ann-class-mine",
      "ann-class-other",
    ])
    expect(body).toMatchObject({ total: 7, page: 1, per_page: 20 })
    const draft = body.data.find((a: { id: string }) => a.id === "ann-draft")
    const school = body.data.find((a: { id: string }) => a.id === "ann-school")
    // Original fields stay; new ones are additive.
    expect(school).toMatchObject({
      title: "Notice ann-school",
      content: "Body text",
      priority: "normal",
      author_name: null,
      scope: "school",
      is_published: true,
      is_pinned: false,
      created_at: at(5).toISOString(),
      is_read: true,
    })
    expect(draft).toMatchObject({ is_published: false, is_read: false })
  })

  it("cross-tenant: another school's notices never appear", async () => {
    await authAs("ADMIN", OTHER_SCHOOL)
    const { GET } = await import("@/app/api/mobile/announcements/route")
    const body = await (await GET(req())).json()
    expect(ids(body)).toEqual(["ann-foreign"])
  })

  it("paginates, searches by title and localizes when lang is given", async () => {
    await authAs("TEACHER")
    const { GET } = await import("@/app/api/mobile/announcements/route")
    const page2 = await (await GET(req("?page=2&per_page=3"))).json()
    expect(ids(page2)).toEqual(["ann-school", "ann-students", "ann-class-mine"])
    const found = await (await GET(req("?title=STUDENTS&lang=ar"))).json()
    expect(ids(found)).toEqual(["ann-students"])
    expect(found.data[0].title).toBe("[ar] Notice ann-students")
  })
})

describe("GET /api/mobile/announcements/:id", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { GET } = await import("@/app/api/mobile/announcements/[id]/route")
    expect((await GET(req("/ann-school"), ctx("ann-school"))).status).toBe(401)
  })

  it("student: 404 for a staff notice, a draft or another class; nothing marked read", async () => {
    await authAs("STUDENT")
    const { GET } = await import("@/app/api/mobile/announcements/[id]/route")
    for (const id of ["ann-staff", "ann-draft", "ann-class-other"]) {
      expect((await GET(req(`/${id}`), ctx(id))).status).toBe(404)
    }
    expect(db.announcementRead.upsert).not.toHaveBeenCalled()
  })

  it("cross-tenant: 404", async () => {
    await authAs("ADMIN")
    const { GET } = await import("@/app/api/mobile/announcements/[id]/route")
    expect((await GET(req("/ann-foreign"), ctx("ann-foreign"))).status).toBe(
      404
    )
  })

  it("student: opens their own notice and marks it read", async () => {
    await authAs("STUDENT")
    const { GET } = await import("@/app/api/mobile/announcements/[id]/route")
    const res = await GET(req("/ann-class-mine?lang=ar"), ctx("ann-class-mine"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      id: "ann-class-mine",
      title: "[ar] Notice ann-class-mine",
      content: "Body text",
      scope: "class",
      is_published: true,
      updated_at: at(2).toISOString(),
      lang: "en",
    })
    expect(db.announcementRead.upsert).toHaveBeenCalledTimes(1)
  })

  it("teacher: may open a draft", async () => {
    await authAs("TEACHER")
    const { GET } = await import("@/app/api/mobile/announcements/[id]/route")
    const res = await GET(req("/ann-draft"), ctx("ann-draft"))
    expect(res.status).toBe(200)
    expect((await res.json()).is_published).toBe(false)
  })
})
