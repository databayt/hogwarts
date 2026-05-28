// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createHash } from "node:crypto"
import { ConnectorMode } from "@prisma/client"

import type {
  ComplianceConnector,
  ComplianceSubmissionPayload,
  SubmissionResult,
} from "../../types"
import { buildAdekCsv } from "./mapper"

/**
 * DRY_RUN connector: builds the CSV, computes a sha256, marks the submission
 * SUBMITTED, but does NOT contact eSIS. A school registrar uploads manually.
 *
 * Use this for the Yasmina BA pilot until ADEK API access or Aldar piggyback
 * credentials land.
 */
export const adekDryRunConnector: ComplianceConnector = {
  id: "adek:dry-run",
  mode: ConnectorMode.DRY_RUN,

  async isConfigured(): Promise<boolean> {
    return true // No external dependency
  },

  async submit(
    payload: ComplianceSubmissionPayload
  ): Promise<SubmissionResult> {
    const { csv, categorized, absentCount, studentCount } =
      buildAdekCsv(payload)
    const sha = createHash("sha256").update(csv).digest("hex")

    return {
      status: "SUBMITTED",
      receiptId: null,
      csvArtifactSha256: sha,
      csvArtifactUrl: null,
      categorized: {
        AUTHORIZED: categorized.AUTHORIZED,
        UNAUTHORIZED: categorized.UNAUTHORIZED,
        CAUSE_FOR_CONCERN: categorized.CAUSE_FOR_CONCERN,
        LATE: categorized.LATE,
        PRESENT: categorized.PRESENT,
      },
      // Caller (orchestrator) stores csv content via csvArtifactContent column
      // and renders the download URL through /api/compliance/artifact/[id].
      errorCode: null,
      errorMessage: null,
    }
  },
}

/** Exposed so the orchestrator can persist CSV bytes alongside the result. */
export function buildAdekArtifact(payload: ComplianceSubmissionPayload) {
  const { csv, categorized, absentCount, studentCount } = buildAdekCsv(payload)
  const sha = createHash("sha256").update(csv).digest("hex")
  return { csv, sha, categorized, absentCount, studentCount }
}
