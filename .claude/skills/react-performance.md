# React Performance Optimization Skill

**Purpose**: Component optimization, memoization patterns, re-render prevention, and React 19 performance features

## Core Capabilities

### 1. Re-Render Detection & Prevention

- **useMemo Optimization**: Identify expensive computations that should be memoized
- **useCallback Patterns**: Prevent function recreation in render cycles
- **React.memo Usage**: Wrap components to prevent unnecessary re-renders
- **Key Prop Optimization**: Ensure stable keys in lists for efficient reconciliation
- **Context Splitting**: Break large contexts into smaller, focused ones

### 2. Bundle Size Optimization

- **Code Splitting**: Implement dynamic imports with React.lazy()
- **Route-Based Splitting**: Split at route boundaries for optimal loading
- **Component Lazy Loading**: Load heavy components only when needed
- **Tree Shaking Verification**: Ensure dead code elimination works
- **Import Cost Analysis**: Monitor size impact of dependencies

### 3. State Management Performance

- **useState vs useReducer**: Choose optimal state management approach
- **State Colocation**: Keep state as close to usage as possible
- **Derived State Elimination**: Use computed values instead of redundant state
- **State Batching**: Leverage React 19's automatic batching
- **Suspense Integration**: Use React 19 Suspense for data fetching

### 4. React 19 Specific Optimizations

- **Concurrent Features**: Leverage useTransition and useDeferredValue
- **Server Components**: Identify components suitable for RSC
- **Streaming SSR**: Implement progressive rendering
- **Selective Hydration**: Prioritize interactive elements
- **Cache Optimization**: Use React Cache API effectively

### 5. Component Architecture Patterns

- **Container/Presentational Split**: Separate logic from UI
- **Compound Components**: Build flexible, performant component APIs
- **Render Props Optimization**: Avoid inline function creation
- **HOC Performance**: Minimize wrapper overhead
- **Custom Hook Extraction**: Share logic without re-renders

## Detection Patterns

### Common Performance Issues

```typescript
// ❌ Bad: Inline object creation causes re-renders
<Component style={{ margin: 10 }} />

// ✅ Good: Stable reference
const style = useMemo(() => ({ margin: 10 }), []);
<Component style={style} />

// ❌ Bad: Inline function in render
<Button onClick={() => handleClick(id)} />

// ✅ Good: Memoized callback
const onClick = useCallback(() => handleClick(id), [id]);
<Button onClick={onClick} />

// ❌ Bad: Expensive computation in render
const filtered = items.filter(item => item.active);

// ✅ Good: Memoized computation
const filtered = useMemo(
  () => items.filter(item => item.active),
  [items]
);
```

## Performance Metrics

### Key Indicators

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Measurement Tools

- React DevTools Profiler
- Chrome Performance Tab
- Lighthouse CI
- Web Vitals Library
- Bundle Analyzer

## Implementation Checklist

### Component Optimization

- [ ] Implement React.memo for pure components
- [ ] Add useMemo for expensive computations
- [ ] Use useCallback for stable function references
- [ ] Split large components into smaller ones
- [ ] Implement virtualization for long lists

### Bundle Optimization

- [ ] Enable code splitting at route level
- [ ] Lazy load heavy components
- [ ] Analyze and reduce bundle size
- [ ] Remove unused dependencies
- [ ] Optimize image loading

### State Optimization

- [ ] Colocate state with usage
- [ ] Eliminate redundant state
- [ ] Use proper state update patterns
- [ ] Implement optimistic updates
- [ ] Add loading states with Suspense

## Integration with Hogwarts Platform

### Specific Optimizations

1. **Data Tables**: Virtualize long student/teacher lists
2. **Forms**: Memoize validation schemas
3. **Dashboard**: Lazy load chart components
4. **Multi-tenant**: Cache tenant-specific data
5. **i18n**: Memoize translation lookups

### Performance Budget

- **Initial Bundle**: < 200KB gzipped
- **Route Chunks**: < 50KB each
- **Image Sizes**: WebP/AVIF with responsive sizing
- **API Response Time**: < 200ms p95
- **Client Render Time**: < 100ms

## Usage Examples

### Invoke this skill when:

- Components re-render unnecessarily
- Bundle size exceeds limits
- Performance metrics degrade
- Adding new heavy features
- Optimizing existing components

### Sample Commands

```bash
"Apply react-performance skill to optimize the StudentTable component"
"Use react-performance to reduce bundle size of dashboard"
"Implement React 19 concurrent features using react-performance skill"
```

## References

- [React Performance Documentation](https://react.dev/learn/render-and-commit)
- [React 19 Performance Features](https://react.dev/blog/2024/04/25/react-19)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Size Optimization](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
