// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { ComplianceAudit } from "../audit-actions"

describe("ComplianceAudit action strings", () => {
  it("all actions are namespaced under compliance.*", () => {
    for (const action of Object.values(ComplianceAudit)) {
      expect(action).toMatch(/^compliance\./)
    }
  })

  it("config events are present", () => {
    expect(ComplianceAudit.CONFIG_ENABLED).toBe("compliance.config.enabled")
    expect(ComplianceAudit.CONFIG_DISABLED).toBe("compliance.config.disabled")
    expect(ComplianceAudit.CONFIG_MODE_CHANGED).toBe(
      "compliance.config.mode_changed"
    )
  })

  it("submission lifecycle events cover all statuses", () => {
    expect(ComplianceAudit.SUBMISSION_QUEUED).toBeDefined()
    expect(ComplianceAudit.SUBMISSION_SUBMITTED).toBeDefined()
    expect(ComplianceAudit.SUBMISSION_ACCEPTED).toBeDefined()
    expect(ComplianceAudit.SUBMISSION_REJECTED).toBeDefined()
    expect(ComplianceAudit.SUBMISSION_FAILED).toBeDefined()
    expect(ComplianceAudit.SUBMISSION_CLAIMED).toBeDefined()
  })

  it("parent-contact (2h SLA) events present", () => {
    expect(ComplianceAudit.PARENT_CONTACT_QUEUED).toBe(
      "compliance.parent_contact.queued"
    )
    expect(ComplianceAudit.PARENT_CONTACT_DELIVERED).toBeDefined()
    expect(ComplianceAudit.PARENT_CONTACT_FAILED).toBeDefined()
  })

  it("circuit breaker events present", () => {
    expect(ComplianceAudit.CIRCUIT_BREAKER_OPENED).toBeDefined()
    expect(ComplianceAudit.CIRCUIT_BREAKER_CLOSED).toBeDefined()
    expect(ComplianceAudit.CIRCUIT_BREAKER_HALF_OPEN).toBeDefined()
  })

  it("no duplicate action strings", () => {
    const values = Object.values(ComplianceAudit)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  it("credential events present (created/rotated/revoked)", () => {
    expect(ComplianceAudit.CREDENTIAL_CREATED).toBeDefined()
    expect(ComplianceAudit.CREDENTIAL_ROTATED).toBeDefined()
    expect(ComplianceAudit.CREDENTIAL_REVOKED).toBeDefined()
  })
})
