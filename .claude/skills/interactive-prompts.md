# Interactive Prompts Skill

**Purpose**: Reusable patterns for implementing interactive, flowchart-driven workflows with validation gates and user guidance.

**Used By**: `/ui-interactive`, `/ui-wizard`, and any command requiring step-by-step user interaction

---

## Core Concept

This skill provides patterns for creating **interactive wizards** that:
1. Guide users step-by-step through complex processes
2. Validate input at each step before proceeding
3. Block progression on critical validation failures
4. Provide contextual help and suggestions
5. Support conditional branching based on user choices
6. Enable back/forward navigation through steps

---

## Workflow Engine Pattern

### Loading Flowchart Configuration

```markdown
When implementing an interactive workflow:

1. Load configuration from `.claude/workflows/{workflow-name}.json`
2. Parse workflow steps and validation rules
3. Initialize state object to track progress
4. Begin execution at first step
```

### State Management

```typescript
interface WorkflowState {
  currentStep: string
  history: string[]  // Step IDs visited
  data: Record<string, any>  // User inputs collected
  validationResults: Record<string, ValidationResult>
  metadata: {
    startTime: Date
    estimatedCompletion?: Date
  }
}

interface ValidationResult {
  passed: boolean
  score: number
  violations: Violation[]
  autoFixed: boolean
}

interface Violation {
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  suggestion?: string
  line?: number
}
```

---

## Prompt Patterns

### 1. Single Selection

**Pattern**: Present options, user selects one

**Implementation**:
```markdown
? {prompt}
  → [1] {option1.label} - {option1.description}
  → [2] {option2.label} - {option2.description}
  → [3] {option3.label} - {option3.description}

Press number or arrow keys to select, Enter to confirm.
```

**Validation**:
- Must select exactly one option
- Selected value must match enum values

**Example**:
```markdown
? What type of component are you creating?
  → [1] UI Primitive - Base component from shadcn/ui
  → [2] Atom/Composite - Composed component using 2+ primitives
  → [3] Feature Component - Business logic with server actions
  → [4] Page Component - Full Next.js page with routing

Your selection: 2

✓ Selected: Atom/Composite
```

---

### 2. Multiple Selection

**Pattern**: Present options, user selects multiple

**Implementation**:
```markdown
? {prompt} (Space to select, Enter to confirm)
  [ ] {option1.label} - {option1.description}
  [ ] {option2.label} - {option2.description}
  [x] {option3.label} - {option3.description} [SELECTED]
  [ ] {option4.label} - {option4.description}

Use ↑↓ to navigate, Space to toggle, Enter to confirm.
```

**Validation**:
- Can select 0 to N options
- Optional unless marked required

**Example**:
```markdown
? Select component requirements (Space to select, Enter to confirm):
  [ ] Form Validation (Zod)
  [x] Server Actions
  [x] Data Table (@tanstack/react-table)
  [ ] File Upload
  [ ] Multi-step Navigation

Selected: Server Actions, Data Table

✓ Requirements saved
```

---

### 3. Text Input

**Pattern**: Free-form text with validation

**Implementation**:
```markdown
? {prompt}
  {placeholder_text}

Your input: _

[Live validation as user types]
```

**Validation Rules**:
- Regex pattern matching
- Length constraints (min/max)
- Uniqueness checks (file system, database)
- Custom validation functions

**Example**:
```markdown
? Enter component name (PascalCase):
  MultiStepForm

Your input: MultiStepForm

✓ Validating...
  ✓ PascalCase format
  ✓ No conflicts found
  ✓ Length OK (3-50 chars)

✓ Component name accepted
```

**Error Handling**:
```markdown
Your input: multi_step_form

✗ Validation failed:
  ✗ Must be PascalCase (e.g., MultiStepForm)

? Try again: _
```

---

### 4. Checklist (All Required)

**Pattern**: User must confirm all items

**Implementation**:
```markdown
? {prompt} (ALL REQUIRED)
  [ ] {item1.label}
  [ ] {item2.label}
  [ ] {item3.label}

Use ↑↓ to navigate, Space to toggle, Enter to confirm.

⚠️  All items must be checked to proceed.
```

**Blocking Behavior**:
```markdown
? Confirm accessibility requirements (ALL REQUIRED):
  [x] ARIA labels defined
  [x] Keyboard navigation implemented
  [ ] Focus management
  [ ] Color contrast ≥4.5:1
  [ ] Touch targets ≥44px

⚠️  Cannot proceed - 3 items not confirmed

Options:
  [1] Continue checking items
  [2] Exit wizard

Your choice: _
```

**Success**:
```markdown
? Confirm accessibility requirements (ALL REQUIRED):
  [x] ARIA labels defined
  [x] Keyboard navigation implemented
  [x] Focus management
  [x] Color contrast ≥4.5:1
  [x] Touch targets ≥44px

✓ All accessibility requirements confirmed
```

---

### 5. Conditional Input

**Pattern**: Input required based on user's answer to yes/no question

**Implementation**:
```markdown
? {condition_prompt}
  [1] Yes
  [2] No

[If Yes]
  ? {input_prompt}
    {placeholder}

  Your input: _
  [Validate]

[If No]
  ✓ Skipped (no input needed)
```

**Example**:
```markdown
? Does this component display text to users?
  [1] Yes
  [2] No

Your selection: 1

✓ Selected: Yes

? Enter dictionary keys needed (comma-separated):
  ui.save,ui.cancel,ui.confirm

Your input: ui.save,ui.cancel,ui.confirm

✓ Validating against dictionary...
  ✓ ui.save - exists
  ✓ ui.cancel - exists
  ✓ ui.confirm - exists

✓ Dictionary keys validated
```

---

### 6. Auto-Action (No User Input)

**Pattern**: Automated step, user observes

**Implementation**:
```markdown
🔨 {description}

[Progress indicator]
  → Step 1: {substep1}  ✓
  → Step 2: {substep2}  ✓
  → Step 3: {substep3}  [in progress...]

[Completion]
✓ {summary}
```

**Example**:
```markdown
🔨 Generating tests (TDD enforced)

Progress:
  → Unit tests (Vitest)          ✓ 12 tests created
  → Integration tests (Vitest)   ✓ 3 tests created
  → Accessibility tests (axe)    ✓ 4 tests created
  → E2E tests (Playwright)       ✓ 2 tests created

Test Coverage Estimate: 97%

✓ Tests generated successfully
```

---

### 7. Validation Gate (Blocking)

**Pattern**: Automated validation with blocking on failure

**Implementation**:
```markdown
🔍 Validating {subject}

Running {N} quality gates:

Gate 1: {gate1.name} ({gate1.severity})
  [Checking...]
  ✓ {gate1.name} (100%) - 0 violations

Gate 2: {gate2.name} ({gate2.severity})
  [Checking...]
  ✗ {gate2.name} (75%) - 2 violations
    ⚠️  Line 42: {violation1}
    ⚠️  Line 56: {violation2}

[If auto-fix available]
  🔧 Auto-fixing...
    ✓ Fixed (2/2 violations)

[Re-validate]
  ✓ {gate2.name} (100%) - 0 violations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Score: 99/100 ✓ PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Blocking on Failure**:
```markdown
Gate 3: Accessibility (HIGH)
  [Checking...]
  ✗ Accessibility (75%) - 2 violations
    ⚠️  Line 42: Icon button missing aria-label
    ⚠️  Line 56: No keyboard handler for onClick

❌ Cannot auto-fix accessibility violations

Manual fixes required:
  1. Add aria-label="Close" to icon button (line 42)
  2. Add onKeyDown handler for Enter/Space (line 56)

Options:
  [1] Exit wizard and fix manually
  [2] Continue with warnings (NOT RECOMMENDED)
  [3] Abort component generation

Your choice: _
```

---

## Navigation Patterns

### Forward Navigation

```markdown
Current step: {currentStep}
Next step: {nextStep}

[Auto-advance on success]
✓ {currentStep} complete
→ Proceeding to {nextStep}...
```

### Back Navigation (Optional)

```markdown
Current step: {currentStep}

Options:
  [Enter] Continue
  [B] Go back to previous step
  [Q] Quit wizard

Your choice: B

← Returning to {previousStep}
```

### Conditional Branching

```markdown
Based on your selection ({choice}):
  → Next step: {conditionalNextStep}

[Skip irrelevant steps]
✓ Skipping: {skippedStep} (not applicable)
```

---

## Error Handling Patterns

### Validation Error

```markdown
✗ Validation failed: {error.message}

Suggestion: {error.suggestion}

? Try again:
  {placeholder}

Your input: _
```

### Critical Error (Exit)

```markdown
❌ Critical error: {error.message}

The wizard cannot continue.

Reason: {error.reason}

Options:
  [1] Save progress and exit
  [2] Discard and exit
  [3] Retry (if applicable)

Your choice: _
```

### Non-Blocking Warning

```markdown
⚠️  Warning: {warning.message}

This is not critical, but recommended to address.

Options:
  [1] Continue anyway
  [2] Fix now
  [3] Exit wizard

Your choice: _
```

---

## Progress Indicators

### Linear Progress

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Progress: 6/11 steps complete (55%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Completed:
  ✓ Component Type Selection
  ✓ Component Name
  ✓ Requirements Selection
  ✓ Radix Selection
  ✓ Accessibility Checklist
  ✓ i18n Setup

Current:
  🔨 Test Generation

Remaining:
  ⏳ Component Implementation
  ⏳ Validation Gates
  ⏳ Git Commit
  ⏳ Completion
```

### Step Indicator

```markdown
Step 6 of 11: i18n Setup ⚠️ BLOCKING

[==================>         ] 55%

Estimated time remaining: 2 minutes
```

---

## Confirmation Patterns

### Summary Before Action

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY - Please Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Component Details:
  Type: Feature Component
  Name: MultiStepForm
  Location: src/components/platform/multi-step-form/

Requirements:
  ✓ Form Validation (Zod)
  ✓ Server Actions
  ✓ Multi-step Navigation

Radix Primitives:
  ✓ Dialog

Accessibility:
  ✓ All 6 requirements confirmed

i18n Keys:
  ✓ forms.stepNext
  ✓ forms.stepPrev
  ✓ forms.submit
  ✓ ui.cancel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? Proceed with generation?
  [Y] Yes, generate component
  [N] No, go back and revise
  [Q] Quit wizard

Your choice: _
```

---

## Completion Patterns

### Success Summary

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ COMPONENT GENERATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Component: MultiStepForm
Type: Feature Component
Duration: 3 minutes 42 seconds

Files Created:
  ✅ multi-step-form.tsx
  ✅ types.ts
  ✅ README.md
  ✅ multi-step-form.test.tsx
  ✅ multi-step-form.e2e.test.ts

Quality Score: 99/100 ✅ PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
  1. Review: src/components/platform/multi-step-form/
  2. Test: pnpm test multi-step-form
  3. Use: import { MultiStepForm } from '@/components/platform/multi-step-form'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? What would you like to do next?
  [1] Create another component
  [2] View generated files
  [3] Exit

Your choice: _
```

---

## Validation Helper Functions

### Regex Validation

```typescript
function validateRegex(input: string, pattern: string, message: string): ValidationResult {
  const regex = new RegExp(pattern)
  const isValid = regex.test(input)

  return {
    passed: isValid,
    message: isValid ? 'Valid' : message
  }
}

// Example
validateRegex('MultiStepForm', '^[A-Z][a-zA-Z0-9]*$', 'Must be PascalCase')
// → { passed: true, message: 'Valid' }
```

### File Uniqueness Check

```typescript
function validateUnique(input: string, paths: string[]): ValidationResult {
  const conflicts = paths
    .map(path => path.replace('{input}', input))
    .filter(path => fileExists(path))

  return {
    passed: conflicts.length === 0,
    message: conflicts.length === 0
      ? 'No conflicts'
      : `Already exists: ${conflicts[0]}`
  }
}

// Example
validateUnique('Button', ['src/components/ui/{input}.tsx'])
// → { passed: false, message: 'Already exists: src/components/ui/Button.tsx' }
```

### Dictionary Key Validation

```typescript
function validateDictionaryKeys(keys: string, dictionaryPath: string): ValidationResult {
  const keyArray = keys.split(',').map(k => k.trim())
  const dictionary = loadDictionary(dictionaryPath)

  const missing = keyArray.filter(key => {
    const path = key.split('.')
    let obj = dictionary
    for (const segment of path) {
      if (!obj[segment]) return true
      obj = obj[segment]
    }
    return false
  })

  return {
    passed: missing.length === 0,
    message: missing.length === 0
      ? 'All keys exist'
      : `Missing keys: ${missing.join(', ')}`
  }
}

// Example
validateDictionaryKeys('ui.save,ui.newKey', 'dictionaries.ts')
// → { passed: false, message: 'Missing keys: ui.newKey' }
```

---

## Auto-Complete Patterns

### Dictionary Key Auto-Complete

```markdown
? Enter dictionary keys (comma-separated):
  ui._

[As user types "ui."]
Suggestions:
  ui.save
  ui.cancel
  ui.submit
  ui.close
  ui.confirm
  ui.delete

[User types "ui.s"]
Filtered Suggestions:
  ui.save
  ui.submit

[Tab to autocomplete, Enter to accept]
```

### File Path Auto-Complete

```markdown
? Enter component path:
  src/components/_

[As user types]
Suggestions:
  src/components/ui/
  src/components/atom/
  src/components/platform/
  src/components/marketing/

[Tab to autocomplete]
```

---

## Context-Sensitive Help

### Help Command

```markdown
At any step, type ? for help

? Enter component name:
  _?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HELP: Component Name
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Requirements:
  ✓ PascalCase format
  ✓ 3-50 characters
  ✓ No conflicts with existing components

Valid Examples:
  ✓ MultiStepForm
  ✓ PricingCard
  ✓ FileUpload

Invalid Examples:
  ✗ multiStepForm (not PascalCase)
  ✗ multi_step_form (underscores)
  ✗ M (too short)

Press Enter to continue...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Inline Hints

```markdown
? Enter component name: _
  Hint: Use PascalCase (e.g., MultiStepForm)

? Select requirements: (Space to select)
  Hint: Multiple selections allowed - choose all that apply
```

---

## Integration with Agents & Skills

### Invoking Agents

```markdown
When step type is "action" with agentSequence:

For each agent in sequence:
  1. Display: "Invoking /agents/{agentName}"
  2. Display: "→ {agent.step}"
  3. Execute agent with collected data
  4. Capture output
  5. Display: "✓ Complete"
  6. Move to next agent

Example:
  🔨 Generating component...

  Invoking /agents/shadcn
  → Selecting base primitives
  ✓ Complete

  Invoking /agents/react
  → Implementing component logic
  ✓ Complete

  Invoking /agents/typescript
  → Generating strict types
  ✓ Complete
```

### Invoking Skills

```markdown
When validation or generation step references a skill:

1. Display: "Running skill: {skillName}"
2. Load skill from .claude/skills/{skillName}.md
3. Execute skill with parameters
4. Capture result
5. Display result summary

Example:
  🔍 Validating component quality...

  Running skill: ui-validator
  → Loading validation rules
  → Analyzing component
  → Running 7 quality gates

  ✓ ui-validator complete
  Overall Score: 99/100
```

---

## State Persistence (Optional)

### Save Progress

```markdown
Wizard interrupted at step: i18n Setup

? Save progress?
  [Y] Yes, save and exit
  [N] No, discard and exit

[If Yes]
  ✓ Saved to .claude/temp/wizard-{timestamp}.json

  To resume:
    /ui-interactive --resume wizard-{timestamp}
```

### Resume Progress

```markdown
/ui-interactive --resume wizard-20250109-143022

Loading saved progress...
  ✓ Component Type: Feature Component
  ✓ Component Name: MultiStepForm
  ✓ Requirements: Form Validation, Server Actions
  ✓ Radix Primitives: Dialog
  ✓ Accessibility: Confirmed

Resuming at step: i18n Setup

? Enter dictionary keys (comma-separated): _
```

---

## Usage in Commands

```markdown
# In /ui-interactive command

1. Load workflow configuration
   const workflow = loadWorkflow('ui-factory-flowchart')

2. Initialize state
   const state: WorkflowState = {
     currentStep: workflow.steps[0].id,
     history: [],
     data: {},
     validationResults: {}
   }

3. Execute workflow
   while (state.currentStep !== 'completion') {
     const step = workflow.steps.find(s => s.id === state.currentStep)

     // Display prompt based on step type
     const result = await executeStep(step, state)

     // Validate result
     const validation = await validateStep(step, result)

     if (!validation.passed && step.blocking) {
       // Handle blocking failure
       const action = await promptBlockingFailure(validation)
       if (action === 'exit') break
       if (action === 'retry') continue
     }

     // Update state
     state.data[step.id] = result
     state.history.push(step.id)
     state.currentStep = step.next
   }

4. Display completion
   displayCompletionSummary(state)
```

---

## Best Practices

### 1. Clear Instructions
- Always explain what user needs to do
- Provide examples for text inputs
- Show keyboard shortcuts

### 2. Immediate Validation
- Validate as user types when possible
- Show validation status inline
- Provide clear error messages

### 3. Progressive Disclosure
- Show only relevant steps
- Skip steps based on conditions
- Don't overwhelm with options

### 4. Helpful Defaults
- Suggest common choices
- Pre-fill based on context
- Remember user preferences

### 5. Easy Navigation
- Allow back navigation
- Support quitting at any time
- Enable saving progress

### 6. Clear Blocking
- Explain WHY step blocks
- Provide clear fix instructions
- Offer alternatives when possible

---

## Testing Patterns

```typescript
describe('Interactive Prompts', () => {
  it('validates PascalCase input', () => {
    expect(validateRegex('MultiStepForm', '^[A-Z][a-zA-Z0-9]*$')).toEqual({
      passed: true,
      message: 'Valid'
    })

    expect(validateRegex('multiStepForm', '^[A-Z][a-zA-Z0-9]*$')).toEqual({
      passed: false,
      message: 'Must be PascalCase'
    })
  })

  it('blocks on unchecked required items', () => {
    const checklist = [
      { id: 'item1', required: true, checked: true },
      { id: 'item2', required: true, checked: false }
    ]

    expect(validateChecklist(checklist)).toEqual({
      passed: false,
      message: 'All items must be checked'
    })
  })

  it('validates dictionary keys exist', () => {
    const result = validateDictionaryKeys(
      'ui.save,ui.newKey',
      mockDictionary
    )

    expect(result.passed).toBe(false)
    expect(result.message).toContain('ui.newKey')
  })
})
```

---

## Summary

This skill provides **production-ready patterns** for implementing interactive workflows:

✅ **7 Prompt Types**: Single select, multi-select, text input, checklist, conditional, auto-action, validation
✅ **Navigation**: Forward, back, conditional branching
✅ **Validation**: Regex, uniqueness, dictionary, custom
✅ **Error Handling**: Blocking, non-blocking, retry patterns
✅ **Progress Tracking**: Linear progress, step indicators
✅ **Auto-Complete**: Dictionary keys, file paths
✅ **Context Help**: Inline hints, help command
✅ **State Management**: Save/resume progress

Use these patterns to create **guided, zero-tolerance workflows** that enforce quality standards while providing excellent developer experience.
