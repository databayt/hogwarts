# Page Layout Pattern Skill

**Purpose**: Ensure consistent page layout patterns across all platform blocks using PageHeader and PageNav components at the layout level ONLY.

## 🚨 Critical Rules

1. **PageHeader and PageNav MUST only exist in layout.tsx files**
2. **Content files MUST NOT import or use PageHeader/PageNav**
3. **Wrapper divs MUST use single `<div className="space-y-6">` without nesting**
4. **Navigation arrays MUST be defined only in layout.tsx**

## Pattern: Fixed Block Title (Option A)

### Overview
Each platform block follows a standardized layout pattern where:
- The **layout.tsx** contains both PageHeader (with block name) and PageNav
- **Content pages** focus purely on their specific content
- No duplicate headers or navigation components
- **Wrapper divs** use consistent spacing without unnecessary nesting

### Structure

```
src/app/[lang]/s/[subdomain]/(platform)/[block]/
├── layout.tsx          # Contains PageHeader + PageNav
├── page.tsx            # Imports BlockContent (no header/nav)
└── [subpage]/
    └── page.tsx        # Imports SubpageContent (no header/nav)
```

## Implementation Guidelines

### 1. Layout File Pattern

```typescript
// src/app/[lang]/s/[subdomain]/(platform)/[block]/layout.tsx

import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'
import { getDictionary } from '@/components/internationalization/dictionaries'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function BlockLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.block // Replace 'block' with actual block name

  // Define navigation items for this block
  const blockPages: PageNavItem[] = [
    {
      name: d?.navigation?.overview || 'Overview',
      href: `/${lang}/block`,
    },
    {
      name: d?.navigation?.feature1 || 'Feature 1',
      href: `/${lang}/block/feature1`,
    },
    // Add more navigation items as needed
    // Use hidden: true for secondary pages shown in content but not nav
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Block Name'}
        className="text-start max-w-none"
      />
      <PageNav pages={blockPages} />
      {children}
    </div>
  )
}
```

### 2. Content Page Pattern

```typescript
// src/components/platform/[block]/content.tsx

import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
// ❌ DO NOT import PageHeader or PageNav
// ❌ DO NOT import navigation arrays

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function BlockContent({ dictionary, lang }: Props) {
  // ✅ CORRECT: Single wrapper div with space-y-6
  return (
    <div className="space-y-6">
      {/* Your actual content - NO headers or navigation */}
    </div>
  )

  // ❌ WRONG: Nested wrapper divs
  // return (
  //   <div>
  //     <div className="flex flex-col gap-6">
  //       <PageHeader /> {/* NEVER do this */}
  //       <PageNav />    {/* NEVER do this */}
  //     </div>
  //   </div>
  // )
}
```

### 3. Page File Pattern

```typescript
// src/app/[lang]/s/[subdomain]/(platform)/[block]/page.tsx

import { BlockContent } from '@/components/platform/[block]/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <BlockContent dictionary={dictionary} lang={lang} />
}
```

## Examples

### Finance Block (Correct Implementation)

```typescript
// finance/layout.tsx
export default async function FinanceLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance

  const financePages: PageNavItem[] = [
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/finance` },
    { name: d?.navigation?.invoice || 'Invoice', href: `/${lang}/finance/invoice` },
    { name: d?.navigation?.banking || 'Banking', href: `/${lang}/finance/banking` },
    { name: d?.navigation?.fees || 'Fees', href: `/${lang}/finance/fees` },
    // Hidden secondary pages
    { name: d?.navigation?.expenses || 'Expenses', href: `/${lang}/finance/expenses`, hidden: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Finance'}
        className="text-start max-w-none"
      />
      <PageNav pages={financePages} />
      {children}
    </div>
  )
}
```

## 🔧 Quick Fix Guide

### Step 1: Find Violations
```bash
# Find content files with PageHeader imports
grep -r "import.*PageHeader" src/components/platform/*/

# Find content files with PageNav imports
grep -r "import.*PageNav" src/components/platform/*/

# Find navigation array definitions in content files
grep -r "PageNavItem\[\]" src/components/platform/*/
```

### Step 2: Fix Content Files

**Before (WRONG):**
```typescript
// content.tsx with violations
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

export default function Content({ dictionary, lang }: Props) {
  const pages: PageNavItem[] = [
    { name: 'Overview', href: '/block' },
    // ...
  ]

  return (
    <div>
      <div className="flex flex-col gap-6">
        <PageHeader title="Block Title" />
        <PageNav pages={pages} />
        {/* actual content */}
      </div>
    </div>
  )
}
```

**After (CORRECT):**
```typescript
// content.tsx fixed
// No PageHeader or PageNav imports

export default function Content({ dictionary, lang }: Props) {
  // No navigation array definition

  return (
    <div className="space-y-6">
      {/* actual content only */}
    </div>
  )
}
```

### Step 3: Ensure Layout Has Navigation

**layout.tsx should contain:**
```typescript
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

export default async function Layout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  const pages: PageNavItem[] = [
    // Define ALL navigation here
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Block Title" />
      <PageNav pages={pages} />
      {children}
    </div>
  )
}
```

### Common Wrapper Div Patterns

| ❌ WRONG | ✅ CORRECT |
|----------|------------|
| `<div><div className="flex flex-col gap-6">` | `<div className="space-y-6">` |
| `<div><div className="space-y-6">` | `<div className="space-y-6">` |
| `<div className="flex flex-col gap-6">` | `<div className="space-y-6">` |
| Multiple nested wrapper divs | Single wrapper div |

### ⚠️ Overflow Prevention Pattern

**CRITICAL**: Pages MUST NOT have horizontal overflow caused by wide tables or sections.

**Problem**: Using container wrappers (like `Shell` component with `container` class) can cause horizontal scrollbars when tables are wide.

**Solution**: Remove all container wrappers from content files. Let the layout handle spacing, and use the simple `space-y-6` pattern.

#### Before (❌ WRONG - Causes horizontal overflow)
```typescript
// content.tsx with container wrapper
import { Shell as PageContainer } from '@/components/table/shell'

export default function Content() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <WideTable /> {/* This causes horizontal scrollbar */}
      </div>
    </PageContainer>
  )
}
```

#### After (✅ CORRECT - No overflow)
```typescript
// content.tsx without container wrapper
export default function Content() {
  return (
    <div className="space-y-6">
      <WideTable /> {/* Now properly contained */}
    </div>
  )
}
```

#### Key Rules for Overflow Prevention:
1. **Never use `Shell` or `container` classes in content files**
2. **Use single `<div className="space-y-6">` wrapper** - it properly contains content
3. **Let tables handle their own overflow** - DataTable has built-in `overflow-auto`
4. **Test with wide content** - verify no horizontal scrollbar appears

## Benefits

1. **DRY Principle**: No duplicate headers or navigation across pages
2. **Consistency**: All blocks follow the same pattern
3. **Maintainability**: Changes to navigation only need to be made in one place
4. **Clear Hierarchy**: Visual hierarchy is consistent across the platform
5. **Performance**: Less duplicate component rendering

## Common Mistakes to Avoid

### ❌ Mistake 1: PageHeader/PageNav in Content Files
```typescript
// WRONG - content.tsx
import PageHeader from '@/components/atom/page-header'
import { PageNav } from '@/components/atom/page-nav'

export default function Content() {
  return (
    <div>
      <PageHeader title="Finance" /> {/* NEVER! */}
      <PageNav pages={pages} />      {/* NEVER! */}
    </div>
  )
}
```

### ❌ Mistake 2: Duplicate Navigation Definitions
```typescript
// WRONG - navigation defined in content.tsx
const pages: PageNavItem[] = [...] // Should be in layout.tsx only
```

### ❌ Mistake 3: Nested Wrapper Divs
```typescript
// WRONG - unnecessary nesting
return (
  <div>
    <div className="flex flex-col gap-6">
      {/* content */}
    </div>
  </div>
)
```

### ❌ Mistake 4: Inconsistent Spacing Classes
```typescript
// WRONG - using gap-6 instead of space-y-6
return (
  <div className="flex flex-col gap-6">
    {/* content */}
  </div>
)
```

### ✅ Correct Implementation
```typescript
// CORRECT - layout.tsx has navigation
export default async function Layout({ children }) {
  const pages = [...] // Navigation defined here
  return (
    <div className="space-y-6">
      <PageHeader title="Block Name" />
      <PageNav pages={pages} />
      {children}
    </div>
  )
}

// CORRECT - content.tsx has only content
export default function Content() {
  return (
    <div className="space-y-6">
      {/* Pure content, no headers or nav */}
    </div>
  )
}
```

## Migration Checklist

When migrating an existing block to this pattern:

### Pre-Migration Audit
- [ ] Run grep commands to find all violations
- [ ] List all content files that need fixing
- [ ] Check if layout.tsx exists and has navigation

### Migration Steps
- [ ] **Step 1**: Update/create layout.tsx with PageHeader and PageNav
- [ ] **Step 2**: Remove PageHeader imports from all content.tsx files
- [ ] **Step 3**: Remove PageNav imports from all content.tsx files
- [ ] **Step 4**: Delete navigation array definitions from content files
- [ ] **Step 5**: Fix wrapper divs to use single `<div className="space-y-6">`
- [ ] **Step 6**: Remove any nested wrapper divs
- [ ] **Step 7**: Ensure navigation items are defined only in layout.tsx

### Post-Migration Testing
- [ ] Navigation appears on all pages
- [ ] No duplicate headers visible
- [ ] Correct spacing between elements
- [ ] Navigation highlights current page
- [ ] Build succeeds without errors
- [ ] No TypeScript violations
- [ ] No horizontal scrollbar with wide tables/content

## 🐛 Troubleshooting

### Issue: "Cannot find PageHeader/PageNav"
**Solution**: These should only be imported in layout.tsx, not content files

### Issue: "Navigation not showing"
**Solution**: Check that layout.tsx properly defines and renders PageNav

### Issue: "Extra spacing between elements"
**Solution**: Remove nested wrapper divs, use single `<div className="space-y-6">`

### Issue: "Build errors after refactoring"
**Solution**: Ensure all imports are removed from content files and navigation arrays are only in layout.tsx

## Related Components

- **PageHeader**: `src/components/atom/page-header.tsx`
- **PageNav**: `src/components/atom/page-nav.tsx`

## When to Use This Pattern

Use this pattern for:
- All platform blocks (finance, exams, attendance, admin, etc.)
- Any multi-page feature area with shared navigation
- Sections requiring consistent header and navigation

## When NOT to Use This Pattern

Don't use this pattern for:
- Single-page features without sub-navigation
- Modal or overlay content
- Standalone tools or utilities
- Landing pages or marketing pages

## Testing

After implementing this pattern, verify:
1. Navigation appears on all pages within the block
2. The block title is consistent across all pages
3. No duplicate headers or navigation elements
4. Navigation highlights the current page correctly
5. Hidden navigation items don't appear in PageNav but are accessible via direct links
6. No horizontal scrollbar appears when testing with wide tables or content