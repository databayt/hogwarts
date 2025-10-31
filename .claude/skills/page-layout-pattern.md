# Page Layout Pattern Skill

**Purpose**: Ensure consistent page layout patterns across all platform blocks using PageHeader and PageNav components.

## Pattern: Fixed Block Title (Option A)

### Overview
Each platform block follows a standardized layout pattern where:
- The **layout.tsx** contains both PageHeader (with block name) and PageNav
- **Content pages** focus purely on their specific content
- No duplicate headers or navigation components

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
// Import components but NOT PageHeader or PageNav

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function BlockContent({ dictionary, lang }: Props) {
  // Your content implementation
  // NO PageHeader here - it's in the layout
  // NO PageNav here - it's in the layout

  return (
    <div className="space-y-6">
      {/* Your actual content */}
    </div>
  )
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

## Benefits

1. **DRY Principle**: No duplicate headers or navigation across pages
2. **Consistency**: All blocks follow the same pattern
3. **Maintainability**: Changes to navigation only need to be made in one place
4. **Clear Hierarchy**: Visual hierarchy is consistent across the platform
5. **Performance**: Less duplicate component rendering

## Common Mistakes to Avoid

❌ **Don't**: Add PageHeader in content files
```typescript
// Wrong - content.tsx
export default function Content() {
  return (
    <div>
      <PageHeader title="Finance" /> {/* This is wrong! */}
      <PageNav pages={pages} />      {/* This is wrong! */}
      {/* content */}
    </div>
  )
}
```

❌ **Don't**: Duplicate navigation definition
```typescript
// Wrong - defining same nav in multiple places
const pages = [...] // Don't define in content files
```

✅ **Do**: Keep layout logic in layout files
```typescript
// Correct - layout.tsx handles all layout concerns
export default async function Layout({ children }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Block Name" />
      <PageNav pages={pages} />
      {children}
    </div>
  )
}
```

## Migration Checklist

When migrating an existing block to this pattern:

- [ ] Create or update layout.tsx with PageHeader and PageNav
- [ ] Remove PageHeader from all content.tsx files
- [ ] Remove PageNav from all content.tsx files
- [ ] Ensure navigation items are defined only in layout.tsx
- [ ] Test that navigation works correctly
- [ ] Verify visual consistency across all pages

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