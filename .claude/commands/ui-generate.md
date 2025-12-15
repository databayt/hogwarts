---
description: AI-powered UI component generation
requiresArgs: true
---

Generate custom component: "$@"

## Interactive Mode

If user specifies `--interactive` or `-i` flag, redirect to interactive wizard:

```bash
# Check for interactive flag
if "$@" contains "--interactive" or "-i":
  → Invoke /ui-interactive instead
  → Exit this command

Examples:
  /ui-generate --interactive
  /ui-generate -i "multi-step form"  # Starts wizard with hint
```

**Interactive Mode Benefits**:

- Step-by-step guided workflow
- Enforced quality gates at each step
- TDD (tests generated BEFORE code)
- Zero-tolerance validation
- 99-100/100 quality score vs 85-95/100

**Use interactive when**:

- First time creating this component type
- Need guidance through the process
- Want to ensure zero quality violations
- Complex requirements
- Learning component generation

**Use standard mode (below) when**:

- Quick, simple components
- Familiar with standards
- Will validate manually later
- Time-sensitive prototyping

---

## Standard Mode (Non-Interactive)

## Process

1. **Analyze requirements**
   - Parse user prompt: "$@"
   - Identify component type (form, display, layout, navigation, feedback)
   - Determine required Radix primitives
   - Plan component API

2. **Invoke UI Factory Agent**

   ```
   /agents/ui-factory "$@"
   ```

3. **Generate component with quality checks**
   - Create component file with semantic tokens
   - Use semantic HTML (no typography utilities)
   - Implement full accessibility (WCAG 2.1 AA)
   - Add internationalization support
   - Generate TypeScript types (strict mode)
   - Create comprehensive tests (95%+ coverage)
   - Write JSDoc documentation

4. **Validate output**
   - Run `/ui-validate` on generated component
   - Auto-fix any minor violations
   - Report remaining issues

5. **Output deliverables**
   - Component implementation
   - TypeScript types
   - Unit tests
   - Usage documentation
   - Quality report

## Quality Standards (Automatic)

Every generated component includes:

- ✅ **100% semantic token usage** - No hardcoded colors
- ✅ **Semantic HTML only** - No typography utilities
- ✅ **WCAG 2.1 AA compliant** - Full accessibility
- ✅ **Internationalized** - No hardcoded strings
- ✅ **TypeScript strict** - Complete type safety
- ✅ **95%+ test coverage** - Comprehensive tests
- ✅ **Fully documented** - JSDoc + examples

## Examples

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

## Component Types

### Form Components

- Input fields with validation
- Select dropdowns with search
- Checkboxes, radios, switches
- Date/time pickers
- File uploads with preview

### Display Components

- Cards with variants
- Stat cards with trends
- Data tables with sorting
- Lists with virtualization
- Charts integration

### Layout Components

- Modal dialogs
- Side sheets/drawers
- Tabs with persistence
- Accordions
- Collapsible sections

### Navigation Components

- Menus with keyboard nav
- Breadcrumbs
- Pagination
- Command palettes
- Search with filters

### Feedback Components

- Toast notifications
- Alert banners
- Progress indicators
- Loading skeletons
- Empty states

## Output Structure

```
src/components/[category]/[component-name]/
├── index.ts              # Barrel export
├── [component-name].tsx  # Component implementation
├── [component-name].test.tsx  # Vitest tests
├── types.ts              # TypeScript interfaces
└── README.md             # Usage documentation
```

## Post-Generation

After component is generated:

1. Review implementation
2. Test in Storybook/dev environment
3. Run `/ui-validate` to confirm quality
4. Customize as needed (styling, behavior)
5. Commit with descriptive message

## Success Criteria

Generated component is ready when:

- ✅ Passes all 7 quality gates
- ✅ Works in dev environment without errors
- ✅ Tests pass with 95%+ coverage
- ✅ Documentation complete with examples
- ✅ Accessible via keyboard and screen reader
- ✅ Responsive across all breakpoints
- ✅ Supports RTL/LTR layouts

## Advanced Options

Specify detailed requirements in your prompt:

- **Variants**: "with primary, secondary, and destructive variants"
- **Sizes**: "in small, medium, and large sizes"
- **States**: "with loading, disabled, and error states"
- **Data**: "accepting array of items with id, name, and description"
- **Events**: "with onClick, onClose, and onChange handlers"
- **Accessibility**: "with keyboard shortcuts Cmd+K to open"
- **Animations**: "with smooth transitions and fade-in effect"

## Troubleshooting

**Issue**: Generated component doesn't match expectations
**Fix**: Provide more detailed prompt with specific requirements

**Issue**: Component has validation errors
**Fix**: Agent will auto-fix most issues; review remaining violations

**Issue**: Tests failing
**Fix**: Agent generates passing tests; if failing, report bug

**Issue**: Missing Radix primitive
**Fix**: Install with `pnpm add @radix-ui/react-[primitive]`

---

## Mode Comparison

| Aspect            | Standard Mode    | Interactive Mode (`--interactive`) |
| ----------------- | ---------------- | ---------------------------------- |
| **Speed**         | Fast (1-2 min)   | Moderate (3-5 min)                 |
| **Guidance**      | None             | Step-by-step wizard                |
| **Validation**    | Post-generation  | At each step (blocking)            |
| **TDD**           | Optional         | Enforced (tests first)             |
| **Quality Score** | 85-95/100        | 99-100/100                         |
| **Auto-Fix**      | Limited          | Comprehensive (3 attempts)         |
| **Learning**      | Self-directed    | Guided with help                   |
| **Use Case**      | Quick prototypes | Production components              |

**Recommendation**: Start with `--interactive` until familiar with standards, then use standard mode for speed.

---

## Related Commands

- `/ui-interactive` - Interactive wizard (can be invoked directly)
- `/ui-add` - Add component from shadcn/ui registry
- `/ui-validate` - Validate existing component quality
- `/ui-copy-showcase` - Copy shadcn showcase components
- `/ui-showcase` - Browse available lab components
