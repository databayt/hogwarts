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
