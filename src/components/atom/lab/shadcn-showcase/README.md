# shadcn/ui v4 Component Showcase

**21 production-ready components** from the official shadcn/ui v4 repository, fully adapted to project standards.

## 📦 Component Categories

### Field Components (5)
Form field wrappers and input patterns:
- **FieldDemo** - Complete payment form with card details, billing address, and comments
- **FieldCheckbox** - Horizontal checkbox with label
- **FieldChoiceCard** - Radio group with descriptive cards (Kubernetes/VM selection)
- **FieldSlider** - Range slider with dynamic value display ($200-$800 price range)
- **FieldHear** - Multi-select pill-style checkboxes (discovery channels)

### Input Groups (4)
Input grouping and decoration patterns:
- **InputGroupDemo** - Four input patterns (search, URL, textarea, verified)
- **InputGroupButton** - Secure URL input with info popover and favorite toggle
- **InputGroupTextarea** - Code editor interface with header, footer, and actions
- **EmptyInputGroup** - 404 error state with search input

### Button Groups (4)
Button grouping and action patterns:
- **ButtonGroupDemo** - Email-like interface with nested dropdown menus
- **ButtonGroupInputGroup** - Messaging interface with toggleable voice mode
- **ButtonGroupNested** - Nested button groups (numbered + navigation arrows)
- **ButtonGroupPopover** - AI assistant interface with task configuration popover

### Display Components (3)
List items and content presentation:
- **ItemDemo** - Two-factor authentication setting and profile verification
- **ItemAvatar** - User list with avatars (single user and team members)
- **EmptyAvatarGroup** - Empty team state with overlapping avatars

### Feedback Components (2)
Loading states and user feedback:
- **SpinnerBadge** - Three badge variants with loading spinners
- **SpinnerEmpty** - Processing state with spinner and cancel button

### Settings Components (1)
Configuration interfaces:
- **AppearanceSettings** - Compute environment settings (Kubernetes/VM, GPU count, wallpaper tinting)

### Forms (1)
Advanced form patterns:
- **NotionPromptForm** - AI prompt interface with mentions, file attachments, model selection, and source configuration

## 🎨 Adaptations to Project Standards

All components have been adapted to follow project conventions:

✅ **Semantic Tokens** - Uses `bg-background`, `text-foreground`, `border-border` instead of hardcoded colors
✅ **TypeScript Strict Mode** - Fully typed with proper interfaces and type guards
✅ **Accessibility** - WCAG 2.1 AA compliant with proper ARIA attributes
✅ **Import Paths** - Updated from `@/registry/new-york-v4/ui/*` to `@/components/ui/*`
✅ **Responsive Design** - Mobile-first approach with responsive breakpoints
✅ **JSDoc Documentation** - Complete documentation with examples

## 📁 Directory Structure

```
src/components/atom/lab/shadcn-showcase/
├── field-components/
│   ├── field-demo.tsx
│   ├── field-checkbox.tsx
│   ├── field-choice-card.tsx
│   ├── field-slider.tsx
│   ├── field-hear.tsx
│   └── index.ts
├── input-groups/
│   ├── input-group-demo.tsx
│   ├── input-group-button.tsx
│   ├── input-group-textarea.tsx
│   ├── empty-input-group.tsx
│   └── index.ts
├── button-groups/
│   ├── button-group-demo.tsx
│   ├── button-group-input-group.tsx
│   ├── button-group-nested.tsx
│   ├── button-group-popover.tsx
│   └── index.ts
├── display/
│   ├── item-demo.tsx
│   ├── item-avatar.tsx
│   ├── empty-avatar-group.tsx
│   └── index.ts
├── feedback/
│   ├── spinner-badge.tsx
│   ├── spinner-empty.tsx
│   └── index.ts
├── settings/
│   ├── appearance-settings.tsx
│   └── index.ts
├── forms/
│   ├── notion-prompt-form.tsx
│   └── index.ts
├── shadcn-showcase.tsx (Main showcase component)
├── index.ts (Root exports)
└── README.md
```

## 🚀 Usage

### Import Individual Components

```tsx
import { FieldDemo } from "@/components/atom/lab/shadcn-showcase/field-components"
import { InputGroupDemo } from "@/components/atom/lab/shadcn-showcase/input-groups"
import { ButtonGroupDemo } from "@/components/atom/lab/shadcn-showcase/button-groups"

export function MyComponent() {
  return (
    <div>
      <FieldDemo />
      <InputGroupDemo />
      <ButtonGroupDemo />
    </div>
  )
}
```

### Import from Category

```tsx
import * as FieldComponents from "@/components/atom/lab/shadcn-showcase/field-components"

export function FieldShowcase() {
  return (
    <div>
      <FieldComponents.FieldDemo />
      <FieldComponents.FieldSlider />
      <FieldComponents.FieldCheckbox />
    </div>
  )
}
```

### View Full Showcase

Navigate to `/lab` and click the **"shadcn/ui v4"** tab to explore all components organized by category.

## 🔗 Original Source

These components are adapted from the official shadcn/ui v4 repository:
https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(app)/(root)/components

## 📝 Notes

- All components are client-side components (`"use client"`)
- Components use existing UI primitives from `@/components/ui`
- No additional dependencies required beyond existing project setup
- Fully compatible with Next.js 15.4.4 and React 19.1.0

## 🎯 Next Steps

1. Explore components in the lab: `/lab`
2. Copy components to your feature directories as needed
3. Customize styling and behavior for your use cases
4. Reference these patterns when building new components

---

**Last Updated:** 2025-11-09
**Component Count:** 21
**Status:** Production-ready ✅
