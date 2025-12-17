/**
 * Form Block
 *
 * Centralized form system for building consistent forms across the application.
 * Supports single-step forms, multi-step wizards, and modal forms.
 *
 * ## Architecture
 *
 * - **atoms/**: Single-purpose field components (InputField, SelectField, etc.)
 * - **template/**: Composed components (Provider, Modal, Navigation, etc.)
 * - **actions.ts**: Generic server action helpers for CRUD operations
 * - **use-form.ts**: Central hooks file (analytics, persistence, React 19 bridge)
 *
 * @example
 * // Multi-step form
 * import { MultiStepFormProvider, useMultiStepForm } from "@/components/form"
 *
 * // Form fields (atoms)
 * import { InputField, SelectField, DateField } from "@/components/form"
 *
 * // Layouts (template)
 * import { FormStepContainer, FormStepHeader } from "@/components/form"
 *
 * // Server actions
 * import { createFormAction, ActionResponse } from "@/components/form"
 *
 * // Hooks
 * import { useFormAnalytics, useActionStateBridge } from "@/components/form"
 */

// =============================================================================
// TYPES
// =============================================================================

export * from "./types"

// =============================================================================
// SERVER ACTIONS
// =============================================================================

export {
  createFormAction,
  createGenericAction,
  updateGenericAction,
  deleteGenericAction,
  findGenericAction,
  mapZodErrors,
  createRevalidator,
  initialActionState,
  type ActionResponse,
} from "./actions"

// =============================================================================
// HOOKS
// =============================================================================

export {
  // Analytics
  useFormAnalytics,
  // Persistence
  useFormPersistence,
  // React 19 integration
  useActionStateBridge,
  useFormSubmitStatus,
  // Multi-step form (re-exported for convenience)
  useMultiStepForm,
  useMultiStepFormOptional,
} from "./use-form"

// =============================================================================
// ATOMS (Field Components)
// =============================================================================

// Core fields
export { InputField, TextField } from "./atoms/input"
export { NumberField } from "./atoms/number"
export { SelectField } from "./atoms/select"
export { TextareaField } from "./atoms/textarea"
export { CheckboxField } from "./atoms/checkbox"
export { DateField } from "./atoms/date"

// Extended fields
export { SwitchField } from "./atoms/switch"
export { RadioGroupField } from "./atoms/radio-group"
export { ComboboxField } from "./atoms/combobox"

// =============================================================================
// TEMPLATE (Composed Components)
// =============================================================================

// Composed fields (molecules)
export { FieldArray } from "./template/field-array"
export { PasswordField } from "./template/password-field"
export { PhoneField } from "./template/phone-field"

// Multi-step form provider
export { MultiStepFormProvider } from "./template/provider"

// Modal integration
export { ModalMultiStepForm } from "./template/modal"

// Layout components
export { FormStepContainer } from "./template/container"
export { FormStepHeader } from "./template/header"
export { FormStepNavigation } from "./template/navigation"
export { FormStepProgress } from "./template/progress"
export { FormSuccess } from "./template/success"
export { FormLayout } from "./template/layout"
export { FormHeading } from "./template/heading"
