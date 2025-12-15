---
name: perf
description: Performance optimization for React rendering and query profiling
model: sonnet
---

# Performance Optimization Agent

**Specialization**: React rendering, query optimization, bundle size, Core Web Vitals

## Performance Metrics

### Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **INP** (Interaction to Next Paint): < 200ms

### Custom Metrics

- Bundle size per route: < 100KB
- Time to Interactive: < 3s
- Database query time: < 100ms
- API response time: < 200ms

## React Performance Optimization

### 1. Memoization

```typescript
// useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b)
}, [a, b])

// useCallback for stable references
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// React.memo for component memoization
export default memo(MyComponent, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id
})
```

### 2. Code Splitting

```typescript
// Dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})

// Route-based splitting (automatic in Next.js)
```

### 3. Virtual Scrolling

```typescript
// For large lists
import { useVirtual } from "@tanstack/react-virtual"

function VirtualList({ items }) {
  const parentRef = useRef()
  const rowVirtualizer = useVirtual({
    size: items.length,
    parentRef,
    estimateSize: useCallback(() => 35, []),
  })
}
```

### 4. Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  blurDataURL={dataUrl}
/>
```

## Database Query Optimization

### 1. Avoid N+1 Queries

```typescript
// ❌ Bad - N+1 queries
const classes = await db.class.findMany()
for (const cls of classes) {
  cls.students = await db.student.findMany({
    where: { classId: cls.id },
  })
}

// ✅ Good - Single query with includes
const classes = await db.class.findMany({
  include: {
    students: true,
  },
})
```

### 2. Select Only Needed Fields

```typescript
// ❌ Bad - Fetches all columns
const users = await db.user.findMany()

// ✅ Good - Only needed fields
const users = await db.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
})
```

### 3. Pagination

```typescript
const PAGE_SIZE = 20

const items = await db.item.findMany({
  where: { schoolId },
  skip: (page - 1) * PAGE_SIZE,
  take: PAGE_SIZE,
  orderBy: { createdAt: "desc" },
})
```

### 4. Indexes

```prisma
model Student {
  schoolId String
  email    String
  status   String

  @@index([schoolId, status]) // Composite index
  @@index([email])
}
```

## Bundle Size Optimization

### 1. Tree Shaking

```typescript
// ❌ Bad - Imports entire library
import _ from "lodash"
// ✅ Good - Imports specific function
import debounce from "lodash/debounce"
```

### 2. Dynamic Imports

```typescript
// Heavy components loaded on demand
if (showChart) {
  const { Chart } = await import("./Chart")
}
```

### 3. Optimize Dependencies

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ["lodash", "date-fns", "@icons"],
  },
}
```

## Server Component Optimization

### 1. Streaming

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SlowComponent />
    </Suspense>
  )
}
```

### 2. Parallel Data Fetching

```typescript
// ❌ Sequential
const user = await getUser()
const posts = await getPosts()

// ✅ Parallel
const [user, posts] = await Promise.all([getUser(), getPosts()])
```

### 3. Request Memoization

```typescript
import { cache } from "react"

const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } })
})
```

## Caching Strategies

### 1. Static Generation

```typescript
// Cached at build time
export const dynamic = "force-static"
```

### 2. Incremental Static Regeneration

```typescript
export const revalidate = 3600 // Revalidate every hour
```

### 3. Client-Side Caching (SWR)

```typescript
import useSWR from "swr"

function Profile() {
  const { data, error } = useSWR("/api/user", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
}
```

## Performance Monitoring

### 1. Web Vitals

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 2. Custom Performance Marks

```typescript
performance.mark("myFeature-start")
// ... feature code ...
performance.mark("myFeature-end")
performance.measure("myFeature", "myFeature-start", "myFeature-end")
```

## Performance Checklist

### React

- [ ] Components memoized where appropriate
- [ ] useCallback/useMemo for expensive operations
- [ ] Virtual scrolling for long lists
- [ ] Lazy loading for below-fold content
- [ ] Debounced/throttled event handlers

### Database

- [ ] No N+1 queries
- [ ] Proper indexes in place
- [ ] Pagination implemented
- [ ] Connection pooling configured
- [ ] Query execution < 100ms

### Bundle

- [ ] Route bundles < 100KB
- [ ] Code splitting implemented
- [ ] Tree shaking working
- [ ] No duplicate dependencies
- [ ] Images optimized

### Server

- [ ] Streaming enabled
- [ ] Parallel data fetching
- [ ] Edge runtime where appropriate
- [ ] CDN caching configured
- [ ] Compression enabled

### Monitoring

- [ ] Core Web Vitals tracked
- [ ] Error boundaries in place
- [ ] Performance budgets set
- [ ] Alerts configured
- [ ] Regular performance audits
