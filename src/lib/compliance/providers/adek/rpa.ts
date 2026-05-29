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
 * RPA connector — leaves the submission in `QUEUED` status for the external
 * Playwright worker at `tools/adek-rpa-worker/` to claim. The worker calls
 * `POST /api/compliance/worker/claim` (authed via SchoolApiToken with scope
 * `compliance.rpa_claim`), executes the browser session against
 * esis.adek.gov.ae, then posts back via `POST /api/compliance/worker/ack`.
 */
export const adekRpaConnector: ComplianceConnector = {
  id: "adek:rpa",
  mode: ConnectorMode.RPA,

  async isConfigured(): Promise<boolean> {
    // We don't gate this on worker presence; the orchestrator queues and the
    // worker either claims or doesn't. Admin sees `QUEUED` lingering as the
    // signal that the worker is down.
    return true
  },

  async submit(
    payload: ComplianceSubmissionPayload
  ): Promise<SubmissionResult> {
    const { sha, categorized } = buildAdekArtifact(payload)
    // Mark as QUEUED — actual upload happens out-of-band via the worker.
    return {
      status: "QUEUED",
      csvArtifactSha256: sha,
      categorized,
    }
  },
}
