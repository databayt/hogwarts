# Issues - Dashboard Component

## 🔴 Critical Issues (Fix Immediately)

### 1. Missing Dictionary Props
**Location**: `app/[lang]/(operator)/dashboard/page.tsx`

**Problem**: The dashboard page doesn't pass the dictionary to the content component, breaking i18n support.

**Current**:
```typescript
// page.tsx
export default function DashboardPage() {
  return <DashboardContent />;
}
```

**Fix**:
```typescript
export default async function DashboardPage({ params }: { params: { lang: string } }) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <DashboardContent
    dictionary={dictionary.operator.dashboard}
    lang={lang}
  />;
}
```

### 2. Hardcoded Test Data in Production
**Location**: `bar-graph.tsx`

**Problem**: Contains 100+ lines of hardcoded test data and a intentional error for testing:
```typescript
// Line 209-210: TESTING CODE IN PRODUCTION!
useEffect(() => {
  if (activeChart === 'error') {
    throw new Error('Mocking Error');
  }
}, [activeChart]);
```

**Fix**: Remove test code and fetch real data from server

### 3. Hydration Mismatch Risk
**Location**: Multiple chart components

**Problem**: Using client-side only rendering causing hydration issues:
```typescript
const [isClient, setIsClient] = useState(false);
useEffect(() => {
  setIsClient(true);
}, []);
if (!isClient) return null;
```

**Fix**: Use Next.js dynamic imports with `ssr: false`:
```typescript
const BarGraph = dynamic(() => import('./bar-graph'), {
  ssr: false,
  loading: () => <BarGraphSkeleton />
});
```

## 🟡 High Priority Issues (Fix Soon)

### 4. No Error Boundaries
**Problem**: Chart failures crash the entire dashboard

**Solution**:
```typescript
// lab/error.tsx
'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Error</CardTitle>
        <CardDescription>Failed to load dashboard data</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset}>Try again</Button>
      </CardContent>
    </Card>
  );
}
```

### 5. Inefficient Data Fetching
**Location**: `content.tsx`

**Problem**: No caching, fetches all data on every load

**Fix**: Implement caching strategy:
```typescript
import { unstable_cache } from 'next/cache';

const getCachedMetrics = unstable_cache(
  async () => {
    const [totalSchools, activeSchools] = await Promise.all([
      db.school.count(),
      db.school.count({ where: { isActive: true } })
    ]);
    return { totalSchools, activeSchools };
  },
  ['lab-metrics'],
  {
    revalidate: 60, // Cache for 1 minute
    tags: ['lab']
  }
);
```

### 6. Missing Real-Time Updates
**Problem**: Dashboard doesn't update without refresh

**Implement**: WebSocket or Server-Sent Events
```typescript
// lib/lab-stream.ts
export function createDashboardStream() {
  return new ReadableStream({
    start(controller) {
      const interval = setInterval(async () => {
        const metrics = await getLatestMetrics();
        controller.enqueue(`data: ${JSON.stringify(metrics)}\n\n`);
      }, 5000);

      return () => clearInterval(interval);
    }
  });
}
```

### 7. No Data Export
**Problem**: Cannot export dashboard data or charts

**Add export actions**:
```typescript
export async function exportDashboard(format: 'pdf' | 'csv' | 'png') {
  switch(format) {
    case 'pdf':
      return generatePDFReport();
    case 'csv':
      return generateCSVData();
    case 'png':
      return captureChartImages();
  }
}
```

## 🟢 Low Priority Issues (Nice to Have)

### 8. Limited Chart Interactions
**Problem**: Charts lack zoom, pan, drill-down capabilities

**Enhance with**:
- Zoom/pan controls
- Click-through to detailed views
- Data point annotations
- Export individual charts

### 9. No Customization Options
**Problem**: Fixed layout, no user preferences

**Add**:
- Widget arrangement
- Metric selection
- Color theme preferences
- Time zone settings

### 10. Missing Comparison Views
**Problem**: Cannot compare periods side-by-side

**Implement**:
```typescript
interface ComparisonData {
  current: MetricData;
  previous: MetricData;
  change: {
    absolute: number;
    percentage: number;
  };
}
```

## Performance Issues

### Chart Rendering Performance
**Problem**: Multiple charts causing lag on low-end devices

**Solutions**:
1. Lazy load charts below the fold
2. Use Canvas instead of SVG for large datasets
3. Implement virtualization for data points
4. Reduce animation complexity on mobile

### Database Query Optimization
**Missing indexes**:
```sql
CREATE INDEX idx_schools_active_created ON schools(isActive, createdAt DESC);
CREATE INDEX idx_users_created_date ON users(DATE(createdAt));
CREATE INDEX idx_students_school_active ON students(schoolId) WHERE isActive = true;
```

### Memory Leaks
**Location**: Chart components with event listeners

**Problem**: Not cleaning up properly
```typescript
// Current (leaks memory)
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup!
});

// Fixed
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## TypeScript Issues

### Missing Type Safety
- Chart data using `any[]`
- No type guards for API responses
- Missing error type definitions

**Implement proper types**:
```typescript
type ChartData<T = unknown> = {
  labels: string[];
  datasets: Dataset<T>[];
};

type Dataset<T> = {
  label: string;
  data: T[];
  backgroundColor?: string;
  borderColor?: string;
};
```

## Accessibility Issues

### Screen Reader Support
- Charts have no text alternatives
- Missing ARIA live regions for updates
- Color-only status indicators

**Fix**:
```tsx
<div role="img" aria-label={`Chart showing ${description}`}>
  <BarChart />
  <span className="sr-only">{getChartTextDescription(data)}</span>
</div>
```

### Keyboard Navigation
- Period switcher not keyboard accessible
- Cannot navigate between chart data points
- No skip links for screen readers

## UI/UX Issues

### Mobile Experience
- Charts too small on mobile
- Overlapping labels
- No touch gestures
- Cards don't stack properly

**Mobile optimizations needed**:
```css
@media (max-width: 640px) {
  .chart-container {
    min-height: 300px;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
```

### Dark Mode Problems
- Chart grid lines invisible
- Poor contrast on data labels
- Gradient fills not theme-aware

**Fix with theme-aware colors**:
```typescript
const chartColors = {
  light: {
    grid: 'oklch(0.922 0 0)',
    text: 'oklch(0.156 0 0)'
  },
  dark: {
    grid: 'oklch(0.3 0 0)',
    text: 'oklch(0.837 0 0)'
  }
};
```

## Security Considerations

### Missing Rate Limiting
Dashboard queries can overwhelm the database

**Add rate limiting**:
```typescript
const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many lab requests'
});
```

### Sensitive Data Exposure
Financial data visible in browser DevTools

**Implement**:
- Data masking for non-admin users
- Audit logging for data exports
- Session timeout for idle users

## Testing Gaps

Missing tests for:
- Chart rendering with edge cases
- Period switching logic
- Data aggregation accuracy
- Loading states
- Error boundaries
- Mobile responsiveness

## Migration Plan

### Week 1: Critical Fixes
1. Fix dictionary passing (1 hour)
2. Remove test code from production (2 hours)
3. Fix hydration issues (4 hours)
4. Add error boundaries (2 hours)

### Week 2: Performance
1. Implement caching (1 day)
2. Add database indexes (2 hours)
3. Fix memory leaks (4 hours)
4. Optimize chart rendering (1 day)

### Week 3: Features
1. Add real-time updates (2 days)
2. Implement data export (1 day)
3. Add comparison views (1 day)

### Week 4: Polish
1. Fix accessibility issues (1 day)
2. Improve mobile experience (1 day)
3. Fix dark mode issues (4 hours)
4. Add comprehensive tests (2 days)

## Dependencies to Update

```json
{
  "recharts": "^2.15.0",  // Current, OK
  "@tanstack/react-virtual": "^3.0.0", // Add for virtualization
  "html2canvas": "^1.4.1", // Add for chart export
  "date-fns": "^4.1.0"  // Current, OK
}
```

## Monitoring Requirements

Track:
- Dashboard load time (P95 < 2s)
- Chart render time (P95 < 500ms)
- Data fetch time (P95 < 1s)
- Cache hit ratio (> 80%)
- Error rate (< 0.1%)

## Related Issues

- [Performance Monitoring](../observability/ISSUE.md)
- [Data Fetching Patterns](../lib/ISSUE.md)
- [Chart Components](../../../ui/chart/ISSUE.md)