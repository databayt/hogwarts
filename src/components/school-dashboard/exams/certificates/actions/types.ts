export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: string; details?: unknown }

export interface GenerateCertificateInput {
  examResultId: string
  configId: string
}

export interface GenerateCertificateOutput {
  certificateId: string
  certificateNumber: string
  verificationCode: string
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
  certificates: Array<{
    studentId: string
    studentName: string
    certificateNumber: string
  }>
}

export interface ShareCertificateOutput {
  shareToken: string
  shareUrl: string
  shareExpiry: Date
}

export interface VerifyCertificateOutput {
  status: string
  recipientName: string
  examTitle: string
  examDate: Date
  score: number
  grade: string | null
  issuedAt: Date
  schoolName: string
}

export interface CertificateConfigSummary {
  id: string
  name: string
  type: string
  templateStyle: string
  isActive: boolean
  certificateCount: number
  createdAt: Date
}
