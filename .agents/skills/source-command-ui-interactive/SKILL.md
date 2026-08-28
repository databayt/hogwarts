---
name: "source-command-ui-interactive"
description: "Interactive component wizard with step-by-step guidance and enforced quality gates"
---

# source-command-ui-interactive

Use this skill when the user asks to run the migrated source command `ui-interactive`.

## Command Template

# Interactive UI Component Wizard

**🎯 Purpose**: Guided, step-by-step component creation with zero-tolerance quality enforcement

**🚀 What this does**:

- Walks you through component creation with interactive prompts
- Enforces accessibility, i18n, and quality standards at each step
- Blocks progression until validation passes
- Generates tests BEFORE code (TDD enforced)
- Auto-commits with conventional message

**⏱️ Duration**: 3-5 minutes

---

## Usage

```bash
# Start interactive wizard
/ui-interactive

# Or use alias
/ui-wizard
```

---

## Workflow Overview

The wizard follows this systematic flow:

```
1. Component Type Selection
   ↓
2. Name/Route Validation
   ↓
3. Requirements Selection (optional)
   ↓
4. Radix Primitive Selection (optional)
   ↓
5. Accessibility Checklist (BLOCKING - all required)
   ↓
6. i18n Setup (BLOCKING - dictionary validation)
   ↓
7. Test Generation (AUTO - TDD enforced)
   ↓
8. Component Implementation (AUTO - agents)
   ↓
9. Quality Gates Validation (BLOCKING - 7 gates)
   ↓
10. Git Commit (AUTO - conventional message)
    ↓
11. Completion Summary
```

---

## Step-by-Step Instructions

### **Invoke Interactive Prompts Skill**

This command loads the interactive prompts skill and flowchart workflow configuration to guide the user through component creation.

**Action**: Invoke skill `interactive-prompts` with workflow `ui-factory-flowchart`

```
Load workflow configuration from:
  .Codex/workflows/ui-factory-flowchart.json

Initialize interactive prompt system with:
  - Step-by-step navigation
  - Validation at each step
  - Blocking on critical steps
  - Auto-actions for generation/validation
```

---

### **Step 1: Component Type Selection**

**Prompt**: "What type of component are you creating?"

**Options**:

1. **UI Primitive** - Base component from shadcn/ui (Button, Input, Card, etc.)
2. **Atom/Composite** - Composed component using 2+ UI primitives
3. **Feature Component** - Business logic component with server actions
4. **Page Component** - Full Next.js page with routing

**Validation**: Must select one option

**Next Step**:

- UI Primitive → Primitive Selection (Step 2a)
- Atom/Feature → Component Name (Step 2b)
- Page → Page Route (Step 2c)

---

### **Step 2a: Primitive Selection** (if UI Primitive)

**Prompt**: "Which primitive are you adding from shadcn/ui registry?"

**Common Options**:

- Button - Interactive button with variants
- Card - Container for content
- Input - Form input field
- Select - Dropdown selection
- Dialog - Modal dialog
- Form - Form with validation
- Table - Data table
- Tabs - Tabbed interface
- Tooltip - Hover tooltip
- Dropdown Menu - Action menu

**Action**: Automatically run `/ui-add {selected-primitive}`

**Validation**: Primitive must be available in registry

**Next Step**: Post-Install Validation → End (primitives follow different flow)

---

### **Step 2b: Component Name** (if Atom/Feature)

**Prompt**: "Enter component name (PascalCase):"

**Placeholder**: `MultiStepForm`

**Validation Rules**:

1. Must be PascalCase (e.g., `MultiStepForm`, `PricingCard`)
2. Must not already exist in:
   - `src/components/ui/{name}.tsx`
   - `src/components/atom/{name}.tsx`
   - `src/components/platform/{name}/`
3. Must be 3-50 characters

**Examples**:

- ✅ `MultiStepForm`
- ✅ `PricingCard`
- ✅ `FileUpload`
- ❌ `multiStepForm` (not PascalCase)
- ❌ `multi_step_form` (not PascalCase)
- ❌ `Button` (already exists)

**Next Step**: Requirements Selection (Step 3)

---

### **Step 2c: Page Route** (if Page)

**Prompt**: "Enter page route path:"

**Placeholder**: `students/profile`

**Validation Rules**:

1. Must be lowercase with hyphens and slashes only
2. Must not already exist in: `src/app/[lang]/s/[subdomain]/(platform)/{route}/page.tsx`

**Examples**:

- ✅ `students/profile`
- ✅ `settings/billing`
- ✅ `dashboard/analytics`
- ❌ `Students/Profile` (uppercase)
- ❌ `students_profile` (underscores)
- ❌ `students` (already exists)

**Next Step**: Requirements Selection (Step 3)

---

### **Step 3: Requirements Selection** (optional)

**Prompt**: "Select component requirements (press Space to select, Enter to confirm):"

**Options** (multi-select):

- [ ] Form Validation (Zod) - Implies: Zod schema file
- [ ] Server Actions - Implies: Multi-tenant safety checks
- [ ] Data Table (@tanstack/react-table) - Implies: Column definitions
- [ ] File Upload
- [ ] Multi-step Navigation - Implies: State management
- [ ] Real-time Updates (SWR)
- [ ] Animations (Framer Motion)
- [ ] Charts (Recharts)

**Validation**: Optional, can skip

**Next Step**: Radix Selection (Step 4)

---

### **Step 4: Radix Primitive Selection** (optional)

**Prompt**: "Select Radix UI primitives needed (press Space to select, Enter to confirm):"

**Description**: "Select interactive primitives for accessibility"

**Options** (multi-select):

- [ ] Dialog - Modals, alerts
- [ ] Dropdown Menu - Action menus
- [ ] Popover - Contextual content
- [ ] Select - Custom select inputs
- [ ] Tabs - Navigation tabs
- [ ] Accordion - Collapsible sections
- [ ] Checkbox - Toggle states
- [ ] Radio Group - Single selection
- [ ] Switch - Boolean toggles
- [ ] Slider - Range inputs
- [ ] Toast - Notifications

**Validation**: Optional, can skip

**Next Step**: Accessibility Checklist (Step 5)

---

### **Step 5: Accessibility Checklist** ⚠️ **BLOCKING**

**Prompt**: "Confirm accessibility requirements (ALL REQUIRED - component will not be generated until confirmed):"

**Description**: "WCAG 2.1 AA compliance - this is non-negotiable"

**Checklist** (all required):

- [ ] **ARIA labels defined** for all interactive elements
- [ ] **Keyboard navigation implemented** (Enter, Space, Arrows, Escape, Tab)
- [ ] **Focus management and focus trap** (for modals/dialogs)
- [ ] **Color contrast ≥4.5:1** (text) and ≥3:1 (UI elements)
- [ ] **Touch targets ≥44x44px** for all interactive elements
- [ ] **Screen reader compatible** (tested with NVDA/JAWS)

**Validation**: **ALL items must be checked** to proceed

**Blocking Behavior**:

```
If ANY item is unchecked:
❌ Cannot proceed to next step
⚠️  Error: "All accessibility requirements must be confirmed.
    This is non-negotiable for WCAG 2.1 AA compliance."

Please review and confirm all items, or exit the wizard.
```

**Next Step**: i18n Setup (Step 6)

---

### **Step 6: i18n Setup** ⚠️ **BLOCKING**

**Prompt**: "Does this component display text to users?"

**Options**:

- Yes, it displays text → **Requires dictionary keys**
- No, it's purely structural → **Skip to next step**

**If "Yes"** (BLOCKING):

**Secondary Prompt**: "Enter dictionary keys needed (comma-separated):"

**Placeholder**: `ui.save,ui.cancel,ui.confirm,forms.stepNext`

**Description**: "Keys must exist in dictionaries.ts for both Arabic and English"

**Validation Rules**:

1. Must be alphanumeric with dots, commas, underscores only
2. **Keys must exist in dictionary** at `src/components/internationalization/dictionaries.ts`

**Examples**:

- ✅ `ui.save,ui.cancel`
- ✅ `forms.stepNext,forms.stepPrev,forms.submit`
- ❌ `ui.newKey` (doesn't exist in dictionary - must add first)
- ❌ `ui save cancel` (spaces not allowed)

**Blocking Behavior**:

```
If key doesn't exist:
❌ Cannot proceed to next step
⚠️  Error: "Dictionary key 'ui.newKey' not found.

    Options:
    1. Add key to src/components/internationalization/dictionaries.ts
    2. Use existing keys
    3. Exit and add keys manually"

Suggested existing keys:
  ui.save, ui.cancel, ui.submit, ui.close, ui.confirm, ui.delete
```

**Auto-Completion**: Show matching existing keys as user types

**Next Step**: Test Generation (Step 7)

---

### **Step 7: Test Generation** (AUTO - TDD Enforced)

**Description**: "Generating tests BEFORE implementation (TDD enforced)"

**Action**: Automatically invoke test generation

**Process**:

```
🔨 Generating tests...

1. Unit Tests (Vitest)
   ✅ Rendering tests (all variants)
   ✅ State tests (loading, disabled, error states)
   ✅ Interaction tests (click, keyboard, focus)
   ✅ Props validation tests

2. Integration Tests (Vitest)
   ✅ Server action integration (if applicable)
   ✅ Form validation integration (if applicable)

3. Accessibility Tests (axe-core)
   ✅ ARIA attribute validation
   ✅ Color contrast checks
   ✅ Keyboard navigation tests

4. E2E Tests (Playwright)
   ✅ User flow simulation
   ✅ Cross-browser compatibility
   ✅ Responsive design validation

Test Coverage Estimate: 97%

✅ Tests generated successfully:
   - src/components/{type}/{name}/{name}.test.tsx (Unit + Integration)
   - src/components/{type}/{name}/{name}.e2e.test.ts (E2E)
```

**No User Action Required** - Automatic

**Next Step**: Implementation (Step 8)

---

### **Step 8: Component Implementation** (AUTO)

**Description**: "Invoking agents for component generation"

**Agent Sequence**:

```
🔨 Generating component...

Phase 1: Base Primitives
  Invoking /agents/shadcn
  → Selecting base primitives
  → Applying shadcn/ui patterns
  ✅ Complete

Phase 2: Component Logic
  Invoking /agents/react
  → Implementing component logic
  → Adding React hooks
  → Managing component state
  ✅ Complete

Phase 3: Type Definitions
  Invoking /agents/typescript
  → Generating strict TypeScript types
  → Creating prop interfaces
  → Validating type safety
  ✅ Complete

Phase 4: Styling
  Invoking /agents/tailwind
  → Applying semantic tokens
  → Adding responsive design
  → Ensuring RTL/LTR support
  ✅ Complete

Phase 5: Internationalization
  Invoking /agents/i18n
  → Integrating dictionary keys
  → Adding RTL/LTR logic
  → Validating translations
  ✅ Complete

Phase 6: Finalization
  Invoking /agents/ui-factory
  → Validating structure
  → Adding documentation
  → Finalizing exports
  ✅ Complete

✅ Component generated successfully:
   - src/components/{type}/{name}/{name}.tsx
   - src/components/{type}/{name}/types.ts
   - src/components/{type}/{name}/README.md
```

**No User Action Required** - Automatic

**Next Step**: Quality Gates Validation (Step 9)

---

### **Step 9: Quality Gates Validation** ⚠️ **BLOCKING**

**Description**: "Running 7 quality gates - component must pass all"

**Validation Process**:

```
🔍 Validating component quality...

Gate 1: Semantic Tokens (CRITICAL)
  Checking for hardcoded colors...
  ✅ Semantic Tokens (100%) - 0 violations

Gate 2: Semantic HTML (CRITICAL)
  Checking for typography utilities...
  ✅ Semantic HTML (100%) - 0 violations

Gate 3: Accessibility (HIGH)
  Running axe-core accessibility audit...
  ✅ Accessibility (100%) - 0 violations
  WCAG 2.1 AA compliant

Gate 4: Internationalization (HIGH)
  Checking for hardcoded strings...
  ✅ Internationalization (100%) - 0 violations

Gate 5: TypeScript (MEDIUM)
  Running TypeScript compiler...
  ✅ TypeScript (100%) - 0 errors

Gate 6: Testing (MEDIUM)
  Analyzing test coverage...
  ✅ Testing (97%) - Coverage above 95%

Gate 7: Documentation (LOW)
  Validating JSDoc completeness...
  ✅ Documentation (100%) - Complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Score: 99/100 ✅ PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Auto-Fix** (if violations found):

```
🔧 Auto-fixing violations...

Gate 1: Semantic Tokens (95%) - 2 violations
  ⚠️  Line 45: bg-white → bg-background
  ⚠️  Line 52: text-gray-600 → text-muted-foreground
  ✅ Auto-fixed (2/2 violations)

Gate 2: Semantic HTML (90%) - 1 violation
  ⚠️  Line 28: <div className="text-3xl font-bold"> → <h2>
  ✅ Auto-fixed (1/1 violations)

Re-validating after auto-fix...
✅ All gates pass (100%)
```

**Blocking Behavior** (if auto-fix fails):

```
❌ Quality gate FAILED

Gate 3: Accessibility (75%) - 2 violations
  ⚠️  Line 42: Icon button missing aria-label
  ⚠️  Line 56: No keyboard handler for onClick
  ❌ Cannot auto-fix accessibility violations

Manual fixes required:
  1. Add aria-label="Close" to icon button (line 42)
  2. Add onKeyDown handler for Enter/Space (line 56)

Options:
  1. Exit wizard and fix manually
  2. Continue with warnings (NOT RECOMMENDED)
  3. Abort component generation

? What would you like to do:
```

**Next Step** (if all pass): Git Commit (Step 10)

---

### **Step 10: Git Commit** (AUTO)

**Description**: "Creating conventional commit"

**Action**: Automatically create git commit with conventional message

**Commit Message Template**:

```
feat(ui): add {ComponentName} {componentType}

{auto-generated description based on requirements}

🤖 Generated with [Codex](https://Codex.com/Codex)

Co-Authored-By: Codex <noreply@anthropic.com>
```

**Process**:

```
📝 Creating git commit...

git add src/components/{type}/{name}/*
git add src/components/{type}/{name}/__tests__/*

Running pre-commit hooks...
✅ TypeScript: 0 errors
✅ ESLint: 0 errors
✅ Tests: Passed
✅ UI Quality: 0 violations

git commit -m "feat(ui): add MultiStepForm feature component

Implemented multi-step form with progress indicator, validation, and accessibility features.

Includes:
- Form validation with Zod
- Step navigation
- Progress indicator
- WCAG 2.1 AA compliant
- Arabic/English i18n support

🤖 Generated with [Codex](https://Codex.com/Codex)

Co-Authored-By: Codex <noreply@anthropic.com>"

✅ Committed: abc123d
```

**No User Action Required** - Automatic

**Next Step**: Completion (Step 11)

---

### **Step 11: Completion Summary**

**Display**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ COMPONENT GENERATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Component: MultiStepForm
Type: Feature Component
Location: src/components/platform/multi-step-form/

Files Created:
  ✅ multi-step-form.tsx (Component)
  ✅ types.ts (TypeScript definitions)
  ✅ README.md (Documentation)
  ✅ multi-step-form.test.tsx (Unit tests)
  ✅ multi-step-form.e2e.test.ts (E2E tests)

Quality Score: 99/100 ✅ PASS
  ✅ Semantic Tokens (100%)
  ✅ Semantic HTML (100%)
  ✅ Accessibility (100%)
  ✅ Internationalization (100%)
  ✅ TypeScript (100%)
  ✅ Testing (97%)
  ✅ Documentation (100%)

Git Commit: abc123d
  feat(ui): add MultiStepForm feature component

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
  1. Review generated files in src/components/platform/multi-step-form/
  2. Run tests: pnpm test src/components/platform/multi-step-form/
  3. Test in dev: pnpm dev
  4. Import and use:
     import { MultiStepForm } from '@/components/platform/multi-step-form'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**End of Workflow**

---

## Key Features

### ✅ Zero-Tolerance Quality

- **7 quality gates** must pass before commit
- **Auto-fix** for 60-95% of violations
- **Blocking** on critical/high severity issues

### ✅ TDD Enforced

- Tests generated **BEFORE** implementation
- **95%+ coverage** target
- Unit, integration, accessibility, and E2E tests

### ✅ Accessibility First

- **WCAG 2.1 AA** compliance mandatory
- **Cannot proceed** without confirming all requirements
- Automated accessibility testing with axe-core

### ✅ i18n Built-in

- **Dictionary validation** prevents hardcoded strings
- **RTL/LTR support** automatic
- Arabic and English translations required

### ✅ Multi-Agent Orchestration

- **6 specialized agents** work in sequence
- shadcn → react → typescript → tailwind → i18n → ui-factory
- Each agent contributes specific expertise

---

## Comparison: Interactive vs Standard Workflow

| Aspect             | Standard (`/ui-generate`) | Interactive (`/ui-interactive`) |
| ------------------ | ------------------------- | ------------------------------- |
| **Guidance**       | One-shot prompt           | Step-by-step wizard             |
| **Validation**     | Post-generation           | At each step (blocking)         |
| **Accessibility**  | Validated after           | Confirmed before generation     |
| **i18n**           | Validated after           | Confirmed before generation     |
| **TDD**            | Optional                  | Enforced (tests first)          |
| **Auto-Fix**       | Manual                    | Automatic                       |
| **Time**           | 1 minute                  | 3-5 minutes                     |
| **Quality Score**  | 85-95/100                 | 95-100/100                      |
| **Learning Curve** | Steep                     | Guided                          |

**Recommendation**: Use interactive mode for:

- Learning the component generation process
- Ensuring zero quality violations
- Complex components with many requirements
- When you want enforced standards

Use standard mode for:

- Quick, simple components
- Experienced developers familiar with standards
- When you'll fix violations manually

---

## Examples

### Example 1: Multi-Step Form Component

```bash
/ui-interactive

? What type of component?
  → Feature Component

? Component name:
  → MultiStepForm

? Select requirements:
  ☑ Form Validation (Zod)
  ☑ Multi-step Navigation

? Select Radix primitives:
  ☑ Dialog

? Confirm accessibility (ALL):
  ☑ ARIA labels
  ☑ Keyboard navigation
  ☑ Focus management
  ☑ Color contrast ≥4.5:1
  ☑ Touch targets ≥44px
  ☑ Screen reader compatible

? Dictionary keys:
  → forms.stepNext,forms.stepPrev,forms.submit,ui.cancel

[AUTO] Generating tests... ✅ 97% coverage
[AUTO] Generating component... ✅ Complete
[AUTO] Validating... ✅ 99/100 PASS
[AUTO] Committing... ✅ abc123d

✅ Component ready at src/components/school-dashboard/multi-step-form/
```

### Example 2: Pricing Card (Atom)

```bash
/ui-interactive

? What type of component?
  → Atom/Composite

? Component name:
  → PricingCard

? Select requirements:
  ☐ (none selected)

? Select Radix primitives:
  ☑ Card
  ☑ Button

? Confirm accessibility (ALL):
  ☑ (all confirmed)

? Dictionary keys:
  → ui.pricing.monthly,ui.pricing.yearly,ui.pricing.popular

[AUTO] Generating tests... ✅ 98% coverage
[AUTO] Generating component... ✅ Complete
[AUTO] Validating... ✅ 100/100 PASS
[AUTO] Committing... ✅ def456e

✅ Component ready at src/components/atom/pricing-card/
```

### Example 3: Button from Registry (Primitive)

```bash
/ui-interactive

? What type of component?
  → UI Primitive

? Which primitive?
  → Button

[AUTO] Installing from registry... ✅ Complete
[AUTO] Validating... ⚠️  2 violations (hardcoded colors)
[AUTO] Auto-fixing... ✅ Fixed (2/2)
[AUTO] Re-validating... ✅ 100/100 PASS

✅ Component ready at src/components/ui/button.tsx
```

---

## Troubleshooting

### Issue: "Dictionary key not found"

**Cause**: Key doesn't exist in dictionaries.ts

**Solution**:

1. Exit wizard
2. Add key to `src/components/internationalization/dictionaries.ts`:

   ```typescript
   export const dictionary_en = {
     ui: {
       newKey: "New Value",
     },
   }

   export const dictionary_ar = {
     ui: {
       newKey: "قيمة جديدة",
     },
   }
   ```

3. Restart wizard

### Issue: "Component already exists"

**Cause**: Name conflicts with existing component

**Solution**:

1. Choose a different name, OR
2. Delete existing component if outdated

### Issue: "Cannot proceed - accessibility not confirmed"

**Cause**: Not all accessibility items checked

**Solution**:

1. Review and confirm ALL 6 items
2. This is mandatory for WCAG 2.1 AA compliance
3. If you cannot confirm, component cannot be generated

### Issue: "Validation gate failed"

**Cause**: Component violates quality standards

**Solution**:

1. Review auto-fix suggestions
2. Apply manual fixes if auto-fix fails
3. Re-run validation
4. Consider exiting and fixing manually

---

## Related Commands

- `/ui-add` - Add component from registry (non-interactive)
- `/ui-generate` - Generate component with AI (non-interactive)
- `/ui-validate` - Validate existing component quality
- `/ui-showcase` - Browse available lab components

---

## Configuration

The interactive workflow is configured in:

- `.Codex/workflows/ui-factory-flowchart.json` - State machine definition
- `.Codex/skills/interactive-prompts.md` - Prompt patterns
- `.Codex/agents/ui-factory.md` - Agent logic

To customize the workflow, edit the flowchart configuration.

---

**Ready to create a component with zero quality violations?**

Run `/ui-interactive` to start the wizard! 🚀
