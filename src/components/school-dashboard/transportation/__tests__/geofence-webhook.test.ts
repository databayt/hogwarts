// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Covers the service-account geofence-boarding path that the webhook depends
// on: API-token generation/verification (src/lib/api-tokens) and the pure
// boarding bridge (actions/geofence-internal). bcryptjs is REAL here so the
// generate→verify round-trip is exercised end-to-end; only the DB is mocked.

import bcrypt from "bcryptjs"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { generateApiToken, verifyApiToken } from "@/lib/api-tokens"
import { db } from "@/lib/db"

import { recordBoardingFromGeofenceInternal } from "../actions/geofence-internal"

vi.mock("@/lib/db", () => ({
  db: {
    schoolApiToken: { findMany: vi.fn(), update: vi.fn() },
    route: { findFirst: vi.fn() },
    routeAssignment: { findFirst: vi.fn() },
    trip: { findFirst: vi.fn() },
    tripBoarding: { upsert: vi.fn() },
  },
}))

const SCHOOL_A = "school-A"
const SCOPE = "transportation.geofence_boarding"

describe("generateApiToken", () => {
  it("produces a `prefix.secret` token whose hash verifies", async () => {
    const { plaintext, tokenPrefix, tokenHash } = await generateApiToken()
    expect(plaintext).toMatch(/^[0-9a-f]{8}\.[0-9a-f]{48}$/)
    expect(tokenPrefix).toBe(plaintext.slice(0, 8))
    expect(await bcrypt.compare(plaintext, tokenHash)).toBe(true)
  })

  it("produces a unique token each call", async () => {
    const a = await generateApiToken()
    const b = await generateApiToken()
    expect(a.plaintext).not.toBe(b.plaintext)
  })
})

describe("verifyApiToken", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects an empty token", async () => {
    const r = await verifyApiToken("", SCOPE)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe("MISSING_API_TOKEN")
  })

  it("rejects a malformed token (no dot separator)", async () => {
    const r = await verifyApiToken("abcdefgh", SCOPE)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe("INVALID_API_TOKEN")
  })

  it("rejects when no candidate matches the prefix", async () => {
    vi.mocked(db.schoolApiToken.findMany).mockResolvedValue([] as never)
    const { plaintext } = await generateApiToken()
    const r = await verifyApiToken(plaintext, SCOPE)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe("INVALID_API_TOKEN")
  })

  it("returns INSUFFICIENT_SCOPE when the token lacks the required scope", async () => {
    const { plaintext, tokenHash } = await generateApiToken()
    vi.mocked(db.schoolApiToken.findMany).mockResolvedValue([
      { id: "t1", schoolId: SCHOOL_A, tokenHash, scopes: ["other.scope"] },
    ] as never)
    const r = await verifyApiToken(plaintext, SCOPE)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe("INSUFFICIENT_SCOPE")
  })

  it("verifies a valid token and returns its schoolId + scopes", async () => {
    const { plaintext, tokenHash } = await generateApiToken()
    vi.mocked(db.schoolApiToken.findMany).mockResolvedValue([
      { id: "t1", schoolId: SCHOOL_A, tokenHash, scopes: [SCOPE] },
    ] as never)
    vi.mocked(db.schoolApiToken.update).mockResolvedValue({} as never)
    const r = await verifyApiToken(plaintext, SCOPE)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.token.schoolId).toBe(SCHOOL_A)
      expect(r.token.scopes).toContain(SCOPE)
    }
  })
})

describe("recordBoardingFromGeofenceInternal", () => {
  beforeEach(() => vi.clearAllMocks())

  const base = {
    schoolId: SCHOOL_A,
    studentId: "stu-1",
    geofenceId: "gf-1",
    eventType: "ENTER" as const,
    recordedBy: "system:test",
  }

  it("returns ROUTE_NOT_FOUND when no active route maps to the geofence (schoolId-scoped)", async () => {
    vi.mocked(db.route.findFirst).mockResolvedValue(null)
    const r = await recordBoardingFromGeofenceInternal(base)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("ROUTE_NOT_FOUND")
    expect(db.route.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: SCHOOL_A,
          geofenceId: "gf-1",
        }),
      })
    )
  })

  it("returns ROUTE_ASSIGNMENT_NOT_FOUND when the student isn't assigned", async () => {
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "r1" } as never)
    vi.mocked(db.routeAssignment.findFirst).mockResolvedValue(null)
    const r = await recordBoardingFromGeofenceInternal(base)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("ROUTE_ASSIGNMENT_NOT_FOUND")
  })

  it("returns TRIP_INVALID_STATE when no IN_PROGRESS trip exists today", async () => {
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "r1" } as never)
    vi.mocked(db.routeAssignment.findFirst).mockResolvedValue({
      stopId: "st1",
    } as never)
    vi.mocked(db.trip.findFirst).mockResolvedValue(null)
    const r = await recordBoardingFromGeofenceInternal(base)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("TRIP_INVALID_STATE")
  })

  it("records BOARDED on ENTER and returns the tripId", async () => {
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "r1" } as never)
    vi.mocked(db.routeAssignment.findFirst).mockResolvedValue({
      stopId: "st1",
    } as never)
    vi.mocked(db.trip.findFirst).mockResolvedValue({ id: "trip-1" } as never)
    vi.mocked(db.tripBoarding.upsert).mockResolvedValue({
      id: "b1",
      status: "BOARDED",
    } as never)
    const r = await recordBoardingFromGeofenceInternal(base)
    expect(r.success).toBe(true)
    if (r.success) expect(r.tripId).toBe("trip-1")
    expect(db.tripBoarding.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: "BOARDED",
          schoolId: SCHOOL_A,
        }),
      })
    )
  })

  it("records ALIGHTED on EXIT", async () => {
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "r1" } as never)
    vi.mocked(db.routeAssignment.findFirst).mockResolvedValue({
      stopId: "st1",
    } as never)
    vi.mocked(db.trip.findFirst).mockResolvedValue({ id: "trip-1" } as never)
    vi.mocked(db.tripBoarding.upsert).mockResolvedValue({
      id: "b1",
      status: "ALIGHTED",
    } as never)
    const r = await recordBoardingFromGeofenceInternal({
      ...base,
      eventType: "EXIT",
    })
    expect(r.success).toBe(true)
    expect(db.tripBoarding.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: "ALIGHTED" }),
      })
    )
  })
})
