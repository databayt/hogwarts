// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WorkerConfig } from "./config.js"

export interface ClaimedSubmission {
  id: string
  schoolId: string
  provider: string
  submissionDate: string // ISO
  leaseExpiresAt: string // ISO
  csv: string
  csvSha256: string
  categorized: Record<string, number>
}

export interface ClaimResponse {
  submission: ClaimedSubmission | null
  credentials: string | null // JSON-encoded
}

export interface AckBody {
  submissionId: string
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED" | "FAILED"
  receiptId?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  csvSha256?: string | null
}

export class ApiClient {
  constructor(private config: WorkerConfig) {}

  async claim(): Promise<ClaimResponse> {
    const response = await fetch(
      `${this.config.apiBase}/api/compliance/worker/claim`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.apiToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ workerId: this.config.workerId }),
      }
    )
    if (!response.ok) {
      throw new Error(`Claim failed: ${response.status} ${response.statusText}`)
    }
    return (await response.json()) as ClaimResponse
  }

  async ack(body: AckBody): Promise<void> {
    const response = await fetch(
      `${this.config.apiBase}/api/compliance/worker/ack`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.apiToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )
    if (!response.ok) {
      throw new Error(`Ack failed: ${response.status} ${response.statusText}`)
    }
  }
}
