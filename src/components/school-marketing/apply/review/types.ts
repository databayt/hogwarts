// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Review Step Types

import type { SubmitActionResult } from "./actions"

export interface ReviewFormRef {
  submitApplication: () => Promise<void>
}

export interface ReviewFormProps {
  sessionToken?: string
  dictionary?: Record<string, unknown>
  onSuccess?: (result: SubmitActionResult) => void
}

export interface SubmissionResult {
  success: boolean
  applicationNumber?: string
  accessToken?: string
  error?: string
}
