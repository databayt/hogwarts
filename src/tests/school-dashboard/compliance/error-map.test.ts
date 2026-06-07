// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { resolveComplianceError } from "@/components/school-dashboard/compliance/error-map"

function makeDict(errors: Record<string, string>) {
  return { errors } as any
}

describe("resolveComplianceError", () => {
  const dict = makeDict({
    NOT_AUTHENTICATED: "Not signed in",
    VALIDATION_FAILED: "Form invalid",
    FORBIDDEN: "Access denied",
    CONFIG_NOT_FOUND: "Config missing",
  })

  it("returns NOT_AUTHENTICATED message when code is undefined", () => {
    expect(resolveComplianceError(dict, undefined)).toBe("Not signed in")
  })

  it("returns the matching dictionary entry by code", () => {
    expect(resolveComplianceError(dict, "FORBIDDEN")).toBe("Access denied")
    expect(resolveComplianceError(dict, "CONFIG_NOT_FOUND")).toBe(
      "Config missing"
    )
  })

  it("falls back to VALIDATION_FAILED when unknown code provided", () => {
    expect(resolveComplianceError(dict, "ENCRYPTION_KEY_MISSING")).toBe(
      "Form invalid"
    )
  })

  it("falls back to the raw code if neither match nor VALIDATION_FAILED exist", () => {
    const sparseDict = makeDict({
      NOT_AUTHENTICATED: "Not signed in",
    })

    expect(resolveComplianceError(sparseDict, "ENCRYPTION_KEY_MISSING")).toBe(
      "ENCRYPTION_KEY_MISSING"
    )
  })
})
