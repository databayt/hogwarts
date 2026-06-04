// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ConnectorMode } from "@prisma/client"

import { db } from "@/lib/db"

import { decryptSecret } from "../../encryption"
import type {
  ComplianceConnector,
  ComplianceSubmissionPayload,
  SubmissionResult,
} from "../../types"
import { buildAdekArtifact } from "./dry-run"

/**
 * PIGGYBACK connector: submits via group-shared credentials (Aldar pattern).
 *
 * Until Aldar grants their group eSIS credentials, this connector returns
 * `FAILED` with errorCode `PIGGYBACK_NOT_CONFIGURED`. Once credentials are
 * loaded into `SharedComplianceCredentialGroup.encryptedSecret`, this routes
 * the CSV upload through eSIS using the decrypted account.
 *
 * Circuit breaker: caller (orchestrator) increments
 * `SharedComplianceCredentialGroup.recentFailures` and opens the breaker
 * after 3 failures in 1h.
 */
export const adekPiggybackConnector: ComplianceConnector = {
  id: "adek:piggyback",
  mode: ConnectorMode.PIGGYBACK,

  async isConfigured(schoolId: string): Promise<boolean> {
    const config = await db.schoolComplianceConfig.findFirst({
      where: { schoolId, provider: "ADEK_ESIS" },
      select: { sharedGroupId: true },
    })
    if (!config?.sharedGroupId) return false
    const group = await db.sharedComplianceCredentialGroup.findUnique({
      where: { id: config.sharedGroupId },
      select: {
        encryptedSecret: true,
        keyVersion: true,
        circuitBreakerState: true,
      },
    })
    if (!group) return false
    if (group.circuitBreakerState === "OPEN") return false
    return Boolean(group.encryptedSecret)
  },

  async submit(
    payload: ComplianceSubmissionPayload
  ): Promise<SubmissionResult> {
    // Build the artifact regardless of upload — used for audit even on failure.
    const { csv, sha, categorized } = buildAdekArtifact(payload)

    const config = await db.schoolComplianceConfig.findFirst({
      where: { schoolId: payload.schoolId, provider: "ADEK_ESIS" },
      select: { sharedGroupId: true },
    })
    if (!config?.sharedGroupId) {
      return {
        status: "FAILED",
        errorCode: "PIGGYBACK_NOT_CONFIGURED",
        errorMessage: "No shared credential group linked",
        csvArtifactSha256: sha,
        categorized,
      }
    }
    const group = await db.sharedComplianceCredentialGroup.findUnique({
      where: { id: config.sharedGroupId },
    })
    if (!group) {
      return {
        status: "FAILED",
        errorCode: "PIGGYBACK_GROUP_NOT_FOUND",
        csvArtifactSha256: sha,
        categorized,
      }
    }
    if (group.circuitBreakerState === "OPEN") {
      return {
        status: "FAILED",
        errorCode: "CIRCUIT_BREAKER_OPEN",
        csvArtifactSha256: sha,
        categorized,
      }
    }

    let _credentials: unknown
    try {
      _credentials = JSON.parse(
        decryptSecret(group.encryptedSecret, group.keyVersion)
      )
    } catch (error) {
      return {
        status: "FAILED",
        errorCode: "PIGGYBACK_CRED_DECRYPT_FAILED",
        errorMessage: error instanceof Error ? error.message : String(error),
        csvArtifactSha256: sha,
        categorized,
      }
    }

    // TODO: once Aldar provides the eSIS API/upload contract, perform the
    // actual HTTP upload using `_credentials` here. For now, fail closed.
    void _credentials
    void csv

    return {
      status: "FAILED",
      errorCode: "PIGGYBACK_UPLOAD_NOT_IMPLEMENTED",
      errorMessage: "Awaiting Aldar piggyback contract — see plan Phase 3",
      csvArtifactSha256: sha,
      categorized,
    }
  },
}
