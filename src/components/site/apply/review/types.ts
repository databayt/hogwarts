// Review Step Types

export interface ReviewFormRef {
  submitApplication: () => Promise<void>
}

export interface ReviewFormProps {
  sessionToken?: string
  dictionary?: Record<string, unknown>
  onSuccess?: (applicationNumber: string) => void
}

export interface SubmissionResult {
  success: boolean
  applicationNumber?: string
  accessToken?: string
  error?: string
}
