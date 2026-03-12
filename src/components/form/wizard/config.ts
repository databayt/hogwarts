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
  /** Labels for each progress group */
  groupLabels?: string[]
  /** Steps that must be completed before finishing */
  requiredSteps?: string[]
  /** Button label for the final step (default: "Finish") */
  finalLabel?: string
  /** Redirect URL after completing the final step */
  finalDestination?: string
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
