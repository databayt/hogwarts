// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/** Certificate composition config — variant-based template composition */

export interface CertificateCompositionConfig {
  slots: {
    header: CertHeaderVariant
    title: CertTitleVariant
    recipient: CertRecipientVariant
    body: CertBodyVariant
    scores: CertScoresVariant
    signatures: CertSignaturesVariant
    footer: CertFooterVariant
  }
  decorations: {
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
  slotProps: {
    header?: {
      logoSize?: number
      ministryName?: string
      ministryLogoUrl?: string
    }
    title?: Record<string, unknown>
    recipient?: Record<string, unknown>
    body?: { customTemplate?: string }
    scores?: Record<string, unknown>
    signatures?: Record<string, unknown>
    footer?: Record<string, unknown>
  }
}

export type CertSlotName = keyof CertificateCompositionConfig["slots"]

export type CertHeaderVariant = "crest" | "ministry" | "bilingual" | "minimal"
export type CertTitleVariant =
  | "elegant"
  | "modern"
  | "classic"
  | "arabic-calligraphy"
export type CertRecipientVariant = "centered" | "underline" | "framed" | "photo"
export type CertBodyVariant =
  | "achievement"
  | "report-summary"
  | "transcript"
  | "custom"
export type CertScoresVariant = "badge-row" | "table-grid" | "gauge" | "hidden"
export type CertSignaturesVariant = "dual" | "triple" | "single" | "stamps"
export type CertFooterVariant =
  | "verification"
  | "minimal"
  | "dated"
  | "numbered"

/** Metadata for a variant entry in the registry */
export interface CertVariantEntry<P = Record<string, unknown>> {
  component: React.ComponentType<P>
  label: { en: string; ar: string }
  description: { en: string; ar: string }
}
