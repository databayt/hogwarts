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
 * import { ApplyValidationProvider, useApplyValidation } from "@/components/school-marketing/apply/validation-context"
 */

export {
  // Provider
  WizardValidationProvider as ApplyValidationProvider,
  // Hook
  useWizardValidation as useApplyValidation,
  // Types (for consumers who may have imported these)
  type WizardValidationContextType as ApplyValidationContextType,
  type CustomNavigation,
} from "@/components/form/template/wizard-validation-context"
