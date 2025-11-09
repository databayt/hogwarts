# UI Validator Skill

**Purpose**: Validate UI components against quality standards - semantic tokens, semantic HTML, accessibility, internationalization, and TypeScript compliance

## Validation Philosophy

Every component must pass **all 7 quality gates** before deployment:
1. ✅ **Semantic Tokens** (95%+ adoption) - No hardcoded colors
2. ✅ **Semantic HTML** (100%) - No typography utilities
3. ✅ **Accessibility** (WCAG 2.1 AA) - Full compliance
4. ✅ **Internationalization** (100%) - No hardcoded strings
5. ✅ **TypeScript** (Strict mode) - No type violations
6. ✅ **Testing** (95%+ coverage) - Comprehensive tests
7. ✅ **Documentation** (Complete) - JSDoc + examples

**Zero tolerance policy**: A single violation = component fails validation.

## Validation Workflow

### Step 1: File Discovery

```bash
# Validate specific file
/ui-validate src/components/ui/button.tsx

# Validate directory
/ui-validate src/components/ui/

# Validate pattern
/ui-validate src/components/**/*.tsx
```

### Step 2: Parse Component

```typescript
interface ComponentAnalysis {
  path: string
  name: string
  type: 'client' | 'server'
  imports: string[]
  exports: string[]
  props: PropDefinition[]
  violations: Violation[]
}
```

### Step 3: Run Quality Gates

## Quality Gate 1: Semantic Tokens (CRITICAL)

### Violations to Detect

```regex
# Hardcoded background colors
bg-white|bg-black|bg-gray-\d+|bg-slate-\d+|bg-zinc-\d+

# Hardcoded text colors
text-white|text-black|text-gray-\d+|text-slate-\d+

# Hardcoded border colors
border-white|border-black|border-gray-\d+

# Dark mode classes (anti-pattern)
dark:bg-|dark:text-|dark:border-

# Specific color values
bg-blue-\d+|bg-red-\d+|bg-green-\d+|bg-yellow-\d+
```

### Allowed Patterns

```tsx
// ✅ Semantic tokens
bg-background
bg-card
bg-muted
bg-accent
bg-primary
bg-secondary
bg-destructive
bg-chart-1
bg-chart-2
bg-chart-3
text-foreground
text-muted-foreground
text-primary-foreground
border-border
border-input
ring-ring
```

### Validation Code

```typescript
function validateSemanticTokens(content: string): Violation[] {
  const violations: Violation[] = []

  const hardcodedPatterns = [
    { pattern: /bg-white|bg-black|bg-gray-\d+/g, message: "Hardcoded background color" },
    { pattern: /text-white|text-black|text-gray-\d+/g, message: "Hardcoded text color" },
    { pattern: /border-white|border-black|border-gray-\d+/g, message: "Hardcoded border color" },
    { pattern: /dark:bg-|dark:text-|dark:border-/g, message: "Dark mode class (use semantic tokens)" },
  ]

  for (const { pattern, message } of hardcodedPatterns) {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      violations.push({
        gate: 'semantic-tokens',
        severity: 'critical',
        message,
        line: getLineNumber(content, match.index!),
        suggestion: getSuggestion(match[0]),
      })
    }
  }

  return violations
}

function getSuggestion(hardcoded: string): string {
  const suggestions: Record<string, string> = {
    'bg-white': 'bg-background',
    'bg-gray-50': 'bg-muted',
    'bg-gray-100': 'bg-accent',
    'bg-gray-900': 'bg-card (in dark mode)',
    'text-black': 'text-foreground',
    'text-gray-600': 'text-muted-foreground',
    'border-gray-200': 'border-border',
    'bg-blue-500': 'bg-primary',
    'bg-red-500': 'bg-destructive',
    'bg-green-500': 'bg-chart-2',
  }
  return suggestions[hardcoded] || 'Use semantic token'
}
```

## Quality Gate 2: Semantic HTML (CRITICAL)

### Violations to Detect

```regex
# Typography utilities on divs
<div className="[^"]*text-(xs|sm|base|lg|xl|2xl|3xl)
<div className="[^"]*font-(bold|semibold|medium)

# Non-semantic text containers
<div>.*?<\/div>  # when containing only text
```

### Allowed Patterns

```tsx
// ✅ Semantic HTML
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
<h4>Heading 4</h4>
<h5>Heading 5</h5>
<h6>Heading 6</h6>
<p>Paragraph</p>
<small>Small text</small>
<p className="lead">Lead paragraph</p>
<p className="muted">Muted text</p>
```

### Validation Code

```typescript
function validateSemanticHTML(content: string): Violation[] {
  const violations: Violation[] = []

  // Detect div with typography utilities
  const typographyPattern = /<div className="[^"]*(?:text-(?:xs|sm|base|lg|xl|2xl|3xl)|font-(?:bold|semibold|medium))/g
  const matches = content.matchAll(typographyPattern)

  for (const match of matches) {
    violations.push({
      gate: 'semantic-html',
      severity: 'critical',
      message: 'Typography utilities on <div>',
      line: getLineNumber(content, match.index!),
      suggestion: 'Use semantic HTML: <h1>-<h6>, <p>, <small>',
    })
  }

  return violations
}
```

## Quality Gate 3: Accessibility (HIGH)

### WCAG 2.1 AA Requirements

```typescript
interface AccessibilityCheck {
  ariaLabels: boolean        // All interactive elements labeled
  keyboardNav: boolean        // Keyboard navigation implemented
  focusManagement: boolean    // Focus indicators visible
  colorContrast: boolean      // 4.5:1 for text, 3:1 for UI
  screenReader: boolean       // Screen reader compatible
  touchTargets: boolean       // ≥ 44x44px for touch
}
```

### Required ARIA Attributes

```tsx
// Buttons without text
<button aria-label="Close">
  <X className="size-4" />
</button>

// Expandable sections
<button
  aria-expanded={isOpen}
  aria-controls="content-id"
>

// Form inputs
<input
  aria-label="Search"
  aria-describedby="hint-id"
  aria-invalid={hasError}
  aria-required
/>

// Live regions
<div aria-live="polite" aria-atomic="true">

// Modal dialogs
<div
  role="dialog"
  aria-labelledby="title-id"
  aria-describedby="desc-id"
  aria-modal="true"
>
```

### Validation Code

```typescript
function validateAccessibility(content: string): Violation[] {
  const violations: Violation[] = []

  // Check for buttons without aria-label
  const buttonPattern = /<button(?![^>]*aria-label)[^>]*>\s*<[^>]+\/>\s*<\/button>/g
  const buttonMatches = content.matchAll(buttonPattern)

  for (const match of buttonMatches) {
    violations.push({
      gate: 'accessibility',
      severity: 'high',
      message: 'Icon button missing aria-label',
      line: getLineNumber(content, match.index!),
      suggestion: 'Add aria-label="Action description"',
    })
  }

  // Check for keyboard event handlers
  const onClickPattern = /onClick=\{/g
  const onKeyDownPattern = /onKeyDown=\{/g

  const clickCount = (content.match(onClickPattern) || []).length
  const keyCount = (content.match(onKeyDownPattern) || []).length

  if (clickCount > 0 && keyCount === 0) {
    violations.push({
      gate: 'accessibility',
      severity: 'high',
      message: 'Click handlers without keyboard support',
      suggestion: 'Add onKeyDown handler for Enter and Space keys',
    })
  }

  return violations
}
```

## Quality Gate 4: Internationalization (HIGH)

### Violations to Detect

```typescript
// Hardcoded strings in JSX
<button>Save</button>  // ❌ Bad
<button>{dictionary?.ui?.save || 'Save'}</button>  // ✅ Good

// Hardcoded text in attributes
<input placeholder="Enter name" />  // ❌ Bad
<input placeholder={dictionary?.ui?.enterName || 'Enter name'} />  // ✅ Good
```

### Required Patterns

```tsx
// Client components
import { useDictionary } from '@/components/internationalization/use-dictionary'

const { dictionary } = useDictionary()

<p>{dictionary?.section?.key || 'Fallback'}</p>

// Server components
const dictionary = await getDictionary(params.lang)

<Component labels={dictionary.section} />
```

### Validation Code

```typescript
function validateInternationalization(content: string): Violation[] {
  const violations: Violation[] = []

  // Check for useDictionary import in client components
  if (content.includes('"use client"') && !content.includes('useDictionary')) {
    // Check for hardcoded English text
    const textPattern = />[A-Z][a-z]+\s+[a-z]+</g
    const matches = content.matchAll(textPattern)

    for (const match of matches) {
      violations.push({
        gate: 'internationalization',
        severity: 'high',
        message: 'Hardcoded text detected',
        line: getLineNumber(content, match.index!),
        suggestion: 'Use dictionary: {dictionary?.section?.key || "Fallback"}',
      })
    }
  }

  return violations
}
```

## Quality Gate 5: TypeScript (MEDIUM)

### Strict Mode Requirements

```typescript
// tsconfig.json must have:
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

### Type Violations

```typescript
// ❌ Violations
const data: any = await fetch(url)  // No 'any' types
function Component(props) { }  // Props must be typed
let value  // Implicit any

// ✅ Correct
interface Data {
  id: string
  name: string
}
const data: Data = await fetch(url).then(r => r.json())

interface ComponentProps {
  name: string
}
function Component({ name }: ComponentProps) { }
```

### Validation Code

```typescript
function validateTypeScript(filePath: string): Violation[] {
  // Use TypeScript compiler API
  const program = ts.createProgram([filePath], {
    strict: true,
    noEmit: true,
  })

  const diagnostics = ts.getPreEmitDiagnostics(program)

  return diagnostics.map(diagnostic => ({
    gate: 'typescript',
    severity: 'medium',
    message: diagnostic.messageText.toString(),
    line: diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start!).line,
  }))
}
```

## Quality Gate 6: Testing (MEDIUM)

### Coverage Requirements

```typescript
// Minimum 95% coverage across:
interface CoverageRequirements {
  statements: 95,  // All code paths
  branches: 95,    // All if/else paths
  functions: 95,   // All functions
  lines: 95        // All lines
}
```

### Test Categories Required

```tsx
describe('ComponentName', () => {
  // 1. Rendering tests
  describe('Rendering', () => {
    it('renders with default props')
    it('renders all variants')
    it('handles empty/null data')
  })

  // 2. Interaction tests
  describe('Interactions', () => {
    it('handles user events')
    it('prevents events when disabled')
  })

  // 3. Accessibility tests
  describe('Accessibility', () => {
    it('has proper ARIA attributes')
    it('supports keyboard navigation')
    it('manages focus correctly')
  })

  // 4. Edge cases
  describe('Edge Cases', () => {
    it('handles errors gracefully')
    it('validates input')
  })
})
```

### Validation Code

```bash
# Check if test file exists
if [ ! -f "${component}.test.tsx" ]; then
  echo "❌ Test file missing"
fi

# Run coverage
pnpm test "${component}" --coverage
# Parse coverage report
# Fail if < 95%
```

## Quality Gate 7: Documentation (LOW)

### Required Documentation

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

## Validation Report Format

```typescript
interface ValidationReport {
  component: string
  passed: boolean
  score: number  // 0-100
  gates: {
    semanticTokens: GateResult
    semanticHTML: GateResult
    accessibility: GateResult
    internationalization: GateResult
    typescript: GateResult
    testing: GateResult
    documentation: GateResult
  }
}

interface GateResult {
  passed: boolean
  violations: Violation[]
  score: number
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

## CLI Output

```bash
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
```

## Auto-Fix Suggestions

```typescript
interface AutoFix {
  violation: Violation
  fix: string
  canAutoFix: boolean
}

// Example auto-fixes
const autoFixes = {
  'bg-white': 'bg-background',
  'text-gray-600': 'text-muted-foreground',
  '<div className="text-xl font-bold">': '<h2>',
}
```

## Integration with CI/CD

```yaml
# .github/workflows/ui-quality.yml
name: UI Quality Check

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate UI Components
        run: |
          pnpm /ui-validate src/components/**/*.tsx
          if [ $? -ne 0 ]; then
            echo "❌ UI validation failed"
            exit 1
          fi
```

## Success Criteria

A component passes validation when:
- ✅ All 7 quality gates pass (100% on critical gates)
- ✅ Overall score ≥ 95/100
- ✅ Zero critical violations
- ✅ Zero high-severity violations

**Rule**: Quality is mandatory. Components with violations cannot be deployed.
