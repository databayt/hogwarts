// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Wizard Config Types
 *
 * Generic configuration type for all URL-routed multi-step wizards.
 * Used by school onboarding, application, internal onboarding, and entity CRUD wizards.
 */

/** Configuration for a URL-routed multi-step wizard */
export interface WizardConfig {
  /** Unique wizard identifier (e.g., "teacher", "onboarding", "application") */
  id: string
  /** Ordered step slugs matching URL path segments */
  steps: string[]
  /** Group steps into phases for the progress bar */
  groups: Record<number, string[]>
  /** Labels for each progress group (default/fallback language) */
  groupLabels?: string[]
  /** Localized group labels keyed by language code (e.g., { ar: [...], en: [...] }) */
  i18nGroupLabels?: Record<string, string[]>
  /** Steps that must be completed before finishing */
  requiredSteps?: string[]
  /** Allow skipping ahead after all required steps are done */
  skipToComplete?: boolean
  /** Step slug to jump to when skip is clicked (default: jumps past next group) */
  skipToStep?: string
  /** Button label for the final step (default: "Finish") */
  finalLabel?: string
  /** Localized final button label keyed by language code (e.g., { ar: "...", en: "..." }) */
  i18nFinalLabel?: Record<string, string>
  /** Redirect URL after completing the final step */
  finalDestination?: string
}

/**
 * Resolve localized group labels from a WizardConfig.
 * Falls back to groupLabels if i18nGroupLabels doesn't have the requested locale.
 */
export function resolveGroupLabels(
  config: WizardConfig,
  locale: string
): string[] | undefined {
  return config.i18nGroupLabels?.[locale] ?? config.groupLabels
}

/**
 * Resolve localized final label from a WizardConfig.
 * Falls back to finalLabel if i18nFinalLabel doesn't have the requested locale.
 */
export function resolveFinalLabel(
  config: WizardConfig,
  locale: string
): string | undefined {
  return config.i18nFinalLabel?.[locale] ?? config.finalLabel
}

/** Metadata for a single wizard step */
export interface WizardStepMeta {
  /** Step slug (matches URL segment) */
  step: string
  /** Display title */
  title: string
  /** Display description */
  description?: string
  /** Whether this step is required for completion */
  isRequired?: boolean
  /** Step order (1-based) */
  order: number
  /** Step group name */
  group?: string
}

/** Common ref interface for wizard step forms */
export interface WizardFormRef {
  saveAndNext: () => Promise<void>
}
