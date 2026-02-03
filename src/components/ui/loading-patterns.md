# Loading Patterns Documentation

Production-ready loading state patterns for the Hogwarts platform. This guide ensures consistent, performant, and accessible loading experiences across all features.

## ✅ Accuracy Audit (Last Updated: 2025-01-04)

All skeleton implementations have been verified for **100% layout accuracy** to prevent Cumulative Layout Shift (CLS).

## Table of Contents

1. [Overview](#overview)
2. [Verified Column Counts](#verified-column-counts)
3. [Core Principles](#core-principles)
4. [Available Skeleton Components](#available-skeleton-components)
5. [Pattern Library](#pattern-library)
6. [Implementation Guide](#implementation-guide)
7. [Best Practices](#best-practices)
8. [Common Mistakes](#common-mistakes)

---

## Overview

Loading states are critical for perceived performance and user experience. Our loading pattern system:

- **Prevents Cumulative Layout Shift (CLS)** - Skeletons match exact layouts (100% verified)
- **Provides instant feedback** - No blank screens during data fetching
- **Maintains consistency** - Reusable components across all features
- **Optimizes for performance** - Lightweight, static skeletons
- **Supports accessibility** - Proper ARIA labels and semantic HTML

---

## Verified Column Counts

All data table skeletons have been audited against actual column definitions:

| Route             | Actual Columns | Skeleton Columns | Status              |
| ----------------- | -------------- | ---------------- | ------------------- |
| **students**      | 5              | 5                | ✅ Verified         |
| **teachers**      | 5              | 5                | ✅ Verified (Fixed) |
| **classes**       | 10             | 10               | ✅ Verified (Fixed) |
| **parents**       | 5              | 5                | ✅ Verified         |
| **subjects**      | 4              | 4                | ✅ Verified (Fixed) |
| **announcements** | 5              | 5                | ✅ Verified (Fixed) |
| **events**        | 10             | 10               | ✅ Verified (Fixed) |
| **lessons**       | 9              | 9                | ✅ Verified (Fixed) |
| **assignments**   | 6              | 6                | ✅ Verified         |
| **grades**        | 9              | 9                | ✅ Verified (Fixed) |

**Card Grids:**

- **finance**: 13 cards ✅
- **exams**: 9 cards ✅
- **attendance**: 8 method cards ✅

**Navigation:**

- **finance**: 7 tabs ✅
- **exams**: 6 tabs ✅
- **attendance**: 8 tabs ✅

---

## Core Principles

### 1. Match Layout Exactly

Skeletons must match the actual content layout to prevent CLS:

```tsx
// ❌ Bad - Doesn't match actual layout
<Skeleton className="h-20 w-full" />

// ✅ Good - Matches DataTable structure
<SkeletonDataTable columns={5} rows={10} />
```

### 2. Use File-Based Loading (Next.js 15 App Router)

Place `loading.tsx` at route segments for automatic streaming:

```
app/
  [lang]/
    s/
      [subdomain]/
        (platform)/
          students/
            loading.tsx    ← Shows while page.tsx loads
            page.tsx
```

### 3. Keep Skeletons Static

Loading skeletons should NOT use dynamic content or dictionaries:

```tsx
// ❌ Bad - Requires dictionary (dynamic)
export default async function Loading({ dictionary }: Props) {
  return <PageHeader title={dictionary.title} />
}

// ✅ Good - Static content only
export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonDataTable />
    </div>
  )
}
```

### 4. Consistent Wrapper Pattern

All loading states use the same wrapper for vertical rhythm:

```tsx
export default function Loading() {
  return <div className="space-y-6">{/* Your skeletons here */}</div>
}
```

---

## Available Skeleton Components

### Base Components

#### `<Skeleton>`

Primitive building block for custom skeletons.

```tsx
import { Skeleton } from "@/components/ui/skeleton"

;<Skeleton className="h-4 w-32" />
```

### Specialized Skeleton Components

All specialized skeletons are consolidated in `@/components/atom/loading`:

```tsx
import {
  SkeletonCalendar,
  SkeletonCard,
  SkeletonChart,
  SkeletonDataTable,
  SkeletonForm,
  SkeletonList,
  SkeletonPageNav,
  SkeletonStats,
} from "@/components/atom/loading"
```

#### `<SkeletonDataTable>`

For data table pages (students, teachers, classes, etc.).

```tsx
<SkeletonDataTable
  columns={5}
  rows={10}
  showToolbar={true}
  showPagination={true}
/>
```

**Variants:** `<SkeletonDataTableCompact>` - No toolbar/pagination

#### `<SkeletonPageNav>`

For tab navigation (finance, exams, attendance).

```tsx
<SkeletonPageNav tabs={4} />
```

**Variants:** `<SkeletonPageNavWide>` - For 7+ tabs with scroll

#### `<SkeletonForm>`

For form pages (profile, settings).

```tsx
<SkeletonForm fields={6} showCard={false} />
```

**Variants:** `<SkeletonFormGrid>`, `<SkeletonFormSection>`

#### `<SkeletonCalendar>`

For timetable and calendar views.

```tsx
<SkeletonCalendar days={7} periods={8} showTime={true} />
```

**Variants:** `<SkeletonCalendarCompact>`, `<SkeletonMonthCalendar>`

#### `<SkeletonList>`

For lists (notifications, activity feeds).

```tsx
<SkeletonList items={8} showAvatar={true} />
```

**Variants:** `<SkeletonListCompact>`, `<SkeletonActivityFeed>`

#### `<SkeletonStats>`

For dashboard metrics and KPIs.

```tsx
<SkeletonStats count={4} />
```

**Variants:** `<SkeletonStatsLarge>`, `<SkeletonStatsRow>`

#### `<SkeletonChart>`

For charts and data visualizations.

```tsx
<SkeletonChart variant="bar" height="h-[300px]" />
```

**Variants:** `variant="bar" | "line" | "pie" | "area"`, `<SkeletonChartGrid>`

#### `<SkeletonCard>`

Pre-built card skeletons.

```tsx
<SkeletonCard />
```

**Variants:** `<SkeletonCardCompact>`, `<SkeletonStatCard>`

---

## Pattern Library

### Pattern 1: Data Table Page

**Used in:** Students, Teachers, Classes, Parents, Announcements, Events, Lessons, Assignments, Grades

```tsx
// app/[lang]/s/[subdomain]/(school-dashboard)/students/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonDataTable } from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <Skeleton className="h-8 w-48" />

      {/* Data table with toolbar */}
      <SkeletonDataTable columns={5} rows={15} />
    </div>
  )
}
```

### Pattern 2: Card Grid with Navigation

**Used in:** Finance, Exams, Admin, Facility

```tsx
// app/[lang]/s/[subdomain]/(school-dashboard)/finance/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard, SkeletonPageNavWide } from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Navigation tabs */}
      <SkeletonPageNavWide tabs={7} />

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 13 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
```

### Pattern 3: Dashboard with Stats and Charts

**Used in:** Dashboard (all roles)

```tsx
// app/[lang]/s/[subdomain]/(school-dashboard)/lab/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"
import {
  SkeletonChartGrid,
  SkeletonListCompact,
  SkeletonStats,
} from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* KPI stats */}
      <SkeletonStats count={4} />

      {/* Charts */}
      <SkeletonChartGrid count={2} />

      {/* Recent activity */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <SkeletonListCompact items={5} />
      </div>
    </div>
  )
}
```

### Pattern 4: Mixed Stats and Card Grid

**Used in:** Attendance

```tsx
// app/[lang]/s/[subdomain]/(school-dashboard)/attendance/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"
import {
  SkeletonCard,
  SkeletonPageNav,
  SkeletonStats,
} from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonPageNav tabs={8} />
      <SkeletonStats count={4} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
```

### Pattern 5: Timetable/Calendar

**Used in:** Timetable

```tsx
// app/[lang]/s/[subdomain]/(school-dashboard)/timetable/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCalendarCompact } from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <SkeletonCalendarCompact periods={8} />
    </div>
  )
}
```

### Pattern 6: Notifications/Activity List

**Used in:** Notifications

```tsx
// app/[lang]/s/[subdomain]/(school-dashboard)/notifications/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"
import {
  SkeletonList,
  SkeletonPageNav,
  SkeletonStats,
} from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonPageNav tabs={3} />
      <SkeletonStats count={3} columns="grid-cols-3" />
      <SkeletonList items={10} />
    </div>
  )
}
```

### Pattern 7: Form Page

**Used in:** Profile, Settings

```tsx
// app/[lang]/s/[subdomain]/(school-dashboard)/profile/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonFormSection, SkeletonPageNav } from "@/components/atom/loading"

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonPageNav tabs={4} />

      <div className="space-y-8">
        <SkeletonFormSection fields={4} />
        <SkeletonFormSection fields={3} />
      </div>
    </div>
  )
}
```

---

## Implementation Guide

### Step 1: Analyze the Content Layout

Before creating a loading state, examine the actual page:

```tsx
// Read the content.tsx or page.tsx
// Identify:
// - Layout structure (table, cards, form, etc.)
// - Number of elements (columns, rows, tabs, etc.)
// - Navigation components (PageNav, breadcrumbs)
```

### Step 2: Choose the Right Pattern

Match your layout to one of the 7 patterns above, or combine multiple skeleton components.

### Step 3: Create loading.tsx

Place the file at the route level:

```tsx
// app/[lang]/s/[subdomain]/(school-dashboard)/[feature]/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Skeleton components matching exact layout */}
    </div>
  )
}
```

### Step 4: Test for CLS

1. Enable slow 3G throttling in DevTools
2. Navigate to the route
3. Watch for layout shifts when content loads
4. Adjust skeleton sizes to match exactly

---

## Best Practices

### ✅ DO

1. **Match layouts exactly** - Prevent CLS by using correct skeleton dimensions
2. **Use semantic counts** - If table has 5 columns, skeleton should have 5 columns
3. **Keep static** - No props, no dictionary, no dynamic content
4. **Leverage reusable components** - Don't rebuild from `<Skeleton>` if a variant exists
5. **Test on slow connections** - Verify skeletons appear instantly
6. **Use consistent wrapper** - Always wrap in `<div className="space-y-6">`
7. **Follow responsive patterns** - Match the same breakpoints as actual content

### ❌ DON'T

1. **Don't use spinners** - Skeleton screens are superior UX
2. **Don't make skeletons dynamic** - No async functions or props from server
3. **Don't block entire page** - Use route-level loading for granular streaming
4. **Don't over-animate** - Single `animate-pulse` is enough
5. **Don't guess dimensions** - Measure actual components
6. **Don't use too many skeletons** - Balance detail with performance
7. **Don't forget accessibility** - Add `aria-busy="true"` for screen readers

---

## Common Mistakes

### Mistake 1: Mismatched Column Counts

```tsx
// ❌ Actual table has 7 columns, skeleton has 5
<SkeletonDataTable columns={5} />

// ✅ Match exactly
<SkeletonDataTable columns={7} />
```

### Mistake 2: Using Dynamic Content

```tsx
// ❌ Async function in loading.tsx
export default async function Loading() {
  const dict = await getDictionary("en")
  return <PageHeader title={dict.title} />
}

// ✅ Static skeleton
export default function Loading() {
  return <Skeleton className="h-8 w-48" />
}
```

### Mistake 3: Wrong Skeleton Component

```tsx
// ❌ Using SkeletonCard for a table page
<div className="grid gap-4">
  {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
</div>

// ✅ Use SkeletonDataTable
<SkeletonDataTable rows={10} />
```

### Mistake 4: Forgetting Navigation Skeleton

```tsx
// ❌ Missing PageNav skeleton
<div className="space-y-6">
  <Skeleton className="h-8 w-48" />
  <SkeletonDataTable />
</div>

// ✅ Include PageNav if route has tabs
<div className="space-y-6">
  <Skeleton className="h-8 w-48" />
  <SkeletonPageNav tabs={4} />
  <SkeletonDataTable />
</div>
```

### Mistake 5: Incorrect Grid Responsiveness

```tsx
// ❌ Static 3 columns (doesn't match responsive layout)
<div className="grid grid-cols-3 gap-4">
  {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
</div>

// ✅ Match actual responsive breakpoints
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
</div>
```

---

## Performance Metrics

Well-implemented loading states improve:

- **Perceived Load Time**: 67% reduction (industry standard)
- **CLS Score**: Near 0 (Google Core Web Vital)
- **Time to Interactive (TTI)**: Improved by instant skeleton display
- **User Satisfaction**: Higher completion rates with immediate feedback

---

## Maintenance

### When Adding New Features

1. Create `loading.tsx` alongside `page.tsx`
2. Follow one of the 7 patterns or combine components
3. Test on slow 3G before committing
4. Document any new patterns in this file

### When Updating Existing Pages

1. If layout changes, update corresponding `loading.tsx`
2. Keep skeleton structure in sync with content
3. Test for CLS after layout modifications

---

## Resources

- [Next.js Loading UI Docs](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [Web Vitals - CLS](https://web.dev/cls/)
- [shadcn/ui Skeleton](https://ui.shadcn.com/docs/components/skeleton)

---

**Last Updated:** 2025-01-03
**Skeleton Components Version:** 1.0.0
**Coverage:** 34 routes across all platform features
