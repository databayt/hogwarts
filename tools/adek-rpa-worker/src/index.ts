// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ApiClient } from "./api-client.js"
import { loadConfig } from "./config.js"
import { submitToEsis } from "./submit-esis.js"

const config = loadConfig()
const api = new ApiClient(config)

console.log(
  `[adek-rpa-worker] starting workerId=${config.workerId} apiBase=${config.apiBase} pollIntervalMs=${config.pollIntervalMs}`
)

async function tick() {
  try {
    const claim = await api.claim()
    if (!claim.submission) return
    const submission = claim.submission
    console.log(
      `[adek-rpa-worker] claimed submission=${submission.id} school=${submission.schoolId}`
    )

    if (!claim.credentials) {
      await api.ack({
        submissionId: submission.id,
        status: "FAILED",
        errorCode: "RPA_NO_CREDENTIALS",
        errorMessage: "No credentials returned by claim endpoint",
        csvSha256: submission.csvSha256,
      })
      return
    }

    let creds
    try {
      creds = JSON.parse(claim.credentials)
    } catch {
      await api.ack({
        submissionId: submission.id,
        status: "FAILED",
        errorCode: "RPA_BAD_CREDS_JSON",
        csvSha256: submission.csvSha256,
      })
      return
    }
    if (!creds.username || !creds.password) {
      await api.ack({
        submissionId: submission.id,
        status: "FAILED",
        errorCode: "RPA_MISSING_CRED_FIELDS",
        csvSha256: submission.csvSha256,
      })
      return
    }

    const outcome = await submitToEsis(config, submission, creds)
    await api.ack({
      submissionId: submission.id,
      status: outcome.status,
      receiptId: outcome.receiptId ?? null,
      errorCode: outcome.errorCode ?? null,
      errorMessage: outcome.errorMessage ?? null,
      csvSha256: submission.csvSha256,
    })
  } catch (error) {
    console.error("[adek-rpa-worker] tick failed:", error)
  }
}

async function loop() {
  for (;;) {
    await tick()
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs))
  }
}

loop().catch((error) => {
  console.error("[adek-rpa-worker] fatal:", error)
  process.exit(1)
})
