// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

const { loadClassReadiness } = vi.hoisted(() => ({
  loadClassReadiness: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    section: { findMany: vi.fn() },
    school: { findUnique: vi.fn() },
  },
}))
vi.mock("@/components/school-dashboard/school/readiness/queries", () => ({
  loadClassReadiness,
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

import { GET } from "@/app/api/mobile/admin/readiness/route"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: "u1",
    email: "u@e.com",
    schoolId: "s1",
    role,
  })
}

function get(qs = "?date=2026-11-24") {
  return new NextRequest(`http://localhost/api/mobile/admin/readiness${qs}`, {
    headers: { Authorization: "Bearer t" },
  })
}

const member = (name: string, reasons: string[], level = "ok") => ({
  userId: name,
  name,
  username: `${name}-u`,
  readiness: { level, reasons },
})

const sections = [
  {
    sectionId: "a",
    sectionName: "1A",
    supervisor: { ...member("Sup", ["on_app"]), canCover: true },
    classes: [
      {
        sessionId: "x",
        start: "08:00",
        subject: "Math",
        teacher: member("T", ["push_off"], "warn"),
      },
      { sessionId: "y", start: "09:00", subject: null, teacher: null },
    ],
    students: [member("St", ["never_signed_in"], "bad")],
  },
  {
    sectionId: "b",
    sectionName: "1B",
    supervisor: null,
    classes: [],
    students: [],
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  loadClassReadiness.mockResolvedValue(sections)
})

describe("GET /api/mobile/admin/readiness", () => {
  it("admin sees every class, shaped for the app", async () => {
    await authAs("ADMIN")
    const res = await GET(get())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(loadClassReadiness).toHaveBeenCalledWith("s1", "2026-11-24")
    expect(body.date).toBe("2026-11-24")
    expect(body.classes).toHaveLength(2)
    expect(body.classes[0]).toEqual({
      sectionId: "a",
      name: "1A",
      supervisor: {
        name: "Sup",
        level: "ok",
        reasons: ["on_app"],
        canCover: true,
      },
      sessions: [
        {
          start: "08:00",
          subject: "Math",
          teacher: { name: "T", level: "warn", reasons: ["push_off"] },
        },
        { start: "09:00", subject: null, teacher: null },
      ],
      students: [
        {
          name: "St",
          username: "St-u",
          level: "bad",
          reasons: ["never_signed_in"],
        },
      ],
    })
    expect(body.classes[1].supervisor).toBeNull()
  })

  it("teacher sees only own homeroom sections", async () => {
    await authAs("TEACHER")
    vi.mocked(db.section.findMany).mockResolvedValue([{ id: "a" }] as never)
    const res = await GET(get())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.classes.map((c: { sectionId: string }) => c.sectionId)).toEqual([
      "a",
    ])
  })

  it("teacher with no homeroom section gets 403", async () => {
    await authAs("TEACHER")
    vi.mocked(db.section.findMany).mockResolvedValue([])
    const res = await GET(get())
    expect(res.status).toBe(403)
    expect(loadClassReadiness).not.toHaveBeenCalled()
  })

  it("other roles get 403", async () => {
    await authAs("STUDENT")
    expect((await GET(get())).status).toBe(403)
  })

  it("defaults to the school-local today", async () => {
    await authAs("ADMIN")
    vi.mocked(db.school.findUnique).mockResolvedValue({
      timezone: "Africa/Khartoum",
    } as never)
    const res = await GET(get(""))
    const body = await res.json()
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(loadClassReadiness).toHaveBeenCalledWith("s1", body.date)
  })

  it("rejects a malformed date", async () => {
    await authAs("ADMIN")
    expect((await GET(get("?date=yesterday"))).status).toBe(400)
  })
})
