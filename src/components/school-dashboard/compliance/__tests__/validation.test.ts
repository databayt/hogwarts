// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ComplianceProvider, ConnectorMode } from "@prisma/client"
import { describe, expect, it } from "vitest"

import {
  createSharedGroupSchema,
  downloadArtifactSchema,
  retrySubmissionSchema,
  updateComplianceConfigSchema,
} from "../validation"

describe("compliance validation schemas", () => {
  describe("updateComplianceConfigSchema", () => {
    const valid = {
      provider: ComplianceProvider.ADEK_ESIS,
      enabled: true,
      mode: ConnectorMode.DRY_RUN,
      submissionTimeUtc: "10:00",
      parentContactSlaMinutes: 120,
      notifyAdminOnFailure: true,
    }

    it("accepts valid input", () => {
      expect(updateComplianceConfigSchema.safeParse(valid).success).toBe(true)
    })

    it("rejects invalid HH:MM format (no colon)", () => {
      expect(
        updateComplianceConfigSchema.safeParse({
          ...valid,
          submissionTimeUtc: "1000",
        }).success
      ).toBe(false)
    })

    it("rejects invalid HH:MM format (24:00 out of range)", () => {
      expect(
        updateComplianceConfigSchema.safeParse({
          ...valid,
          submissionTimeUtc: "24:00",
        }).success
      ).toBe(false)
    })

    it("rejects SLA < 15 min", () => {
      expect(
        updateComplianceConfigSchema.safeParse({
          ...valid,
          parentContactSlaMinutes: 10,
        }).success
      ).toBe(false)
    })

    it("rejects SLA > 12h (720 min)", () => {
      expect(
        updateComplianceConfigSchema.safeParse({
          ...valid,
          parentContactSlaMinutes: 721,
        }).success
      ).toBe(false)
    })

    it("accepts sharedGroupId=null", () => {
      expect(
        updateComplianceConfigSchema.safeParse({
          ...valid,
          sharedGroupId: null,
        }).success
      ).toBe(true)
    })

    it("rejects non-boolean enabled", () => {
      expect(
        updateComplianceConfigSchema.safeParse({
          ...valid,
          enabled: "yes",
        }).success
      ).toBe(false)
    })
  })

  describe("retrySubmissionSchema", () => {
    it("accepts non-empty submissionId", () => {
      expect(
        retrySubmissionSchema.safeParse({ submissionId: "sub-1" }).success
      ).toBe(true)
    })

    it("rejects empty submissionId", () => {
      expect(
        retrySubmissionSchema.safeParse({ submissionId: "" }).success
      ).toBe(false)
    })
  })

  describe("downloadArtifactSchema", () => {
    it("accepts non-empty submissionId", () => {
      expect(
        downloadArtifactSchema.safeParse({ submissionId: "sub-1" }).success
      ).toBe(true)
    })
  })

  describe("createSharedGroupSchema", () => {
    const valid = {
      name: "Aldar Group",
      provider: ComplianceProvider.ADEK_ESIS,
      secretJson: '{"apiKey":"x"}',
    }

    it("accepts valid input", () => {
      expect(createSharedGroupSchema.safeParse(valid).success).toBe(true)
    })

    it("rejects name shorter than 2 chars", () => {
      expect(
        createSharedGroupSchema.safeParse({ ...valid, name: "A" }).success
      ).toBe(false)
    })

    it("rejects name longer than 120 chars", () => {
      expect(
        createSharedGroupSchema.safeParse({ ...valid, name: "x".repeat(121) })
          .success
      ).toBe(false)
    })

    it("rejects empty secretJson", () => {
      expect(
        createSharedGroupSchema.safeParse({ ...valid, secretJson: "" }).success
      ).toBe(false)
    })
  })
})
