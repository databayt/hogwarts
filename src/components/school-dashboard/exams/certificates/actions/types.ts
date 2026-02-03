/**
 * Certificate Types
 * STUB: Certificate features temporarily disabled
 */

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface GenerateCertificateInput {
  examResultId: string
  configId: string
}

export interface GenerateCertificateOutput {
  certificateId: string
  certificateNumber: string
}

export interface BatchGenerateCertificatesInput {
  examId: string
  configId: string
  minPassScore?: number
}

export interface BatchGenerateCertificatesOutput {
  generated: number
  skipped: number
  failed: number
}

export interface CertificateConfig {
  id: string
  name: string
  type: string
  schoolId: string
}
