/**
 * Form Templates
 *
 * Composed form components including:
 * - Composed fields (molecules): Password with strength, phone with country code
 * - Form structures (organisms): Multi-step provider, modal, layout components
 *
 * @example
 * ```tsx
 * import {
 *   MultiStepFormProvider,
 *   FormStepContainer,
 *   FormStepNavigation,
 * } from "@/components/form/template"
 * ```
 */

// =============================================================================
// COMPOSED FIELDS (Molecules)
// =============================================================================

export { FieldArray } from "./field-array"
export { PasswordField } from "./password-field"
export { PhoneField } from "./phone-field"

// =============================================================================
// FORM STRUCTURES (Organisms)
// =============================================================================

// Provider & Modal
export {
  MultiStepFormProvider,
  useMultiStepForm,
  useMultiStepFormOptional,
} from "./provider"
export { ModalMultiStepForm } from "./modal"

// Layout Components
export { FormStepContainer } from "./container"
export { FormStepHeader } from "./header"
export { FormStepNavigation } from "./navigation"
export { FormStepProgress } from "./progress"
export { FormSuccess } from "./success"
export { FormLayout } from "./layout"
export { FormHeading } from "./heading"

// Wizard Validation Context
export {
  WizardValidationProvider,
  useWizardValidation,
  useWizardValidationOptional,
  // Backward compatibility aliases
  HostValidationProvider,
  useHostValidation,
  ApplyValidationProvider,
  useApplyValidation,
  type WizardFlowType,
  type WizardValidationContextType,
  type CustomNavigation,
} from "./wizard-validation-context"
