---
description: Copy shadcn showcase components to lab
requiresArgs: false
---

Copy shadcn/ui showcase components to `src/components/atom/lab/`

## Process

1. **Fetch showcase components** from shadcn/ui repository
   - Source: `https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(app)/(root)/components`
   - Components: 20+ showcase examples

2. **Parse and adapt** each component
   - Update imports to match project structure
   - Apply semantic token system
   - Add internationalization
   - Ensure TypeScript strict mode
   - Add comprehensive tests

3. **Component list** to copy:

   ### Form Components
   - `field-demo.tsx` - Field wrapper examples
   - `field-checkbox.tsx` - Checkbox field patterns
   - `field-choice-card.tsx` - Card-based selection
   - `field-slider.tsx` - Slider input fields
   - `notion-prompt-form.tsx` - Notion-style form

   ### Input Groups
   - `input-group-demo.tsx` - Input grouping patterns
   - `input-group-button.tsx` - Input with button
   - `input-group-textarea.tsx` - Textarea groups
   - `button-group-demo.tsx` - Button grouping
   - `button-group-popover.tsx` - Buttons with popovers

   ### Display Components
   - `item-demo.tsx` - List item patterns
   - `item-avatar.tsx` - Avatar displays
   - `empty-avatar-group.tsx` - Empty state avatars
   - `empty-input-group.tsx` - Empty input states

   ### Feedback Components
   - `spinner-badge.tsx` - Loading with badge
   - `spinner-empty.tsx` - Loading placeholders

   ### Settings
   - `appearance-settings.tsx` - Theme settings UI

4. **Adapt to project standards**

   ### Semantic Tokens

   ```tsx
   // Original (hardcoded)
   className = "bg-white dark:bg-gray-900"

   // Adapted (semantic)
   className = "bg-background"
   ```

   ### Internationalization

   ```tsx
   // Original (hardcoded)
   <button>Save Changes</button>

   // Adapted (i18n)
   const { dictionary } = useDictionary()
   <button>{dictionary?.lab?.saveChanges || 'Save Changes'}</button>
   ```

   ### TypeScript

   ```tsx
   // Original (loose)
   export function Component(props) {}

   // Adapted (strict)
   interface ComponentProps {
     variant?: "default" | "ghost"
     size?: "sm" | "md" | "lg"
   }
   export function Component({
     variant = "default",
     size = "md",
   }: ComponentProps) {}
   ```

5. **File structure**

   ```
   src/components/atom/lab/
   ├── field-components/
   │   ├── field-demo.tsx
   │   ├── field-checkbox.tsx
   │   └── ...
   ├── input-groups/
   │   ├── input-group-demo.tsx
   │   └── ...
   ├── display/
   │   ├── item-demo.tsx
   │   └── ...
   ├── feedback/
   │   ├── spinner-badge.tsx
   │   └── ...
   └── index.ts  # Barrel exports
   ```

6. **Quality validation**
   - Run `/ui-validate` on all copied components
   - Fix any violations
   - Ensure 95%+ test coverage
   - Verify all components render correctly

7. **Update lab showcase**
   - Update `src/components/platform/lab/dashboard-cards-showcase.tsx`
   - Add new shadcn components to showcase
   - Organize by category
   - Add filter/search support

## Expected Output

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

## Components Overview

### Field Components (2025 Patterns)

Modern form field wrappers with labels, hints, and errors:

- Field wrapper with label positioning
- Checkbox fields with descriptions
- Choice cards for radio/select patterns
- Slider fields with value display

### Input Groups

Compound input patterns for better UX:

- Inputs with action buttons
- Textarea with character count
- Button groups with segments
- Popovers integrated with buttons

### Display Patterns

List and item display patterns:

- Avatar lists with fallbacks
- Item cards with metadata
- Empty state patterns

### Loading States

Skeleton and spinner patterns:

- Badge with spinner
- Empty state skeletons

## Customization

After copying, customize:

1. **Colors** - Already using semantic tokens
2. **Spacing** - Adjust padding/margins
3. **Typography** - Already using semantic HTML
4. **Variants** - Add custom variants
5. **Features** - Extend with additional props

## Integration

Add to lab showcase page:

```tsx
// src/components/platform/lab/dashboard-cards-showcase.tsx
import { FieldDemo, InputGroupDemo } from "@/components/atom/lab"

;<DashboardSection title="shadcn 2025 Patterns">
  <DashboardGrid>
    <FieldDemo />
    <InputGroupDemo />
    {/* ... */}
  </DashboardGrid>
</DashboardSection>
```

## Benefits

- ✅ **20+ production-ready components** - Tested in shadcn projects
- ✅ **2025 modern patterns** - Latest form and input patterns
- ✅ **Radix UI primitives** - Accessibility built-in
- ✅ **Project-adapted** - Matches Hogwarts standards
- ✅ **Fully typed** - TypeScript strict mode
- ✅ **Internationalized** - RTL/LTR ready
- ✅ **Tested** - 95%+ coverage

## Troubleshooting

**Issue**: GitHub API rate limit
**Fix**: Set GITHUB_TOKEN environment variable

**Issue**: Import errors after copy
**Fix**: Check `@/components/ui/*` dependencies are installed

**Issue**: Components don't match design
**Fix**: Customize styles while maintaining semantic tokens

**Issue**: Tests failing
**Fix**: Update mock data to match component interfaces

## Success Criteria

Copy successful when:

- ✅ All 20+ components copied
- ✅ Zero import/build errors
- ✅ All components pass `/ui-validate`
- ✅ Lab showcase page renders correctly
- ✅ Tests pass with 95%+ coverage
