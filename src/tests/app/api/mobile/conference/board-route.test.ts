// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { GET, PUT } from "@/app/api/mobile/conference/[id]/board/route"
import { authenticate } from "@/app/api/mobile/lib/authenticate"

vi.mock("server-only", () => ({}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: vi.fn((v: unknown) => v instanceof Response),
}))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn() },
    conferenceParticipant: { findUnique: vi.fn() },
    conferenceEvent: { upsert: vi.fn(), findFirst: vi.fn() },
  },
}))

const SCHOOL = "school-1"
const USER = "user-1"
const SESSION = "s1"
const params = Promise.resolve({ id: SESSION })
const stroke = {
  id: "st1",
  points: [
    [0.1, 0.2],
    [0.3, 0.4],
  ],
  color: "#ef4444",
  width: 4,
  tool: "pen",
}

function req(method: "GET" | "PUT", body?: unknown) {
  return new NextRequest(`http://x/api/mobile/conference/${SESSION}/board`, {
    method,
    headers: { authorization: "Bearer t", "content-type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

function seat(role: string, board = true) {
  vi.mocked(db.conference.findFirst).mockResolvedValue({
    id: SESSION,
    school: { conferenceToolWhiteboard: board },
  } as never)
  vi.mocked(db.conferenceParticipant.findUnique).mockResolvedValue({
    role,
    schoolId: SCHOOL,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(authenticate).mockResolvedValue({
    userId: USER,
    email: "t@e.com",
    schoolId: SCHOOL,
    role: "TEACHER",
  })
})

describe("/api/mobile/conference/[id]/board", () => {
  it("lets a host save the board, cleaned", async () => {
    seat("HOST")
    vi.mocked(db.conferenceEvent.upsert).mockResolvedValue({ id: "e" } as never)
    const res = await PUT(req("PUT", { strokes: [stroke, { id: "bad" }] }), {
      params,
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, data: { count: 1 } })
    const call = vi.mocked(db.conferenceEvent.upsert).mock.calls[0][0]
    expect(call.where).toEqual({ eventId: `lc:${SESSION}:board` })
  })

  it("returns the saved board to a co-host", async () => {
    seat("CO_HOST")
    vi.mocked(db.conferenceEvent.findFirst).mockResolvedValue({
      payload: { strokes: [stroke] },
    } as never)
    const res = await GET(req("GET"), { params })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.strokes).toHaveLength(1)
    expect(json.data.strokes[0].id).toBe("st1")
  })

  it("403s a student seat and writes nothing", async () => {
    seat("PARTICIPANT")
    const res = await PUT(req("PUT", { strokes: [stroke] }), { params })
    expect(res.status).toBe(403)
    expect(db.conferenceEvent.upsert).not.toHaveBeenCalled()
  })

  it("403s when the school's board switch is off", async () => {
    seat("HOST", false)
    const res = await GET(req("GET"), { params })
    expect(res.status).toBe(403)
  })

  it("400s a body that is not JSON strokes", async () => {
    seat("HOST")
    const res = await PUT(req("PUT", { strokes: "nope" }), { params })
    expect(res.status).toBe(400)
  })
})
