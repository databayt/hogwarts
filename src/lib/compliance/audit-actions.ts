// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Audit action strings for compliance/regulator events.
 *
 * Used with `logAudit({ action, ... })`. Namespaced under `compliance.*`.
 * Stored as plain strings on AuditLog.action (no enum migration needed).
 */
export const ComplianceAudit = {
  CONFIG_ENABLED: "compliance.config.enabled",
  CONFIG_DISABLED: "compliance.config.disabled",
  CONFIG_MODE_CHANGED: "compliance.config.mode_changed",

  CREDENTIAL_CREATED: "compliance.credential.created",
  CREDENTIAL_ROTATED: "compliance.credential.rotated",
  CREDENTIAL_REVOKED: "compliance.credential.revoked",

  SUBMISSION_QUEUED: "compliance.submission.queued",
  SUBMISSION_SUBMITTED: "compliance.submission.submitted",
  SUBMISSION_ACCEPTED: "compliance.submission.accepted",
  SUBMISSION_REJECTED: "compliance.submission.rejected",
  SUBMISSION_FAILED: "compliance.submission.failed",
  SUBMISSION_CLAIMED: "compliance.submission.claimed",

  PARENT_CONTACT_QUEUED: "compliance.parent_contact.queued",
  PARENT_CONTACT_DELIVERED: "compliance.parent_contact.delivered",
  PARENT_CONTACT_FAILED: "compliance.parent_contact.failed",

  CIRCUIT_BREAKER_OPENED: "compliance.circuit_breaker.opened",
  CIRCUIT_BREAKER_CLOSED: "compliance.circuit_breaker.closed",
  CIRCUIT_BREAKER_HALF_OPEN: "compliance.circuit_breaker.half_open",
} as const

export type ComplianceAuditAction =
  (typeof ComplianceAudit)[keyof typeof ComplianceAudit]
