// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ConnectorMode } from "@prisma/client"

import type {
  ComplianceConnector,
  ComplianceSubmissionPayload,
  SubmissionResult,
} from "../../types"
import { buildAdekArtifact } from "./dry-run"

/**
 * OFFICIAL_API connector — placeholder until ADEK publishes a developer contract.
 *
 * When ADEK responds to the integration inquiry, implement HTTP submission
 * here using per-school credentials from `SchoolComplianceCredential` +
 * `encryption.ts`. Async receipts flow through `/api/webhooks/adek/route.ts`.
 */
export const adekOfficialConnector: ComplianceConnector = {
  id: "adek:official-api",
  mode: ConnectorMode.OFFICIAL_API,

  async isConfigured(): Promise<boolean> {
    return false // Always false until the contract lands
  },

  async submit(
    payload: ComplianceSubmissionPayload
  ): Promise<SubmissionResult> {
    const { sha, categorized } = buildAdekArtifact(payload)
    return {
      status: "FAILED",
      errorCode: "OFFICIAL_API_NOT_AVAILABLE",
      errorMessage: "ADEK developer access not yet granted — see plan Phase 5",
      csvArtifactSha256: sha,
      categorized,
    }
  },
}
