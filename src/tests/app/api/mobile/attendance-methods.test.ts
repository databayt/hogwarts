// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { parseEnabledModules } from "@/lib/enabled-modules"

// The route must read/write the default AttendancePolicy row and never
// touch School.enabledModules (the sidebar's string[] of module keys).

vi.mock("@/lib/db", () => ({
  db: {
    attendancePolicy: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    school: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL_ID = "school-1"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: "user-1",
    email: "u@example.com",
    schoolId: SCHOOL_ID,
    role,
  })
}

function put(body: unknown) {
  return new NextRequest("http://localhost/api/mobile/attendance/methods", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { Authorization: "Bearer test" },
  })
}

function get() {
  return new NextRequest("http://localhost/api/mobile/attendance/methods", {
    headers: { Authorization: "Bearer test" },
  })
}

describe("/api/mobile/attendance/methods", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { GET } = await import("@/app/api/mobile/attendance/methods/route")
    const res = await GET(get())
    expect(res.status).toBe(401)
  })

  it("GET falls back to defaults when no policy exists", async () => {
    await authAs("TEACHER")
    vi.mocked(db.attendancePolicy.findFirst).mockResolvedValue(null)
    const { GET } = await import("@/app/api/mobile/attendance/methods/route")
    const body = await (await GET(get())).json()
    expect(body.methods).toContain("MANUAL")
    expect(db.school.findUnique).not.toHaveBeenCalled()
  })

  it("GET reads methods from the default policy, scoped to the school", async () => {
    await authAs("TEACHER")
    vi.mocked(db.attendancePolicy.findFirst).mockResolvedValue({
      id: "p1",
      methods: ["QR_CODE", "NOT_A_METHOD"],
    } as never)
    const { GET } = await import("@/app/api/mobile/attendance/methods/route")
    const body = await (await GET(get())).json()
    expect(body.methods).toEqual(["QR_CODE"])
    expect(
      vi.mocked(db.attendancePolicy.findFirst).mock.calls[0][0]?.where
    ).toMatchObject({ schoolId: SCHOOL_ID })
  })

  it("PUT is forbidden for non-admins", async () => {
    await authAs("TEACHER")
    const { PUT } = await import("@/app/api/mobile/attendance/methods/route")
    const res = await PUT(put({ methods: ["MANUAL"] }))
    expect(res.status).toBe(403)
  })

  it("PUT rejects unknown methods", async () => {
    await authAs("ADMIN")
    const { PUT } = await import("@/app/api/mobile/attendance/methods/route")
    const res = await PUT(put({ methods: ["MANUAL", "TELEPATHY"] }))
    expect(res.status).toBe(400)
  })

  it("PUT updates the policy row and never writes School.enabledModules", async () => {
    await authAs("ADMIN")
    vi.mocked(db.attendancePolicy.findFirst).mockResolvedValue({
      id: "p1",
      methods: ["MANUAL"],
    } as never)
    const { PUT } = await import("@/app/api/mobile/attendance/methods/route")
    const res = await PUT(put({ methods: ["MANUAL", "QR_CODE", "MANUAL"] }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ methods: ["MANUAL", "QR_CODE"] })
    expect(db.attendancePolicy.updateMany).toHaveBeenCalledWith({
      where: { id: "p1", schoolId: SCHOOL_ID },
      data: { methods: ["MANUAL", "QR_CODE"] },
    })
    expect(db.school.update).not.toHaveBeenCalled()
  })

  it("PUT creates the default policy when missing", async () => {
    await authAs("ADMIN")
    vi.mocked(db.attendancePolicy.findFirst).mockResolvedValue(null)
    const { PUT } = await import("@/app/api/mobile/attendance/methods/route")
    await PUT(put({ methods: ["KIOSK"] }))
    expect(db.attendancePolicy.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schoolId: SCHOOL_ID,
        methods: ["KIOSK"],
        appliesTo: ["ALL"],
      }),
    })
  })
})

describe("parseEnabledModules", () => {
  it("keeps arrays, treats null and legacy objects as unconfigured", () => {
    expect(parseEnabledModules(["exams", 3, "finance"])).toEqual([
      "exams",
      "finance",
    ])
    expect(parseEnabledModules(null)).toBeNull()
    expect(parseEnabledModules({ attendanceMethods: ["MANUAL"] })).toBeNull()
  })
})
