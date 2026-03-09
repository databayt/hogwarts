// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  CertBodyVariant,
  CertFooterVariant,
  CertHeaderVariant,
  CertificateCompositionConfig,
  CertRecipientVariant,
  CertScoresVariant,
  CertSignaturesVariant,
  CertTitleVariant,
} from "@/components/school-dashboard/grades/templates/composition/types"

export interface CertStepDefinition {
  id: string
  label: { en: string; ar: string }
  isComplete: (state: CertWizardState) => boolean
}

export interface CertDecorationConfig {
  border: {
    enabled: boolean
    style?: "gold" | "silver" | "blue" | "custom"
    width?: number
  }
  cornerOrnaments: { enabled: boolean }
  seal: {
    enabled: boolean
    position?: "bottom-right" | "center" | "background"
  }
  watermark: { enabled: boolean; text?: string; opacity?: number }
  ribbon: { enabled: boolean; text?: string }
}

export interface SignatureEntry {
  name: string
  title: string
  signatureUrl?: string
}

export interface CertWizardState {
  // Step 1: Gallery
  selectedPresetId: string | null

  // Step 2: Info
  name: string
  description: string
  certificateType: CertificateType
  themeStyle: "elegant" | "modern" | "classic"
  titleText: string
  titleTextAr: string
  bodyTemplate: string
  bodyTemplateAr: string
  minPercentage: number | null
  minGrade: string
  topPercentile: number | null
  signatures: SignatureEntry[]
  useSchoolLogo: boolean
  enableVerification: boolean
  verificationPrefix: string

  // 7 slot variants
  headerVariant: CertHeaderVariant
  titleVariant: CertTitleVariant
  recipientVariant: CertRecipientVariant
  bodyVariant: CertBodyVariant
  scoresVariant: CertScoresVariant
  signaturesVariant: CertSignaturesVariant
  footerVariant: CertFooterVariant

  // Decorations
  decorations: CertDecorationConfig

  // Print
  pageSize: "A4" | "LETTER"
  orientation: "portrait" | "landscape"

  // Navigation
  currentStep: number

  // Edit mode
  existingConfigId: string | null
}

export type CertificateType =
  | "ACHIEVEMENT"
  | "COMPLETION"
  | "PARTICIPATION"
  | "MERIT"
  | "EXCELLENCE"
  | "CUSTOM"

export type CertWizardAction =
  | { type: "SET_INFO"; payload: Partial<CertWizardState> }
  | { type: "SET_PRESET"; payload: string | null }
  | {
      type: "APPLY_PRESET"
      payload: {
        slots: Partial<CertificateCompositionConfig["slots"]>
        decorations: CertDecorationConfig
      }
    }
  | { type: "SET_HEADER_VARIANT"; payload: CertHeaderVariant }
  | { type: "SET_TITLE_VARIANT"; payload: CertTitleVariant }
  | { type: "SET_RECIPIENT_VARIANT"; payload: CertRecipientVariant }
  | { type: "SET_BODY_VARIANT"; payload: CertBodyVariant }
  | { type: "SET_SCORES_VARIANT"; payload: CertScoresVariant }
  | { type: "SET_SIGNATURES_VARIANT"; payload: CertSignaturesVariant }
  | { type: "SET_FOOTER_VARIANT"; payload: CertFooterVariant }
  | { type: "SET_DECORATIONS"; payload: CertDecorationConfig }
  | {
      type: "SET_PRINT_CONFIG"
      payload: Partial<Pick<CertWizardState, "pageSize" | "orientation">>
    }
  | { type: "SET_SIGNATURES_DATA"; payload: SignatureEntry[] }
  | { type: "SET_STEP"; payload: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "LOAD_STATE"; payload: CertWizardState }

export const DEFAULT_CERT_DECORATIONS: CertDecorationConfig = {
  border: { enabled: true, style: "gold", width: 2 },
  cornerOrnaments: { enabled: true },
  seal: { enabled: false },
  watermark: { enabled: false },
  ribbon: { enabled: false },
}

export const CERT_INITIAL_STATE: CertWizardState = {
  selectedPresetId: null,
  name: "",
  description: "",
  certificateType: "ACHIEVEMENT",
  themeStyle: "elegant",
  titleText: "Certificate of Achievement",
  titleTextAr: "شهادة تقدير",
  bodyTemplate:
    "This is to certify that {{studentName}} has successfully achieved {{grade}} in {{subject}}.",
  bodyTemplateAr:
    "نشهد بأن الطالب/ة {{studentName}} قد حقق/ت {{grade}} في مادة {{subject}}.",
  minPercentage: null,
  minGrade: "",
  topPercentile: null,
  signatures: [],
  useSchoolLogo: true,
  enableVerification: true,
  verificationPrefix: "CERT-",
  headerVariant: "crest",
  titleVariant: "elegant",
  recipientVariant: "centered",
  bodyVariant: "achievement",
  scoresVariant: "badge-row",
  signaturesVariant: "dual",
  footerVariant: "verification",
  decorations: DEFAULT_CERT_DECORATIONS,
  pageSize: "A4",
  orientation: "landscape",
  currentStep: 0,
  existingConfigId: null,
}

/** Map slot names to their corresponding action type for generic dispatch */
export const CERT_SLOT_ACTION_MAP: Record<string, CertWizardAction["type"]> = {
  header: "SET_HEADER_VARIANT",
  title: "SET_TITLE_VARIANT",
  recipient: "SET_RECIPIENT_VARIANT",
  body: "SET_BODY_VARIANT",
  scores: "SET_SCORES_VARIANT",
  signatures: "SET_SIGNATURES_VARIANT",
  footer: "SET_FOOTER_VARIANT",
}
