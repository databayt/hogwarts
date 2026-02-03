// Visit Scheduling Module

// Main components
export { VisitModal } from "./visit-modal"

// Step components
export { DateStep } from "./steps/date-step"
export { TimeStep } from "./steps/time-step"
export { InfoStep } from "./steps/info-step"
export { ConfirmStep } from "./steps/confirm-step"

// Configuration
export {
  VISIT_CONFIG,
  VISIT_STEPS,
  VISIT_STEP_GROUPS,
  VISIT_PURPOSES,
  DEFAULT_VISIT_DURATION,
  VISIT_SLOT_DURATION,
} from "./config"
export type { VisitPurpose } from "./config"

// Validation
export {
  visitFormSchema,
  dateStepSchema,
  timeStepSchema,
  infoStepSchema,
  confirmStepSchema,
} from "./validation"
export type {
  VisitFormData,
  DateStepData,
  TimeStepData,
  InfoStepData,
} from "./validation"

// Server actions
export {
  getAvailableDates,
  getAvailableSlots,
  bookVisit,
  cancelVisit,
} from "./actions"

// Hooks
export { useAvailableDates, useAvailableSlots } from "./hooks/use-availability"
