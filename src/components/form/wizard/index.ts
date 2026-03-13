// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Wizard Block
 *
 * Generic, reusable infrastructure for URL-routed multi-step wizards.
 * Used by school onboarding, application, internal onboarding,
 * and all entity CRUD wizards (teacher, student, event, etc.).
 *
 * @example
 * ```ts
 * import {
 *   type WizardConfig,
 *   type WizardFormRef,
 *   createWizardProvider,
 *   WizardLayout,
 *   WizardStep,
 * } from "@/components/form/wizard"
 * ```
 */

// Config types
export {
  type WizardConfig,
  type WizardStepMeta,
  type WizardFormRef,
} from "./config"

// Provider factory
export { createWizardProvider } from "./wizard-provider"

// Layout
export { WizardLayout } from "./wizard-layout"

// Step wrapper
export { WizardStep } from "./wizard-step"

// Tabs
export { WizardTabs, type WizardTab } from "./wizard-tabs"
