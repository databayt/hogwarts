---
paths:
  - "src/app/**/loading.tsx"
  - "src/components/**/loading*.tsx"
  - "src/components/atom/loading.tsx"
  - "src/components/ui/skeleton.tsx"
---

# Skeleton Loading Rules

## Base Component

Always use `<Skeleton>` from `@/components/ui/skeleton`. It uses `animate-shimmer` (gradient sweep), NOT `animate-pulse` (opacity blink).

```tsx
import { Skeleton } from "@/components/ui/skeleton"

;<Skeleton className="h-8 w-48" />
```

## Atom Library

Reuse composable skeletons from `@/components/atom/loading`:

- `SkeletonDataTable` — tables (configurable columns/rows)
- `SkeletonStats` — stat card grids
- `SkeletonChart` — chart placeholders (bar/line/pie/area)
- `SkeletonForm` / `SkeletonFormGrid` — form layouts
- `SkeletonPageNav` — tab navigation
- `SkeletonCalendar` — calendar views
- `SkeletonList` / `SkeletonActivityFeed` — list layouts

## loading.tsx Pattern

Every `loading.tsx` must either delegate to a named skeleton or compose from atom skeletons:

```tsx
// Pattern A: Delegate to feature skeleton (preferred)

// Pattern B: Compose from atoms
import { SkeletonDataTable, SkeletonPageNav } from "@/components/atom/loading"
import { FeatureSkeleton } from "@/components/feature-name/loading"

export default function Loading() {
  return <FeatureSkeleton />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonPageNav tabs={4} />
      <SkeletonDataTable columns={7} rows={12} />
    </div>
  )
}
```

## NEVER Do These

- Use `animate-pulse` for skeleton loading — use `<Skeleton>` which has `animate-shimmer`
- Use hardcoded colors (`bg-gray-200 dark:bg-gray-700`) — use `bg-accent` or `<Skeleton>`
- Use `bg-muted animate-pulse rounded` inline — use `<Skeleton className="...">` instead
- Use text fallbacks (`Loading...`, `<div>Loading...</div>`) in Suspense boundaries
- Use image spinners (`<Image src="/Loading.png" />`) for page-level loading
- Return `null` from `loading.tsx` (except root `src/app/loading.tsx`)

## ALWAYS Do These

- Match the actual content layout exactly — same heights, widths, spacing, grid structure
- Use `<Skeleton>` for every placeholder rectangle (consistent shimmer animation)
- Use Suspense with skeleton fallbacks for component-level streaming:
  ```tsx
  <Suspense fallback={<FeatureSkeleton />}>
    <FeatureContent />
  </Suspense>
  ```
- Count columns in your DataTable and pass the same count to `SkeletonDataTable`
- Keep skeletons static — no state, no hooks, no data fetching

## Sizing Reference

| Content Type    | Skeleton Size            |
| --------------- | ------------------------ |
| Page heading    | `h-8 w-48`               |
| Section heading | `h-6 w-36`               |
| Body text line  | `h-4 w-full`             |
| Button          | `h-10 w-24`              |
| Avatar (sm)     | `h-8 w-8 rounded-full`   |
| Avatar (lg)     | `h-12 w-12 rounded-full` |
| Input field     | `h-10 w-full`            |
| Card            | `h-32 w-full`            |
| Stat number     | `h-8 w-20`               |
| Tab bar         | Use `SkeletonPageNav`    |

## Key Files

| File                                    | Purpose                                           |
| --------------------------------------- | ------------------------------------------------- |
| `src/components/ui/skeleton.tsx`        | Base Skeleton with shimmer gradient               |
| `src/components/atom/loading.tsx`       | 30+ reusable skeleton atoms                       |
| `src/app/globals.css`                   | `@keyframes shimmer` animation (1.8s ease-in-out) |
| `src/components/ui/loading-patterns.md` | Detailed patterns documentation                   |
