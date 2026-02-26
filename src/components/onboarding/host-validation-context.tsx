"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * @deprecated Use WizardValidationContext from @/components/form instead.
 *
 * This file is maintained for backward compatibility only.
 * All exports are aliases to the unified WizardValidationContext.
 *
 * @example
 * // New way (recommended)
 * import { WizardValidationProvider, useWizardValidation } from "@/components/form"
 *
 * // Old way (still works, but deprecated)
 * import { HostValidationProvider, useHostValidation } from "@/components/onboarding/host-validation-context"
 */

export {
  // Provider
  WizardValidationProvider as HostValidationProvider,
  // Hook
  useWizardValidation as useHostValidation,
  // Types (for consumers who may have imported these)
  type WizardValidationContextType as HostValidationContextType,
  type CustomNavigation,
} from "@/components/form/template/wizard-validation-context"
