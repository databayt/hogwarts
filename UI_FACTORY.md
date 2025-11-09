# UI Factory System

**AI-Powered Component Generation** following shadcn/ui patterns with zero-tolerance quality enforcement.

[![Quality](https://img.shields.io/badge/quality-zero--tolerance-red)](https://github.com/shadcn-ui/ui)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-green)](https://www.w3.org/WAI/WCAG21/quickref/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Commands](#commands)
- [Quality Standards](#quality-standards)
- [Component Lifecycle](#component-lifecycle)
- [Radix UI Primitives](#radix-ui-primitives)
- [Validation System](#validation-system)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)
- [FAQ](#faq)

---

## Overview

The UI Factory is a comprehensive automation system for generating, validating, and maintaining UI components that follow shadcn/ui architecture and best practices.

### Philosophy

**Zero Tolerance for Quality Violations**

Every component must pass **all 7 quality gates** before deployment:

1. ✅ **Semantic Tokens** (95%+ adoption) - No hardcoded colors
2. ✅ **Semantic HTML** (100%) - No typography utilities
3. ✅ **Accessibility** (WCAG 2.1 AA) - Full compliance
4. ✅ **Internationalization** (100%) - No hardcoded strings
5. ✅ **TypeScript** (Strict mode) - No type violations
6. ✅ **Testing** (95%+ coverage) - Comprehensive tests
7. ✅ **Documentation** (Complete) - JSDoc + examples

**A single violation = component fails validation.**

### Architecture

Built on shadcn/ui's copy-paste philosophy:

```
shadcn/ui Registry
       ↓
   MCP Server  ←→  Natural Language Queries
       ↓
  UI Factory Agent
       ↓
Component Generator ←→ UI Validator
       ↓
  Quality Gates (7)
       ↓
Production Component
```

---

## Quick Start

```bash
# 1. Add component from registry
/ui-add button

# 2. Generate custom component
/ui-generate "pricing card with three tiers and monthly/yearly toggle"

# 3. Validate component quality
/ui-validate src/components/ui/button.tsx

# 4. Copy shadcn showcase components
/ui-copy-showcase

# 5. Query registry via MCP
"What components are available for forms?"
```

---

## Installation

### Prerequisites

- Node.js 18+
- pnpm 9+
- Next.js 15.4.4+
- React 19.1.0+

### Setup

1. **Install shadcn/ui CLI**

```bash
npx shadcn@latest init
```

Follow the prompts:
- Style: New York
- Color: Slate
- CSS variables: Yes
- Tailwind config: tailwind.config.ts
- CSS file: src/styles/globals.css
- Component location: src/components/ui

2. **Configure MCP Server**

The shadcn MCP server is already configured in `.mcp.json`:

```json
{
  "shadcn": {
    "type": "stdio",
    "command": "npx",
    "args": ["shadcn@latest", "mcp"],
    "description": "shadcn/ui component registry"
  }
}
```

3. **Verify Configuration**

```bash
# Check components.json exists
cat components.json

# Test MCP connection
# Ask Claude: "What components are available?"
```

4. **Enable Pre-commit Hooks**

The UI quality validation hook is automatically enabled via `.claude/settings.json`.

---

## Commands

### `/ui-add` - Add from Registry

Add components from the official shadcn/ui registry.

**Usage:**

```bash
# Single component
/ui-add button

# Multiple components
/ui-add button card input form

# With overwrite
/ui-add dialog --overwrite
```

**What it does:**

1. Fetches component from registry
2. Installs to `src/components/ui/`
3. Installs required dependencies
4. Validates quality (semantic tokens, etc.)
5. Reports status

**Example Output:**

```
Adding button component...
✅ Downloaded from registry
✅ Installed to src/components/ui/button.tsx
✅ Dependencies installed: @radix-ui/react-slot, class-variance-authority
✅ Quality validation passed
Component ready to use!
```

---

### `/ui-generate` - AI-Powered Generation

Generate custom components with AI following shadcn/ui patterns.

**Usage:**

```bash
# Simple component
/ui-generate "create a loading spinner"

# Complex form
/ui-generate "multi-step form with progress indicator and validation"

# Data display
/ui-generate "pricing card with three tiers, monthly/yearly toggle, and feature comparison"

# Interactive
/ui-generate "file upload with drag-and-drop, progress bars, and preview"

# Layout
/ui-generate "responsive dashboard grid with stat cards and charts"
```

**What it does:**

1. Analyzes requirements
2. Selects appropriate Radix UI primitives
3. Generates component with:
   - Semantic tokens (no hardcoded colors)
   - Semantic HTML (no typography utilities)
   - Full accessibility (WCAG 2.1 AA)
   - Internationalization support
   - TypeScript strict mode
   - Comprehensive tests (95%+ coverage)
   - JSDoc documentation
4. Validates against 7 quality gates
5. Auto-fixes minor violations

**Example Output:**

```
Generating custom component...

📋 Analysis:
  Type: Form component
  Primitives: Dialog, Form, Input, Button
  Complexity: High (multi-step)

🔨 Generation:
  ✅ Component implementation
  ✅ TypeScript types
  ✅ Unit tests (97% coverage)
  ✅ Documentation

🔍 Validation:
  ✅ Semantic Tokens (100%)
  ✅ Semantic HTML (100%)
  ✅ Accessibility (100%)
  ✅ Internationalization (100%)
  ✅ TypeScript (100%)
  ✅ Testing (97%)
  ✅ Documentation (100%)

Overall Score: 99/100 ✅ PASS

Component created at:
  src/components/platform/multi-step-form/
  ├── multi-step-form.tsx
  ├── multi-step-form.test.tsx
  ├── types.ts
  └── README.md
```

---

### `/ui-validate` - Quality Validation

Validate UI components against quality standards.

**Usage:**

```bash
# Validate all components
/ui-validate

# Validate specific file
/ui-validate src/components/ui/button.tsx

# Validate directory
/ui-validate src/components/ui/

# Validate pattern
/ui-validate src/components/atom/**/*.tsx

# Validate with auto-fix
/ui-validate src/components/ui/button.tsx --fix
```

**What it does:**

Runs 7 quality gates:

1. **Semantic Tokens** - Detects hardcoded colors
2. **Semantic HTML** - Detects typography utilities
3. **Accessibility** - Checks ARIA attributes, keyboard nav
4. **Internationalization** - Detects hardcoded strings
5. **TypeScript** - Validates strict mode compliance
6. **Testing** - Checks coverage ≥ 95%
7. **Documentation** - Verifies JSDoc completeness

**Example Output:**

```
Validating: src/components/ui/button.tsx

Quality Gates:
✅ Semantic Tokens    (100%) - 0 violations
✅ Semantic HTML      (100%) - 0 violations
❌ Accessibility      (75%)  - 2 violations
  ⚠️  Line 42: Icon button missing aria-label
  ⚠️  Line 56: No keyboard handler for onClick
✅ Internationalization (100%) - 0 violations
✅ TypeScript         (100%) - 0 violations
❌ Testing            (88%)  - Coverage below 95%
✅ Documentation      (100%) - Complete

Overall Score: 82/100 ❌ FAIL

Fix 4 violations to pass validation.

Suggestions:
  Line 42: Add aria-label="Close"
  Line 56: Add onKeyDown handler for Enter/Space
  Testing: Add tests for edge cases
```

---

### `/ui-copy-showcase` - Copy shadcn Showcase

Copy 20+ showcase components from shadcn/ui v4 repository.

**Usage:**

```bash
/ui-copy-showcase
```

**What it does:**

1. Fetches 20+ components from https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(app)/(root)/components
2. Adapts to project standards:
   - Updates imports
   - Applies semantic tokens
   - Adds internationalization
   - Ensures TypeScript strict mode
   - Generates tests
3. Organizes in `src/components/atom/lab/`:
   - `field-components/` - Form field wrappers
   - `input-groups/` - Input grouping patterns
   - `display/` - List and item patterns
   - `feedback/` - Loading states
4. Updates lab showcase page

**Components Included:**

| Category | Components |
|----------|-----------|
| **Form Components** | field-demo, field-checkbox, field-choice-card, field-slider, notion-prompt-form |
| **Input Groups** | input-group-demo, input-group-button, input-group-textarea, button-group-demo, button-group-popover |
| **Display** | item-demo, item-avatar, empty-avatar-group, empty-input-group |
| **Feedback** | spinner-badge, spinner-empty |
| **Settings** | appearance-settings |

**Example Output:**

```
Copying shadcn showcase components...

✓ Fetched 20 components from GitHub
✓ Parsed and adapted field components (5/5)
✓ Parsed and adapted input groups (5/5)
✓ Parsed and adapted display components (4/4)
✓ Parsed and adapted feedback components (2/2)
✓ Parsed and adapted settings components (1/1)
✓ Generated TypeScript types
✓ Added internationalization
✓ Created unit tests
✓ Validated quality (100% pass rate)

Successfully copied 20 components to src/components/atom/lab/

Next steps:
1. Review components: src/components/atom/lab/
2. Test in lab page: /lab
3. Customize as needed
```

---

## Quality Standards

### 1. Semantic Tokens (CRITICAL)

**Requirement:** 95%+ adoption, no hardcoded colors

**Violations:**

```tsx
// ❌ BAD
bg-white
bg-gray-50
text-black
dark:bg-gray-900
bg-blue-500
```

**Correct:**

```tsx
// ✅ GOOD
bg-background
bg-muted
text-foreground
bg-card (automatically handles dark mode)
bg-primary
```

**Why:** Semantic tokens enable:
- Automatic theme switching
- Consistent color palette
- Easier maintenance
- Better accessibility

**Reference:** `/docs/semantic-tokens`

---

### 2. Semantic HTML (CRITICAL)

**Requirement:** 100% compliance, no typography utilities

**Violations:**

```tsx
// ❌ BAD
<div className="text-3xl font-bold">Heading</div>
<div className="text-xl font-semibold">Subheading</div>
<div className="text-sm text-muted-foreground">Description</div>
```

**Correct:**

```tsx
// ✅ GOOD
<h2>Heading</h2>
<h3>Subheading</h3>
<p className="muted">Description</p>
```

**Why:** Semantic HTML provides:
- Better accessibility (screen readers)
- Improved SEO
- Cleaner code
- Automatic styling via typography.css

**Reference:** `/docs/typography`

---

### 3. Accessibility (HIGH)

**Requirement:** WCAG 2.1 AA compliance

**Checklist:**

- [ ] All buttons have accessible names
- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Color contrast ≥ 4.5:1 (text) and ≥ 3:1 (UI)
- [ ] Touch targets ≥ 44x44px

**Example:**

```tsx
// ❌ BAD - Icon button without label
<button onClick={onClose}>
  <X className="size-4" />
</button>

// ✅ GOOD - Accessible icon button
<button onClick={onClose} onKeyDown={handleKeyDown} aria-label="Close">
  <X className="size-4" />
</button>
```

**Reference:** [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

---

### 4. Internationalization (HIGH)

**Requirement:** 100% compliance, no hardcoded strings

**Violations:**

```tsx
// ❌ BAD
<button>Save Changes</button>
<input placeholder="Enter your name" />
```

**Correct:**

```tsx
// ✅ GOOD - Client component
import { useDictionary } from '@/components/internationalization/use-dictionary'

const { dictionary } = useDictionary()

<button>{dictionary?.ui?.saveChanges || 'Save Changes'}</button>
<input placeholder={dictionary?.ui?.enterName || 'Enter your name'} />

// ✅ GOOD - Server component
const dictionary = await getDictionary(params.lang)

<Component labels={dictionary.section} />
```

**Why:** Full RTL/LTR support for Arabic and English

**Reference:** `/docs/internationalization`

---

### 5. TypeScript (MEDIUM)

**Requirement:** Strict mode compliance

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Violations:**

```tsx
// ❌ BAD
const data: any = await fetch(url)
function Component(props) { }
let value  // implicit any
```

**Correct:**

```tsx
// ✅ GOOD
interface Data {
  id: string
  name: string
}
const data: Data = await fetch(url).then(r => r.json())

interface ComponentProps {
  name: string
  variant?: "default" | "ghost"
}
function Component({ name, variant = "default" }: ComponentProps) { }
```

---

### 6. Testing (MEDIUM)

**Requirement:** 95%+ coverage

**Required Test Categories:**

```tsx
describe('ComponentName', () => {
  describe('Rendering', () => {
    it('renders with default props')
    it('renders all variants')
    it('handles empty/null data')
  })

  describe('Interactions', () => {
    it('handles user events')
    it('prevents events when disabled')
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes')
    it('supports keyboard navigation')
    it('manages focus correctly')
  })

  describe('Edge Cases', () => {
    it('handles errors gracefully')
    it('validates input')
  })
})
```

**Run tests:**

```bash
pnpm test src/components/ui/button.tsx
pnpm test -- --coverage
```

---

### 7. Documentation (LOW)

**Requirement:** Complete JSDoc with examples

**Template:**

```tsx
/**
 * ComponentName - Brief one-line description
 *
 * Detailed description explaining:
 * - What the component does
 * - When to use it
 * - Key features and behavior
 *
 * @param {string} variant - Visual style variant
 * @param {string} size - Component size
 * @param {Function} onClick - Click handler
 * @param {string} className - Additional CSS classes
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ComponentName>Content</ComponentName>
 *
 * // With props
 * <ComponentName variant="primary" size="lg">
 *   Large primary button
 * </ComponentName>
 * ```
 */
```

---

## Component Lifecycle

### Generation → Validation → Integration

```
┌─────────────────────────────────────────────┐
│ 1. Generation                                │
│    /ui-add button                            │
│    /ui-generate "pricing card"               │
├─────────────────────────────────────────────┤
│ 2. Automatic Validation                      │
│    - Semantic tokens check                   │
│    - Semantic HTML check                     │
│    - Accessibility check                     │
│    - i18n check                              │
│    - TypeScript check                        │
│    - Testing check                           │
│    - Documentation check                     │
├─────────────────────────────────────────────┤
│ 3. Auto-Fix (if needed)                      │
│    - Replace hardcoded colors                │
│    - Convert divs to semantic HTML           │
│    - Add ARIA attributes                     │
│    - Add i18n support                        │
├─────────────────────────────────────────────┤
│ 4. Manual Review (if auto-fix fails)         │
│    - Review violation report                 │
│    - Apply manual fixes                      │
│    - Re-run validation                       │
├─────────────────────────────────────────────┤
│ 5. Integration                               │
│    - Import in parent component              │
│    - Test in dev environment                 │
│    - Commit with pre-commit hook validation  │
├─────────────────────────────────────────────┤
│ 6. Deployment                                │
│    - CI/CD validation                        │
│    - Production build                        │
│    - Monitoring                              │
└─────────────────────────────────────────────┘
```

---

## Radix UI Primitives

shadcn/ui is built on Radix UI primitives for accessibility.

### Available Primitives

| Primitive | Use Case | shadcn Component |
|-----------|----------|------------------|
| `@radix-ui/react-dialog` | Modals, dialogs | Dialog, Sheet |
| `@radix-ui/react-dropdown-menu` | Dropdowns | DropdownMenu |
| `@radix-ui/react-tooltip` | Tooltips | Tooltip |
| `@radix-ui/react-popover` | Popovers | Popover |
| `@radix-ui/react-select` | Select inputs | Select |
| `@radix-ui/react-tabs` | Tabs | Tabs |
| `@radix-ui/react-accordion` | Accordions | Accordion |
| `@radix-ui/react-checkbox` | Checkboxes | Checkbox |
| `@radix-ui/react-radio-group` | Radio groups | RadioGroup |
| `@radix-ui/react-switch` | Toggles | Switch |
| `@radix-ui/react-slider` | Sliders | Slider |
| `@radix-ui/react-progress` | Progress bars | Progress |
| `@radix-ui/react-toast` | Notifications | Toast |
| `@radix-ui/react-alert-dialog` | Confirmations | AlertDialog |
| `@radix-ui/react-hover-card` | Hover cards | HoverCard |
| `@radix-ui/react-navigation-menu` | Navigation | NavigationMenu |
| `@radix-ui/react-context-menu` | Context menus | ContextMenu |
| `@radix-ui/react-menubar` | Menubars | Menubar |
| `@radix-ui/react-scroll-area` | Scroll areas | ScrollArea |
| `@radix-ui/react-separator` | Separators | Separator |

### Selection Guide

| Component Type | Recommended Primitive |
|----------------|----------------------|
| Form with validation | Form (no Radix, uses react-hook-form) |
| Modal dialog | Dialog |
| Side drawer | Sheet (Dialog variant) |
| Action menu | DropdownMenu |
| Info tooltip | Tooltip |
| Contextual info | Popover |
| Multi-choice | Select or RadioGroup |
| Binary choice | Switch or Checkbox |
| Multi-page content | Tabs |
| Expandable content | Accordion |
| Notifications | Toast |
| Destructive actions | AlertDialog |
| Preview on hover | HoverCard |

**Documentation:** https://www.radix-ui.com/primitives

---

## Validation System

### 7 Quality Gates

```typescript
interface ValidationReport {
  component: string
  passed: boolean
  score: number  // 0-100
  gates: {
    semanticTokens: GateResult      // Critical
    semanticHTML: GateResult         // Critical
    accessibility: GateResult        // High
    internationalization: GateResult // High
    typescript: GateResult           // Medium
    testing: GateResult              // Medium
    documentation: GateResult        // Low
  }
}

interface GateResult {
  passed: boolean
  score: number
  violations: Violation[]
}

interface Violation {
  gate: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  line?: number
  column?: number
  suggestion?: string
}
```

### Severity Levels

| Severity | Impact | Action |
|----------|--------|--------|
| **Critical** | Breaks theme switching or accessibility | MUST fix before commit |
| **High** | Degrades UX or violates standards | SHOULD fix before commit |
| **Medium** | Technical debt or maintenance issue | Fix before production |
| **Low** | Documentation or nice-to-have | Fix when convenient |

### Auto-Fix Capabilities

| Violation | Auto-Fix Success Rate |
|-----------|----------------------|
| Hardcoded colors → Semantic tokens | 95% |
| Typography utilities → Semantic HTML | 90% |
| Missing ARIA labels | 70% |
| Hardcoded text → i18n | 60% |
| TypeScript errors | 50% |
| Missing tests | 30% |
| Missing documentation | 20% |

---

## Pre-commit Hooks

### Automatic Validation

Enabled via `.claude/settings.json`, automatically runs before commits:

```bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PRE-COMMIT BUILD VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Branch: feature/new-component

Step 1: TypeScript Compilation
✅ TypeScript: 0 errors

Step 2: Prisma Client Sync
✅ Prisma: No schema changes detected

Step 3: UI Component Quality
🎨 Checking 3 UI component file(s)...

❌ src/components/ui/button.tsx (2 violations)
   🎨 Hardcoded colors: 2
      45: bg-white dark:bg-gray-900
      52: text-gray-600

✅ src/components/ui/card.tsx (0 violations)
✅ src/components/ui/input.tsx (0 violations)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ UI Quality: 2 violations found

💡 Quick Fixes:
  bg-white        → bg-background
  text-gray-600   → text-muted-foreground

📚 Documentation:
  - /docs/semantic-tokens
  - /docs/ui-factory

🔧 Advanced Validation:
  Run '/ui-validate' for detailed analysis

Step 4: Linting
✅ ESLint: No errors

Step 5: Running Tests (Changed Files)
✅ Tests: Passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ PRE-COMMIT VALIDATION FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  You can override with: git commit --no-verify
   (Not recommended - fix errors before merging to main)
```

### Manual Validation

Run the validation script manually:

```bash
bash .claude/scripts/validate-ui-quality.sh
```

### Override (Not Recommended)

```bash
git commit --no-verify
```

**Warning:** Only use `--no-verify` on feature branches. Protected branches (main/master/production) will block commits with violations.

---

## Troubleshooting

### Issue: "components.json not found"

**Solution:**

```bash
npx shadcn@latest init
```

### Issue: "Registry not responding"

**Possible causes:**

1. No internet connection
2. GitHub API rate limit
3. Registry URL incorrect

**Solutions:**

```bash
# Check internet
ping github.com

# Set GITHUB_TOKEN for higher rate limit
export GITHUB_TOKEN=your_token

# Verify components.json registry URL
cat components.json | grep registries
```

### Issue: "Component already exists"

**Solution:**

```bash
# Option 1: Overwrite existing
/ui-add button --overwrite

# Option 2: Rename existing
mv src/components/ui/button.tsx src/components/ui/button-old.tsx
/ui-add button
```

### Issue: "Import errors after adding component"

**Possible causes:**

1. Missing dependencies
2. Incorrect import path
3. Prisma client not generated

**Solutions:**

```bash
# Install dependencies
pnpm install

# Check import paths (should use @/)
# ✅ import { Button } from "@/components/ui/button"
# ❌ import { Button } from "~/components/ui/button"

# Regenerate Prisma if needed
pnpm prisma generate
```

### Issue: "Validation fails after adding from registry"

**Why:** Some registry components may have hardcoded colors or typography utilities.

**Solution:**

```bash
# Run validation to see violations
/ui-validate src/components/ui/button.tsx

# Apply auto-fixes
/ui-validate src/components/ui/button.tsx --fix

# Manual fixes if needed
# Then re-validate
```

### Issue: "Tests failing after generation"

**Possible causes:**

1. Missing test dependencies
2. Mock data doesn't match types
3. Environment variables not set

**Solutions:**

```bash
# Install test dependencies
pnpm add -D @testing-library/react @testing-library/jest-dom vitest

# Check test file for errors
pnpm test src/components/ui/button.test.tsx

# Update mock data to match component interface
```

### Issue: "Build hangs after adding components"

**Root cause:** TypeScript errors (silent failure)

**Solution:**

```bash
# CRITICAL: Always check TypeScript before building
pnpm tsc --noEmit

# If errors found, fix them or use auto-fix
/fix-build

# Then try build again
pnpm build
```

---

## Examples

### Example 1: Add Button Component

```bash
# Add button from registry
/ui-add button

# Verify installation
ls src/components/ui/button.tsx

# Validate quality
/ui-validate src/components/ui/button.tsx

# Use in component
import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
```

### Example 2: Generate Pricing Card

```bash
# Generate with AI
/ui-generate "pricing card with three tiers (Starter, Pro, Enterprise), monthly/yearly toggle, feature comparison table, and CTA buttons"

# Output location
src/components/platform/pricing-card/
├── pricing-card.tsx
├── pricing-card.test.tsx
├── types.ts
└── README.md

# Import and use
import { PricingCard } from "@/components/platform/pricing-card"

<PricingCard
  tiers={[...]}
  billingPeriod="monthly"
  onSelectPlan={handleSelectPlan}
/>
```

### Example 3: Validate Existing Components

```bash
# Validate all UI components
/ui-validate src/components/ui/**/*.tsx

# Example output:
Validated 15 components

✅ Passed: 12 (80%)
❌ Failed: 3 (20%)

Critical Issues: 2
High Issues: 5
Medium Issues: 3
Low Issues: 1

Overall Score: 85/100

# Fix violations
/ui-validate src/components/ui/dialog.tsx --fix
```

### Example 4: Copy shadcn Showcase

```bash
# Copy all showcase components
/ui-copy-showcase

# Verify installation
ls src/components/atom/lab/field-components/
ls src/components/atom/lab/input-groups/
ls src/components/atom/lab/display/
ls src/components/atom/lab/feedback/

# Use in lab page
import { FieldDemo } from "@/components/atom/lab/field-components"

<FieldDemo />
```

---

## FAQ

### Q: What's the difference between `/ui-add` and `/ui-generate`?

**A:**

- `/ui-add` - Adds pre-built components from the official shadcn/ui registry
- `/ui-generate` - Creates custom components with AI based on your requirements

Use `/ui-add` for standard components (buttons, cards, inputs). Use `/ui-generate` for custom, project-specific components.

### Q: Can I modify components after adding from registry?

**A:** Yes! That's the beauty of the copy-paste architecture. Components are copied to your project, not installed as dependencies. Modify freely, just maintain quality standards.

### Q: Do I need to validate components from the registry?

**A:** Yes. While registry components are high-quality, they may not follow our specific standards (semantic tokens, i18n). Always run `/ui-validate` and fix violations.

### Q: What if auto-fix doesn't work?

**A:** Review the validation report, apply manual fixes, and re-validate. The report includes specific suggestions for each violation.

### Q: Can I use non-Radix primitives?

**A:** Yes, but Radix primitives are recommended for accessibility. If using alternatives, ensure WCAG 2.1 AA compliance.

### Q: How do I handle dark mode?

**A:** Use semantic tokens! They automatically handle dark mode. Never use `dark:*` classes.

```tsx
// ❌ BAD
<div className="bg-white dark:bg-gray-900">

// ✅ GOOD
<div className="bg-background">
```

### Q: Can I skip quality gates for prototyping?

**A:** Not recommended. Quality gates prevent technical debt. For quick prototyping, use `/ui-add` for standard components.

### Q: How do I add custom semantic tokens?

**A:** Update `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      'custom-token': 'hsl(var(--custom-token))',
    }
  }
}
```

Then add CSS variable in `globals.css`.

### Q: What if I get rate limited by GitHub?

**A:** Set `GITHUB_TOKEN` environment variable:

```bash
export GITHUB_TOKEN=your_github_personal_access_token
```

### Q: Can I use UI Factory with other frameworks?

**A:** The system is designed for Next.js + React + Tailwind. For other frameworks, adapt the concepts but tools may not work out-of-the-box.

---

## Resources

### Documentation

- [shadcn/ui Docs](https://ui.shadcn.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)

### Internal Documentation

- `/docs/semantic-tokens` - Semantic token system
- `/docs/typography` - Typography guidelines
- `/docs/ui-factory` - UI Factory system
- `/docs/build` - Build system
- `/docs/internationalization` - i18n setup

### Agent Reference

- `.claude/agents/ui-factory.md` - UI Factory agent
- `.claude/skills/component-generator.md` - Component generation
- `.claude/skills/ui-validator.md` - Validation system

### Scripts

- `.claude/scripts/validate-ui-quality.sh` - Pre-commit validation

---

## Support

For issues, questions, or contributions:

1. Check this documentation
2. Review [shadcn/ui docs](https://ui.shadcn.com/docs)
3. Run `/ui-validate` for specific component issues
4. Check `.claude/agents/ui-factory.md` for advanced usage
5. Open an issue on GitHub

---

## License

This UI Factory system is part of the Hogwarts School Automation Platform and follows the same MIT license.

---

**Last Updated:** 2025-11-09
**Version:** 1.0.0
**Maintained by:** BMAD-Enhanced Claude Code
