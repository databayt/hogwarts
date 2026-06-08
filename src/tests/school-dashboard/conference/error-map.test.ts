// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { resolveLiveClassError } from "@/components/school-dashboard/conference/error-map"

const dictWithErrors = {
  liveClasses: {
    errors: {
      notAuthenticated: "AR-not-authed",
      missingSchool: "AR-missing-school",
      unauthorized: "AR-unauthorized",
      validation: "AR-validation",
      notFound: "AR-not-found",
      invalidState: "AR-invalid-state",
      roomFull: "AR-room-full",
      maxDuration: "AR-max-dur",
      tokenFailed: "AR-token-fail",
      tokenExpired: "AR-token-expired",
      participantDenied: "AR-denied",
      providerUnavailable: "AR-provider-down",
      recordingNotFound: "AR-rec-not-found",
      recordingFailed: "AR-rec-failed",
    },
  },
} as never

const emptyDict = { liveClasses: { errors: {} } } as never

describe("resolveLiveClassError — happy path", () => {
  const cases: { code: string; expected: string }[] = [
    { code: ACTION_ERRORS.NOT_AUTHENTICATED, expected: "AR-not-authed" },
    { code: ACTION_ERRORS.MISSING_SCHOOL, expected: "AR-missing-school" },
    { code: ACTION_ERRORS.UNAUTHORIZED, expected: "AR-unauthorized" },
    { code: ACTION_ERRORS.VALIDATION_ERROR, expected: "AR-validation" },
    { code: ACTION_ERRORS.LIVE_CLASS_NOT_FOUND, expected: "AR-not-found" },
    {
      code: ACTION_ERRORS.LIVE_CLASS_INVALID_STATE,
      expected: "AR-invalid-state",
    },
    { code: ACTION_ERRORS.LIVE_CLASS_ROOM_FULL, expected: "AR-room-full" },
    {
      code: ACTION_ERRORS.LIVE_CLASS_MAX_DURATION_EXCEEDED,
      expected: "AR-max-dur",
    },
    { code: ACTION_ERRORS.LIVE_CLASS_TOKEN_FAILED, expected: "AR-token-fail" },
    {
      code: ACTION_ERRORS.LIVE_CLASS_PARTICIPANT_DENIED,
      expected: "AR-denied",
    },
    {
      code: ACTION_ERRORS.LIVE_CLASS_PROVIDER_UNAVAILABLE,
      expected: "AR-provider-down",
    },
    {
      code: ACTION_ERRORS.LIVE_CLASS_RECORDING_NOT_FOUND,
      expected: "AR-rec-not-found",
    },
    {
      code: ACTION_ERRORS.LIVE_CLASS_RECORDING_FAILED,
      expected: "AR-rec-failed",
    },
  ]
  for (const { code, expected } of cases) {
    it(`${code} → "${expected}"`, () => {
      expect(resolveLiveClassError(dictWithErrors, code)).toBe(expected)
    })
  }
})

describe("resolveLiveClassError — fallbacks", () => {
  it("missing code → generic fallback", () => {
    expect(resolveLiveClassError(dictWithErrors, undefined)).toBe(
      "Something went wrong."
    )
  })
  it("unknown code → generic fallback", () => {
    expect(resolveLiveClassError(dictWithErrors, "TOTALLY_UNKNOWN")).toBe(
      "Something went wrong."
    )
  })
  it("missing dict → still returns a non-empty English fallback per case", () => {
    const out = resolveLiveClassError(
      undefined,
      ACTION_ERRORS.LIVE_CLASS_NOT_FOUND
    )
    expect(typeof out).toBe("string")
    expect(out.length).toBeGreaterThan(0)
  })
  it("dict with empty errors → still returns the case-level English fallback", () => {
    const out = resolveLiveClassError(
      emptyDict,
      ACTION_ERRORS.LIVE_CLASS_PARTICIPANT_DENIED
    )
    expect(out).toContain("not enrolled")
  })
})
