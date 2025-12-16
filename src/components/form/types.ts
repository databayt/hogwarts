import type { ZodSchema } from "zod"

/**
 * Form Block Types
 *
 * Centralized type definitions for the unified form system.
 * Supports single-step forms, multi-step wizards, and modal forms.
 */

// =============================================================================
// STEP CONFIGURATION
// =============================================================================

/** Individual step in a multi-step form */
export interface FormStep {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  fields?: string[] // Field names validated in this step
  optional?: boolean // Optional steps can be skipped
}

/** Group of steps for progress visualization */
export interface FormStepGroup {
  id: string
  label: string
  steps: string[] // Step IDs in this group
}

// =============================================================================
// FORM CONFIGURATION
// =============================================================================

/** Configuration for multi-step forms */
export interface MultiStepFormConfig {
  steps: FormStep[]
  groups?: FormStepGroup[] // Optional grouping for complex flows
  validation?: Record<string, ZodSchema> // Per-step validation schemas
  autoSave?: boolean // Enable auto-save to localStorage
  autoSaveInterval?: number // ms, default 30000
  persistenceKey?: string // localStorage key for draft
  analyticsFlowType?: FormFlowType // For analytics tracking
}

/** Configuration for single-step forms */
export interface SingleFormConfig {
  validation?: ZodSchema
  persistenceKey?: string
}

// =============================================================================
// FORM STATE
// =============================================================================

/** Internal state for multi-step forms */
export interface MultiStepFormState {
  currentStep: number
  completedSteps: Set<string>
  formData: Record<string, unknown>
  isDirty: boolean
  isSubmitting: boolean
  errors: Record<string, string[]>
}

// =============================================================================
// CONTEXT VALUES
// =============================================================================

/** Context value for multi-step forms */
export interface MultiStepFormContextValue {
  // Configuration
  config: MultiStepFormConfig

  // State
  currentStep: number
  currentStepConfig: FormStep
  totalSteps: number
  progress: number // 0-100
  isFirstStep: boolean
  isLastStep: boolean
  completedSteps: string[]
  isDirty: boolean
  isSubmitting: boolean
  errors: Record<string, string[]>

  // Navigation
  next: () => Promise<boolean> // Returns validation success
  back: () => void
  goTo: (stepId: string) => boolean // Returns if navigation allowed
  canNavigateTo: (stepId: string) => boolean

  // Validation
  validateCurrentStep: () => Promise<boolean>
  isStepValid: (stepId: string) => boolean
  setStepError: (stepId: string, errors: string[]) => void
  clearStepError: (stepId: string) => void

  // Form data
  getStepData: <T>(stepId: string) => T | undefined
  setStepData: (stepId: string, data: unknown) => void
  getAllData: () => Record<string, unknown>

  // Lifecycle
  reset: () => void
  submit: () => Promise<void>
  saveDraft: () => Promise<void>
  loadDraft: () => Promise<boolean>
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/** Provider props for multi-step forms */
export interface MultiStepFormProviderProps {
  config: MultiStepFormConfig
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onStepChange?: (stepId: string, direction: "next" | "back") => void
  onError?: (stepId: string, errors: string[]) => void
  initialData?: Record<string, unknown>
  children: React.ReactNode
}

/** Props for individual step components */
export interface FormStepProps {
  stepId: string
  isActive: boolean
  isCompleted: boolean
  data: Record<string, unknown>
  errors: string[]
  onDataChange: (data: Record<string, unknown>) => void
  onValidationChange: (isValid: boolean) => void
}

/** Step header props */
export interface FormStepHeaderProps {
  stepNumber?: number
  totalSteps?: number
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  showStepIndicator?: boolean
  className?: string
}

/** Step navigation props */
export interface FormStepNavigationProps {
  onBack?: () => void
  onNext?: () => Promise<void> | void
  isFirstStep?: boolean
  isLastStep?: boolean
  isLoading?: boolean
  isNextDisabled?: boolean
  backLabel?: string
  nextLabel?: string
  submitLabel?: string
  className?: string
}

/** Step progress props */
export interface FormStepProgressProps {
  current: number
  total: number
  groups?: FormStepGroup[]
  completedSteps?: string[]
  currentStepId?: string
  variant?: "linear" | "grouped" | "dots" | "numbered"
  showLabels?: boolean
  className?: string
}

/** Success celebration props */
export interface FormSuccessProps {
  title: string
  description?: string
  onComplete?: () => void
  showConfetti?: boolean
  confettiColors?: string[]
  nextSteps?: FormNextStep[]
  className?: string
}

export interface FormNextStep {
  label: string
  description?: string
  href?: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

/** Step container props */
export interface FormStepContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

/** Split layout props - two-column responsive layout */
export interface SplitLayoutProps {
  children: React.ReactNode
  className?: string
  split?: "50/50" | "30/70"
  gap?: "sm" | "md" | "lg"
  align?: "start" | "center" | "end"
}

/** Heading props - title + description with RTL support */
export interface FormHeadingProps {
  title: string
  description?: string
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

// =============================================================================
// FIELD TYPES
// =============================================================================

/** Base field props */
export interface BaseFieldProps {
  name: string
  label?: string
  description?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

/** Text field props */
export interface TextFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "password" | "tel" | "url"
  maxLength?: number
  minLength?: number
}

/** Number field props */
export interface NumberFieldProps extends BaseFieldProps {
  min?: number
  max?: number
  step?: number
}

/** Select field props */
export interface SelectFieldProps extends BaseFieldProps {
  options: Array<{
    value: string
    label: string
    description?: string
    disabled?: boolean
  }>
}

/** Textarea field props */
export interface TextareaFieldProps extends BaseFieldProps {
  rows?: number
  maxLength?: number
}

/** Checkbox field props */
export interface CheckboxFieldProps extends BaseFieldProps {
  checkboxLabel?: string
}

/** Date field props */
export interface DateFieldProps extends BaseFieldProps {
  minDate?: Date
  maxDate?: Date
  disabledDays?: (date: Date) => boolean
}

// =============================================================================
// LAYOUT TYPES
// =============================================================================

/** Form layout variant */
export type FormLayoutVariant = "default" | "card" | "modal" | "inline"

/** Form layout props */
export interface FormLayoutProps {
  variant?: FormLayoutVariant
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

/** Modal form layout props */
export interface ModalFormLayoutProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

// =============================================================================
// ANALYTICS
// =============================================================================

/** Flow type for analytics tracking */
export type FormFlowType = "saas" | "newcomers" | "visit" | "admission" | "crud"

/** Analytics event */
export interface FormAnalyticsEvent {
  flowType: FormFlowType
  stepId: string
  stepIndex: number
  action: "view" | "complete" | "skip" | "error" | "abandon"
  duration?: number // Time spent on step (ms)
  errorType?: string
  metadata?: Record<string, unknown>
}

/** Analytics tracking interface */
export interface FormAnalytics {
  trackStepView: (flowType: FormFlowType, stepId: string) => void
  trackStepComplete: (
    flowType: FormFlowType,
    stepId: string,
    duration?: number
  ) => void
  trackStepError: (
    flowType: FormFlowType,
    stepId: string,
    errorType: string
  ) => void
  trackFlowComplete: (
    flowType: FormFlowType,
    data?: Record<string, unknown>
  ) => void
  trackFlowAbandonment: (flowType: FormFlowType, lastStepId: string) => void
}

// =============================================================================
// MODAL INTEGRATION
// =============================================================================

/** Modal multi-step form props */
export interface ModalMultiStepFormProps {
  config: MultiStepFormConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (data: Record<string, unknown>) => Promise<void>
  title?: string
  description?: string
  showCloseConfirmation?: boolean
  closeConfirmationMessage?: string
  children: React.ReactNode
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Form submission result */
export interface FormSubmitResult {
  success: boolean
  error?: string
  data?: unknown
}

/** Form validation result */
export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
}
