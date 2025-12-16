/**
 * Form Block
 *
 * Centralized form system for building consistent forms across the application.
 * Supports single-step forms, multi-step wizards, and modal forms.
 *
 * @example
 * // Multi-step form
 * import { MultiStepFormProvider, useMultiStepForm } from "@/components/form"
 *
 * // Form fields
 * import { TextField, SelectField } from "@/components/form"
 *
 * // Layouts
 * import { FormStepContainer, FormStepHeader } from "@/components/form"
 */

// Types
export * from "./types"

// Multi-step form
export {
  MultiStepFormProvider,
  useMultiStepForm,
  useMultiStepFormOptional,
} from "./provider"

// Hooks
export { useFormAnalytics, useFormPersistence } from "./use-form"

// Fields
export { TextField } from "./text"
export { NumberField } from "./number"
export { SelectField } from "./select"
export { TextareaField } from "./textarea"
export { CheckboxField } from "./checkbox"
export { DateField } from "./date"

// Layouts
export { FormStepContainer } from "./container"
export { FormStepHeader } from "./header"
export { FormStepNavigation } from "./navigation"
export { FormStepProgress } from "./progress"
export { FormSuccess } from "./success"

// Modal integration
export { ModalMultiStepForm } from "./modal"
