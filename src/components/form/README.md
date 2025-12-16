# Form Block

Centralized form system for building consistent multi-step forms across the application.

## Directory Structure

```
src/components/form/
├── index.ts          # Main exports
├── types.ts          # TypeScript types
├── README.md         # Documentation
│
├── provider.tsx      # Multi-step form provider & hooks
├── modal.tsx         # Modal wrapper for multi-step forms
│
├── text.tsx          # Text input field
├── number.tsx        # Number input field
├── select.tsx        # Select dropdown field
├── textarea.tsx      # Textarea field
├── checkbox.tsx      # Checkbox field
├── date.tsx          # Date picker field
│
├── container.tsx     # Step container wrapper
├── header.tsx        # Step header with title/description
├── navigation.tsx    # Back/Next navigation buttons
├── progress.tsx      # Progress indicator (linear/dots/numbered)
├── success.tsx       # Success celebration component
│
├── analytics.tsx     # Form analytics hook
└── persistence.tsx   # Form persistence hook (localStorage)
```

## Core Concepts

### Multi-Step Form Provider

The `MultiStepFormProvider` manages form state across steps:

```tsx
import {
  FormStepContainer,
  FormStepHeader,
  FormStepNavigation,
  MultiStepFormProvider,
  useMultiStepForm,
} from "@/components/form"

const config = {
  steps: [
    { id: "info", title: "Personal Info", fields: ["name", "email"] },
    { id: "details", title: "Details", fields: ["bio"] },
    { id: "confirm", title: "Confirm", optional: true },
  ],
  validation: {
    info: infoSchema,
    details: detailsSchema,
  },
}

function MyForm() {
  return (
    <MultiStepFormProvider config={config} onSubmit={handleSubmit}>
      <FormContent />
    </MultiStepFormProvider>
  )
}

function FormContent() {
  const { currentStep, next, back, isFirstStep, isLastStep } =
    useMultiStepForm()

  return (
    <>
      <FormStepHeader title={steps[currentStep].title} />
      <FormStepContainer>
        {currentStep === 0 && <InfoStep />}
        {currentStep === 1 && <DetailsStep />}
        {currentStep === 2 && <ConfirmStep />}
      </FormStepContainer>
      <FormStepNavigation
        onBack={back}
        onNext={next}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
      />
    </>
  )
}
```

### Form Fields

All fields integrate with `react-hook-form`:

```tsx
import { TextField, SelectField, NumberField, DateField } from "@/components/form"

<TextField name="email" label="Email" type="email" required />
<SelectField
  name="role"
  label="Role"
  options={[
    { value: "teacher", label: "Teacher" },
    { value: "student", label: "Student" },
  ]}
/>
<NumberField name="age" label="Age" min={0} max={120} />
<DateField name="birthDate" label="Birth Date" maxDate={new Date()} />
```

## Possible Flows

### 1. SaaS Onboarding (Route-Based)

- **Path**: `/onboarding/[id]/[step]`
- **Steps**: 14 steps across 3 groups (School, Host, Listing)
- **Components**: Uses `host-footer.tsx` for navigation

### 2. Newcomers Onboarding (Modal)

- **Path**: School marketing page → "Join Us"
- **Steps**: Role → Info → Verify → Profile → Welcome
- **Components**: `NewcomersModal` with email verification

### 3. Visit Scheduling (Modal)

- **Path**: School marketing page → "Schedule Visit"
- **Steps**: Date → Time → Info → Confirm
- **Components**: `VisitModal` with timetable integration

### 4. Admission Application (Modal)

- **Path**: School marketing page → "Apply Now"
- **Steps**: Personal → Contact → Guardian → Academic → Documents → Review

### 5. Tour Booking (Modal)

- **Path**: Various entry points
- **Steps**: Similar to Visit but focused on guided tours

### 6. CRUD Forms (Inline/Modal)

- **Path**: Platform management pages
- **Examples**: Create student, Update teacher, Add announcement

## Component Reference

### Provider & Hooks

| Component                    | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `MultiStepFormProvider`      | Context provider for multi-step forms         |
| `useMultiStepForm()`         | Hook to access form state and navigation      |
| `useMultiStepFormOptional()` | Optional hook (returns null outside provider) |
| `useFormAnalytics()`         | Analytics tracking hook                       |
| `useFormPersistence()`       | localStorage persistence hook                 |

### Fields

| Component       | Props                                                         |
| --------------- | ------------------------------------------------------------- |
| `TextField`     | name, label, type, placeholder, required, disabled, maxLength |
| `NumberField`   | name, label, min, max, step, required                         |
| `SelectField`   | name, label, options, placeholder, required                   |
| `TextareaField` | name, label, rows, maxLength, required                        |
| `CheckboxField` | name, label, checkboxLabel, required                          |
| `DateField`     | name, label, minDate, maxDate, disabledDays                   |

### Layouts

| Component            | Description                        |
| -------------------- | ---------------------------------- |
| `FormStepContainer`  | Wrapper with max-width and spacing |
| `FormStepHeader`     | Step title, description, indicator |
| `FormStepNavigation` | Back/Next buttons                  |
| `FormStepProgress`   | Progress bar/dots/numbered         |
| `FormSuccess`        | Success celebration with confetti  |
| `ModalMultiStepForm` | Complete modal wrapper             |

## Configuration

### Step Configuration

```typescript
interface FormStep {
  id: string
  title: string
  description?: string
  icon?: ComponentType
  fields?: string[] // Fields to validate
  optional?: boolean // Can be skipped
}
```

### Form Configuration

```typescript
interface MultiStepFormConfig {
  steps: FormStep[]
  groups?: FormStepGroup[] // Optional grouping
  validation?: Record<string, ZodSchema>
  autoSave?: boolean
  autoSaveInterval?: number // ms, default 30000
  persistenceKey?: string // localStorage key
  analyticsFlowType?: FormFlowType
}
```

## Examples

### Modal Multi-Step Form

```tsx
import { FormStepContainer, ModalMultiStepForm } from "@/components/form"

;<ModalMultiStepForm
  config={formConfig}
  open={isOpen}
  onOpenChange={setIsOpen}
  onComplete={handleComplete}
  title="Application Form"
  showCloseConfirmation
>
  <FormStepContainer>{/* Step content */}</FormStepContainer>
</ModalMultiStepForm>
```

### With Persistence

```tsx
const persistence = useFormPersistence({
  key: "draft-form",
  autoSave: true,
  autoSaveInterval: 30000,
})

// Load draft on mount
useEffect(() => {
  const draft = persistence.load()
  if (draft) form.reset(draft)
}, [])
```

### With Analytics

```tsx
const analytics = useFormAnalytics()

useEffect(() => {
  analytics.trackStepView("visit", "date-selection")
}, [currentStep])

const handleNext = async () => {
  await next()
  analytics.trackStepComplete("visit", "date-selection")
}
```

## Best Practices

1. **Validate twice**: Client-side for UX, server-side for security
2. **Use step IDs**: Reference steps by ID, not index
3. **Handle errors**: Show step-specific error messages
4. **Track analytics**: Monitor step completion and abandonment
5. **Enable auto-save**: Prevent data loss on complex forms
6. **Show progress**: Use appropriate variant (dots for modal, linear for pages)
