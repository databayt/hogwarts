# Component Generator Skill

**Purpose**: Generate production-ready UI components following shadcn/ui patterns with complete quality assurance

## Generation Philosophy

Every component must be:
1. **Copy-paste ready** - Self-contained, no hidden dependencies
2. **Accessible by default** - WCAG 2.1 AA compliance
3. **Themeable** - 100% semantic token adoption
4. **Internationalized** - RTL/LTR support, no hardcoded strings
5. **Type-safe** - TypeScript strict mode compliant
6. **Tested** - 95%+ coverage minimum
7. **Documented** - JSDoc comments with examples

## Component Generation Workflow

### Step 1: Requirement Analysis

```typescript
// Parse requirements
interface Requirements {
  type: 'form' | 'display' | 'layout' | 'navigation' | 'feedback'
  features: string[]
  variants: string[]
  accessibility: AccessibilityRequirements
  data: DataRequirements
}
```

**Example Analysis:**
- User requests: "Create a pricing card with three tiers"
- Type: `display`
- Features: [pricing, tiers, comparison, CTA buttons]
- Variants: [monthly, yearly, lifetime]
- Accessibility: [keyboard nav, ARIA labels, focus management]
- Data: [tier name, price, features list, highlighted]

### Step 2: Radix Primitive Selection

| Component Need | Radix Primitive |
|---|---|
| Modal/Dialog | `@radix-ui/react-dialog` |
| Dropdown | `@radix-ui/react-dropdown-menu` |
| Tooltip | `@radix-ui/react-tooltip` |
| Select | `@radix-ui/react-select` |
| Checkbox | `@radix-ui/react-checkbox` |
| Tabs | `@radix-ui/react-tabs` |
| Accordion | `@radix-ui/react-accordion` |
| Slider | `@radix-ui/react-slider` |
| Switch | `@radix-ui/react-switch` |
| No interaction | No primitive (pure composition) |

### Step 3: File Structure Creation

```
src/components/[category]/[component-name]/
├── index.ts              # Barrel export
├── [component-name].tsx  # Main component
├── [component-name].test.tsx  # Unit tests
├── types.ts              # TypeScript interfaces
└── README.md             # Documentation
```

### Step 4: Component Implementation

#### Base Template

```tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// ============================================================================
// Types
// ============================================================================

interface ComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual variant
   * @default "default"
   */
  variant?: "default" | "destructive" | "outline" | "ghost"

  /**
   * Component size
   * @default "md"
   */
  size?: "sm" | "md" | "lg"

  /**
   * Loading state
   * @default false
   */
  loading?: boolean

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean

  /**
   * Custom class name
   */
  className?: string

  /**
   * Children nodes
   */
  children?: React.ReactNode
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles = {
  sm: "h-8 text-sm",
  md: "h-10 text-base",
  lg: "h-12 text-lg",
}

const variantStyles = {
  default: "bg-background text-foreground border-border",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "border-2 border-border bg-transparent",
  ghost: "hover:bg-accent hover:text-accent-foreground",
}

// ============================================================================
// Component
// ============================================================================

/**
 * ComponentName - Brief one-line description
 *
 * Detailed description of what this component does, when to use it,
 * and any important behavior notes.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ComponentName>Content</ComponentName>
 *
 * // With variant and size
 * <ComponentName variant="destructive" size="lg">
 *   Large destructive button
 * </ComponentName>
 *
 * // With loading state
 * <ComponentName loading>
 *   Loading...
 * </ComponentName>
 * ```
 */
export function ComponentName({
  variant = "default",
  size = "md",
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}: ComponentProps) {
  const { dictionary } = useDictionary()

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        "rounded-md transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          {dictionary?.ui?.loading || "Loading..."}
        </span>
      ) : (
        children
      )}
    </div>
  )
}
```

### Step 5: Accessibility Implementation

```tsx
// ARIA attributes
aria-label={dictionary?.ui?.componentAction || "Action"}
aria-expanded={isOpen}
aria-controls="content-id"
aria-describedby="description-id"
aria-haspopup={hasPopup}
aria-live="polite"  // For dynamic content
aria-atomic="true"  // For complete updates

// Keyboard navigation
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Escape':
      close()
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      toggle()
      break
    case 'ArrowDown':
      e.preventDefault()
      focusNext()
      break
    case 'ArrowUp':
      e.preventDefault()
      focusPrevious()
      break
    case 'Home':
      e.preventDefault()
      focusFirst()
      break
    case 'End':
      e.preventDefault()
      focusLast()
      break
  }
}

// Focus management
const buttonRef = useRef<HTMLButtonElement>(null)

useEffect(() => {
  if (isOpen) {
    buttonRef.current?.focus()
  }
}, [isOpen])

// Focus trap for modals
import { useFocusTrap } from '@/hooks/use-focus-trap'
const focusTrapRef = useFocusTrap(isOpen)
```

### Step 6: Internationalization

```tsx
// Client component pattern
const { dictionary } = useDictionary()

<button>
  {dictionary?.ui?.save || 'Save'}
</button>

<p className="muted">
  {dictionary?.ui?.description || 'Description text'}
</p>

// Server component pattern (in parent)
const dictionary = await getDictionary(params.lang)

<ComponentName
  labels={{
    save: dictionary.ui.save,
    cancel: dictionary.ui.cancel,
    confirm: dictionary.ui.confirm,
  }}
/>
```

### Step 7: Responsive Design

```tsx
// Mobile-first breakpoints
<div className="
  w-full
  px-4 sm:px-6 md:px-8     // Padding scales
  py-2 sm:py-4 md:py-6     // Vertical spacing scales
">
  <div className="
    grid
    grid-cols-1              // Mobile: single column
    sm:grid-cols-2           // Tablet: 2 columns
    lg:grid-cols-3           // Desktop: 3 columns
    xl:grid-cols-4           // Large: 4 columns
    gap-4 sm:gap-6 lg:gap-8  // Gap scales with breakpoint
  ">
    {items.map(item => (
      <Card key={item.id}>
        {/* Content */}
      </Card>
    ))}
  </div>
</div>

// Touch targets (minimum 44x44px)
<button className="min-h-[44px] min-w-[44px] p-3">

// Conditional rendering for mobile
const isMobile = useMediaQuery('(max-width: 640px)')

{isMobile ? (
  <Sheet>Mobile drawer</Sheet>
) : (
  <Dialog>Desktop modal</Dialog>
)}
```

### Step 8: Test Generation

```tsx
// [component-name].test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentName } from './component-name'

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<ComponentName>Test Content</ComponentName>)
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('applies variant styles correctly', () => {
      render(<ComponentName variant="destructive">Test</ComponentName>)
      const element = screen.getByText('Test')
      expect(element).toHaveClass('bg-destructive')
    })

    it('applies size styles correctly', () => {
      render(<ComponentName size="lg">Test</ComponentName>)
      const element = screen.getByText('Test')
      expect(element).toHaveClass('h-12')
    })
  })

  describe('States', () => {
    it('shows loading state', () => {
      render(<ComponentName loading>Test</ComponentName>)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('handles disabled state', () => {
      render(<ComponentName disabled>Test</ComponentName>)
      const element = screen.getByText('Test')
      expect(element).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Interactions', () => {
    it('handles click events', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(<ComponentName onClick={onClick}>Click Me</ComponentName>)
      await user.click(screen.getByText('Click Me'))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('prevents clicks when disabled', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(<ComponentName onClick={onClick} disabled>Click</ComponentName>)
      await user.click(screen.getByText('Click'))

      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ComponentName aria-label="Test Label">Content</ComponentName>)
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const onKeyDown = vi.fn()
      render(<ComponentName onKeyDown={onKeyDown}>Test</ComponentName>)

      const element = screen.getByText('Test')
      fireEvent.keyDown(element, { key: 'Enter' })

      expect(onKeyDown).toHaveBeenCalled()
    })

    it('manages focus correctly', () => {
      render(<ComponentName>Test</ComponentName>)
      const element = screen.getByText('Test')

      element.focus()
      expect(element).toHaveFocus()
    })
  })

  describe('Internationalization', () => {
    it('uses dictionary for text', () => {
      // Mock dictionary hook
      vi.mock('@/components/internationalization/use-dictionary', () => ({
        useDictionary: () => ({
          dictionary: {
            ui: {
              loading: 'جاري التحميل...'
            }
          }
        })
      }))

      render(<ComponentName loading>Test</ComponentName>)
      expect(screen.getByText('جاري التحميل...')).toBeInTheDocument()
    })
  })
})
```

## Quality Checklist

Before marking component complete:

### 1. Semantic Tokens
- [ ] Zero hardcoded colors
- [ ] No `bg-white`, `bg-gray-*`, `text-black` classes
- [ ] No `dark:*` mode classes
- [ ] All colors use semantic tokens
- [ ] Variants use semantic token system

### 2. Semantic HTML
- [ ] No `<div className="text-*">` for text
- [ ] Use `<h1>`-`<h6>` for headings
- [ ] Use `<p>` for paragraphs
- [ ] Use `<small>` for small text
- [ ] Use `<button>` not `<div onClick>`

### 3. Accessibility
- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation implemented
- [ ] Focus management working
- [ ] Color contrast WCAG AA (4.5:1)
- [ ] Screen reader tested
- [ ] Touch targets ≥ 44x44px

### 4. Internationalization
- [ ] No hardcoded strings
- [ ] All text uses `dictionary.*`
- [ ] Fallback values provided
- [ ] RTL layout support

### 5. TypeScript
- [ ] Strict mode compliant
- [ ] All props typed
- [ ] No `any` types
- [ ] Proper interfaces

### 6. Testing
- [ ] 95%+ coverage
- [ ] All variants tested
- [ ] Edge cases covered
- [ ] Accessibility tested
- [ ] Interactions tested

### 7. Documentation
- [ ] JSDoc comments complete
- [ ] Usage examples provided
- [ ] Props documented
- [ ] README created

## Common Patterns

### Form Component
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
})

export function FormComponent() {
  const form = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Fields */}
      </form>
    </Form>
  )
}
```

### Data Display Component
```tsx
export function DataDisplay({ data }: { data: Item[] }) {
  return (
    <div className="space-y-4">
      {data.map(item => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {item.description}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Modal Component
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ModalComponent({ open, onOpenChange }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
        </DialogHeader>
        {/* Content */}
      </DialogContent>
    </Dialog>
  )
}
```

## Success Criteria

A component is complete when:
- ✅ All quality checklist items passed
- ✅ Tests achieve 95%+ coverage
- ✅ Documentation complete with examples
- ✅ Accessibility validated
- ✅ TypeScript strict mode compliant
- ✅ Internationalization complete
- ✅ Responsive across all breakpoints

**Rule**: Quality over speed. Never ship a component that doesn't meet all criteria.
