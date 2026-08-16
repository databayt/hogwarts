// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * "Four channels, one pipeline" — the executable half of the promise made in
 * content/docs-en/admission.mdx.
 *
 * Every student is born from an Application tagged with an AdmissionChannel
 * (PORTAL / ADMIN_DIRECT / ONBOARDING_IMPORT / BULK_IMPORT / LEGACY_BACKFILL).
 * That was already true at the data layer; what this file pins is that the
 * dashboard can SEE and TRACK all of them:
 *
 *  - the Applications tab lists every channel by default and narrows on
 *    request (single, multi, deep-linkable, garbage-safe);
 *  - the enrollment tab keeps its PORTAL default (direct admits never pass
 *    through offer/registration-fee confirmation);
 *  - the two one-by-one wizards agree on the step shape from ONE source;
 *  - the provisioning warning codes an admin must see all have copy.
 */
import { describe, expect, it, vi } from "vitest"

import {
  buildApplicationWhere,
  buildEnrollmentWhere,
} from "@/components/school-dashboard/admission/queries"
import { translateEnrollmentWarning } from "@/components/school-dashboard/admission/warning-messages"
import {
  ADMISSION_STEP_CONFIG,
  APPLY_STEPS,
  STEP_GROUPS,
} from "@/components/school-marketing/application/config.client"

vi.mock("@/lib/db", () => ({ db: {} }))

const SCHOOL = "school_1"

describe("Applications tab — channel filter", () => {
  it("lists EVERY channel when no channel is requested (the default view)", () => {
    expect(buildApplicationWhere(SCHOOL, {}).channel).toBeUndefined()
    expect(
      buildApplicationWhere(SCHOOL, { channel: "" }).channel
    ).toBeUndefined()
    expect(
      buildApplicationWhere(SCHOOL, { channel: [] }).channel
    ).toBeUndefined()
    expect(
      buildApplicationWhere(SCHOOL, { channel: "all" }).channel
    ).toBeUndefined()
  })

  it("narrows to one channel", () => {
    expect(buildApplicationWhere(SCHOOL, { channel: "PORTAL" }).channel).toBe(
      "PORTAL"
    )
    expect(
      buildApplicationWhere(SCHOOL, { channel: ["ADMIN_DIRECT"] }).channel
    ).toBe("ADMIN_DIRECT")
  })

  it("narrows to several channels (the facet is multi-select)", () => {
    expect(
      buildApplicationWhere(SCHOOL, {
        channel: ["PORTAL", "BULK_IMPORT"],
      }).channel
    ).toEqual({ in: ["PORTAL", "BULK_IMPORT"] })
  })

  it("drops unknown values instead of handing Prisma an invalid enum", () => {
    // The value comes from a URL query param — a typo or a stale link must
    // never take the page down.
    expect(
      buildApplicationWhere(SCHOOL, { channel: "GARBAGE" }).channel
    ).toBeUndefined()
    expect(
      buildApplicationWhere(SCHOOL, {
        channel: ["GARBAGE", "ADMIN_DIRECT"],
      }).channel
    ).toBe("ADMIN_DIRECT")
  })

  it("always scopes by school", () => {
    expect(buildApplicationWhere(SCHOOL, { channel: "PORTAL" }).schoolId).toBe(
      SCHOOL
    )
  })
})

describe("Enrollment tab — stays on the reviewed pipeline by default", () => {
  it("defaults to PORTAL (direct admits are already ADMITTED)", () => {
    expect(buildEnrollmentWhere(SCHOOL, {}).channel).toBe("PORTAL")
  })

  it("can be widened explicitly", () => {
    expect(buildEnrollmentWhere(SCHOOL, { channel: "all" }).channel).toBe(
      undefined
    )
  })
})

describe("One-by-one wizards — one step shape", () => {
  it("derives the footer config from the wizard's own step definitions", () => {
    // Was a fourth hand-written copy in form/footer.tsx; adding a step meant
    // editing four places or shipping a progress bar that disagreed with the
    // wizard.
    expect(ADMISSION_STEP_CONFIG.steps).toBe(APPLY_STEPS)
    expect(ADMISSION_STEP_CONFIG.groups).toBe(STEP_GROUPS)
    expect(ADMISSION_STEP_CONFIG.groupLabels).toHaveLength(
      Object.keys(STEP_GROUPS).length
    )
  })

  it("keeps the four steps both intake wizards share, in the same order", () => {
    // The admin wizard (listings/students/wizard/config.ts) declares
    // ["attachments","personal","location","academic"]; the applicant wizard
    // adds "fees" at the end. The shared prefix is the contract.
    expect(APPLY_STEPS.slice(0, 4)).toEqual([
      "attachments",
      "personal",
      "location",
      "academic",
    ])
  })
})

describe("Provisioning warnings — every code an admin must see has copy", () => {
  const dict = {
    warnings: {
      noFeeStructureMatch: "no structure",
      feeAutoAssignFailed: "auto failed",
      invoiceGenerationFailed: "invoice failed",
      guardianCreateFailed: "guardian failed",
      registrationFeeNoStructure: "reg no structure",
      feesSkippedNoGrade: "no grade",
    },
  } as unknown as Parameters<typeof translateEnrollmentWarning>[1]

  it.each([
    ["NO_FEE_STRUCTURE_MATCH", "no structure"],
    ["FEES_SKIPPED_NO_GRADE", "no grade"],
    ["FEE_AUTO_ASSIGN_FAILED", "auto failed"],
    ["INVOICE_GENERATION_FAILED", "invoice failed"],
    ["GUARDIAN_CREATE_FAILED", "guardian failed"],
    ["REGISTRATION_FEE_NO_STRUCTURE", "reg no structure"],
  ])("%s → dictionary copy", (code, expected) => {
    expect(
      translateEnrollmentWarning(
        { code } as Parameters<typeof translateEnrollmentWarning>[0],
        dict
      )
    ).toBe(expected)
  })

  it("falls back to English when the key is missing, never to an empty string", () => {
    expect(
      translateEnrollmentWarning(
        { code: "FEES_SKIPPED_NO_GRADE" } as Parameters<
          typeof translateEnrollmentWarning
        >[0],
        {} as Parameters<typeof translateEnrollmentWarning>[1]
      )
    ).toMatch(/grade/i)
  })
})
