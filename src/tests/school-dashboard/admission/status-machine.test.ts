// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pure assertions over the admission status machine — the single source of
 * truth for both the server action and every status dropdown. Pins the
 * EXPIRED semantics: cron-set only, admin's one move out is a re-offer.
 */
import { describe, expect, it } from "vitest"

import {
  ALLOWED_TRANSITIONS,
  getAllowedTransitions,
  isTransitionAllowed,
  isValidTargetStatus,
  VALID_STATUSES,
} from "@/components/school-dashboard/admission/status-machine"

describe("status machine — EXPIRED", () => {
  it("allows exactly the re-offer transition out of EXPIRED", () => {
    expect(getAllowedTransitions("EXPIRED")).toEqual(["SELECTED"])
  })

  it("is never a manually-settable target from any state", () => {
    expect(isValidTargetStatus("EXPIRED")).toBe(false)
    for (const from of Object.keys(ALLOWED_TRANSITIONS)) {
      expect(isTransitionAllowed(from, "EXPIRED")).toBe(false)
    }
  })
})

describe("status machine — invariants", () => {
  it("terminal states have no outgoing transitions", () => {
    for (const status of ["REJECTED", "WITHDRAWN", "ADMITTED"]) {
      expect(getAllowedTransitions(status)).toEqual([])
    }
  })

  it("ADMITTED is never a dropdown target (confirmEnrollment-only)", () => {
    expect(isValidTargetStatus("ADMITTED")).toBe(false)
    for (const from of Object.keys(ALLOWED_TRANSITIONS)) {
      expect(isTransitionAllowed(from, "ADMITTED")).toBe(false)
    }
  })

  it("every valid target is reachable from at least one state", () => {
    const reachable = new Set(Object.values(ALLOWED_TRANSITIONS).flat())
    for (const status of VALID_STATUSES) {
      expect(reachable.has(status), `${status} unreachable`).toBe(true)
    }
  })

  it("every transition target of a non-terminal state is a known state", () => {
    const known = new Set(Object.keys(ALLOWED_TRANSITIONS))
    for (const [from, targets] of Object.entries(ALLOWED_TRANSITIONS)) {
      for (const to of targets) {
        expect(known.has(to), `${from} → ${to} targets unknown state`).toBe(
          true
        )
      }
    }
  })
})
