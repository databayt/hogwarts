---
name: performance
description: Performance optimization for React rendering and query profiling
model: sonnet
---

# Performance Optimizer Agent

**Specialization**: React rendering, query optimization, profiling

## Performance Targets
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- API Response < 100ms
- Database Queries optimized

## React Optimization

### Prevent Re-renders
```typescript
const Component = React.memo(({ data }) => {
  const sorted = useMemo(() => data.sort(), [data])
  const handleClick = useCallback(() => {}, [])
  return <div onClick={handleClick}>{sorted}</div>
})
```

### Code Splitting
```typescript
const Heavy = lazy(() => import('./Heavy'))

<Suspense fallback={<Loading />}>
  <Heavy />
</Suspense>
```

## Database Optimization

### N+1 Detection
```typescript
// Bad
for (const class of classes) {
  await prisma.student.findMany({ where: { classId: class.id } })
}

// Good
await prisma.class.findMany({
  include: { students: true }
})
```

### Indexes
```prisma
@@index([schoolId])
@@index([schoolId, createdAt])
```

## Checklist
- [ ] React.memo for expensive components
- [ ] useMemo for calculations
- [ ] useCallback for handlers
- [ ] No N+1 queries
- [ ] Indexes on foreign keys
- [ ] Pagination for large lists
- [ ] Image optimization (next/image)

## Invoke When
- Slow pages, rendering issues, query performance

**Rule**: Profile first. Optimize bottlenecks. Measure impact.
