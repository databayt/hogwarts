// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Composition Types — variant-based template composition
 * Schools pick variants per slot via a Compose tab. A single ComposableDocument
 * reads the composition config and renders the chosen variants dynamically.
 */

/** Which variant to use for each section slot */
export interface CompositionConfig {
  slots: {
    header: HeaderVariant
    footer: FooterVariant
    studentInfo: StudentInfoVariant
    instructions: InstructionsVariant
    answerSheet: AnswerSheetVariant
    cover: CoverVariant
  }
  decorations: {
    accentBar: {
      enabled: boolean
      height?: number
      colorKey?: "accent" | "primary"
    }
    watermark: { enabled: boolean; text?: string; opacity?: number }
    frame: { enabled: boolean; outerWidth?: number; innerWidth?: number }
  }
  slotProps: {
    header?: {
      logoSize?: number
      ministryName?: string
      ministryLogoUrl?: string
    }
    footer?: { disclaimerText?: string; gradingScale?: string }
    studentInfo?: {
      showSeatNumber?: boolean
      idDigits?: number
      photoSize?: number
    }
    instructions?: { wrapWithAccentBorder?: boolean }
  }
}

export type SlotName = keyof CompositionConfig["slots"]

export type HeaderVariant =
  | "standard"
  | "ministry"
  | "minimal"
  | "bilingual"
  | "centered"
export type FooterVariant = "standard" | "disclaimer" | "minimal" | "grading"
export type StudentInfoVariant = "standard" | "bubble-id" | "table" | "photo"
export type InstructionsVariant = "standard" | "compact" | "rules" | "sectioned"
export type AnswerSheetVariant = "standard" | "omr" | "grid"
export type CoverVariant = "standard" | "toc" | "ministry"

/** Metadata for a variant entry in the registry */
export interface VariantEntry<P = Record<string, unknown>> {
  component: React.ComponentType<P>
  label: { en: string; ar: string }
  description: { en: string; ar: string }
}
