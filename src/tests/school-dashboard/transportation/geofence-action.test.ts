// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Unit tests for the PUBLIC geofence-boarding wrapper `recordBoardingFromGeofence`
// (actions/geofence.ts). The wrapper is responsible for:
//   1. enforcing the `record_boarding` permission via requireContext
//   2. Zod-parsing the input
//   3. delegating to `recordBoardingFromGeofenceInternal` with schoolId taken
//      from the resolved tenant context (NEVER from args) + recordedBy=userId
//   4. revalidating the trip path on a successful tripId result
//
// We mock ONLY @/auth + @/lib/tenant-context to drive requireContext, plus the
// internal delegate so we can assert exactly what the wrapper passes to it.

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getTenantContext } from "@/lib/tenant-context"

import { recordBoardingFromGeofence } from "@/components/school-dashboard/transportation/actions/geofence"
import { recordBoardingFromGeofenceInternal } from "@/components/school-dashboard/transportation/actions/geofence-internal"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/components/school-dashboard/transportation/actions/geofence-internal", () => ({
  recordBoardingFromGeofenceInternal: vi.fn(),
}))

const SCHOOL_A = "school-A"
const USER_ID = "user-1"

function mockUser(
  role: string,
  schoolId: string | null = SCHOOL_A,
  userId = USER_ID
) {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId, role } } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role,
    isPlatformAdmin: role === "DEVELOPER",
  } as never)
}

const VALID_INPUT = {
  studentId: "student-1",
  geofenceId: "geofence-1",
  eventType: "ENTER" as const,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("recordBoardingFromGeofence (public wrapper)", () => {
  it("denies a disallowed role (STUDENT) with UNAUTHORIZED and never delegates", async () => {
    mockUser("STUDENT")

    const result = await recordBoardingFromGeofence(VALID_INPUT)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    // Permission gate must short-circuit before delegation.
    expect(recordBoardingFromGeofenceInternal).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("returns NOT_AUTHENTICATED when there is no session and never delegates", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_A,
      requestId: null,
      role: null,
      isPlatformAdmin: false,
    } as never)

    const result = await recordBoardingFromGeofence(VALID_INPUT)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
    expect(recordBoardingFromGeofenceInternal).not.toHaveBeenCalled()
  })

  it("allows STAFF and delegates with context schoolId + recordedBy=userId, returning the internal result", async () => {
    mockUser("STAFF", SCHOOL_A, "staff-99")
    const internalResult = {
      success: true as const,
      data: { id: "boarding-1", status: "BOARDED" },
      tripId: "trip-1",
    }
    vi.mocked(recordBoardingFromGeofenceInternal).mockResolvedValue(
      internalResult as never
    )

    const result = await recordBoardingFromGeofence(VALID_INPUT)

    // Delegated exactly once, with schoolId from context + recordedBy=userId
    // + the parsed input fields spread in.
    expect(recordBoardingFromGeofenceInternal).toHaveBeenCalledTimes(1)
    expect(recordBoardingFromGeofenceInternal).toHaveBeenCalledWith({
      schoolId: SCHOOL_A,
      recordedBy: "staff-99",
      studentId: "student-1",
      geofenceId: "geofence-1",
      eventType: "ENTER",
    })
    // Wrapper returns the internal result verbatim.
    expect(result).toBe(internalResult)
    // Successful tripId triggers a revalidation of the trip path.
    expect(revalidatePath).toHaveBeenCalledWith(
      "/[lang]/s/[subdomain]/transportation/trips/trip-1"
    )
  })

  it("takes schoolId from tenant context, NOT from a forged schoolId in args", async () => {
    mockUser("ADMIN", SCHOOL_A, USER_ID)
    vi.mocked(recordBoardingFromGeofenceInternal).mockResolvedValue({
      success: true as const,
      data: { id: "boarding-2" },
      tripId: "trip-2",
    } as never)

    // Attacker tries to inject a foreign school via the args payload.
    await recordBoardingFromGeofence({
      ...VALID_INPUT,
      // @ts-expect-error -- extra field is not in the schema and must be dropped
      schoolId: "school-EVIL",
    })

    const callArg = vi.mocked(recordBoardingFromGeofenceInternal).mock
      .calls[0][0]
    // The injected school is ignored; context schoolId wins.
    expect(callArg.schoolId).toBe(SCHOOL_A)
    expect(callArg.schoolId).not.toBe("school-EVIL")
    expect(callArg.recordedBy).toBe(USER_ID)
    // Only the schema fields (+ schoolId/recordedBy from context) reach the
    // delegate — the forged key was stripped by the Zod parse + the spread of
    // parsed.data (which holds the validated value), so school-EVIL is gone.
    expect(callArg).toEqual({
      schoolId: SCHOOL_A,
      recordedBy: USER_ID,
      studentId: "student-1",
      geofenceId: "geofence-1",
      eventType: "ENTER",
    })
  })

  it("returns VALIDATION_ERROR for bad input (after passing the permission gate) and never delegates", async () => {
    mockUser("ADMIN")

    const result = await recordBoardingFromGeofence({
      studentId: "", // fails .min(1)
      geofenceId: "geofence-1",
      // @ts-expect-error -- invalid enum value
      eventType: "TELEPORT",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe("VALIDATION_ERROR")
      // details carries the Zod error message string.
      expect(typeof result.details).toBe("string")
    }
    expect(recordBoardingFromGeofenceInternal).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
