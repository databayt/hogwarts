// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"

/** Theme for certificate PDFs */
export interface CertPaperTheme {
  colors: {
    primary: string
    accent: string
    gold: string
    text: string
    textLight: string
    background: string
    border: string
  }
  typography: {
    fontFamily: string
    titleSize: number
    subtitleSize: number
    bodySize: number
    smallSize: number
  }
  spacing: {
    page: number
    section: number
    element: number
  }
  locale: Locale
  isRTL: boolean
}

/** Data passed to certificate template */
export interface CertificateForPaper {
  studentName: string
  studentNameAr?: string
  studentId?: string
  className?: string
  photoUrl?: string

  title: string // "Certificate of Achievement" etc.
  titleAr?: string
  bodyText?: string // Template with {{placeholders}} resolved
  bodyTextAr?: string

  subject?: string
  subjectAr?: string
  examTitle?: string
  examDate?: string

  score?: number
  maxScore?: number
  percentage?: number
  grade?: string
  rank?: number
  totalStudents?: number

  schoolName: string
  schoolNameAr?: string
  schoolLogo?: string

  certificateNumber?: string
  verificationCode?: string
  verificationUrl?: string
  issuedDate: string

  signatures: Array<{
    name: string
    title: string
    signatureUrl?: string
  }>
}

/** Section props passed to each slot component */
export interface CertHeaderProps {
  data: CertificateForPaper
  theme: CertPaperTheme
  logoSize?: number
  ministryName?: string
  ministryLogoUrl?: string
}

export interface CertTitleProps {
  data: CertificateForPaper
  theme: CertPaperTheme
}

export interface CertRecipientProps {
  data: CertificateForPaper
  theme: CertPaperTheme
}

export interface CertBodyProps {
  data: CertificateForPaper
  theme: CertPaperTheme
}

export interface CertScoresProps {
  data: CertificateForPaper
  theme: CertPaperTheme
}

export interface CertSignaturesProps {
  data: CertificateForPaper
  theme: CertPaperTheme
}

export interface CertFooterProps {
  data: CertificateForPaper
  theme: CertPaperTheme
}
