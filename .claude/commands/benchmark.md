# Benchmark Command - Performance Testing

Run performance benchmarks on components, functions, and API endpoints

## Usage
```bash
/benchmark [target] [options]
```

## Examples
```bash
/benchmark StudentTable             # Benchmark component render
/benchmark api/students             # Benchmark API endpoint
/benchmark utils/calculate --iterations=1000  # Benchmark function
/benchmark all --compare=main      # Compare with main branch
```

## Process

### 1. Identify Benchmark Target
- Component render performance
- Function execution time
- API response time
- Database query performance
- Bundle size impact

### 2. Generate Benchmark Suite
```typescript
// benchmark/StudentTable.bench.ts
import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import { StudentTable } from '@/components/platform/students/table';

describe('StudentTable Performance', () => {
  bench('render with 100 students', () => {
    render(<StudentTable data={generateStudents(100)} />);
  });

  bench('render with 1000 students', () => {
    render(<StudentTable data={generateStudents(1000)} />);
  });

  bench('sort by name', () => {
    const table = render(<StudentTable data={generateStudents(100)} />);
    table.rerender(<StudentTable data={generateStudents(100)} sortBy="name" />);
  });
});
```

### 3. Performance Metrics

#### Component Metrics
```typescript
const metrics = {
  renderTime: 'Time to first render',
  rerenderTime: 'Time for updates',
  memoryUsage: 'Heap size delta',
  componentCount: 'React component instances',
  domNodes: 'DOM node count'
};
```

#### Function Metrics
```typescript
bench('function performance', () => {
  // Measure:
  // - Execution time (ms)
  // - CPU cycles
  // - Memory allocation
  // - Garbage collection impact
}, {
  iterations: 1000,
  warmup: 100
});
```

#### API Metrics
```typescript
const apiMetrics = {
  responseTime: 'Total response time',
  ttfb: 'Time to first byte',
  throughput: 'Requests per second',
  p50: '50th percentile latency',
  p95: '95th percentile latency',
  p99: '99th percentile latency'
};
```

### 4. Database Query Benchmarks
```typescript
bench('fetch students with relations', async () => {
  await db.student.findMany({
    where: { schoolId },
    include: {
      guardian: true,
      classes: true,
      attendance: {
        take: 10
      }
    }
  });
});

// Analyze query plan
const explain = await db.$queryRaw`
  EXPLAIN ANALYZE
  SELECT * FROM "Student"
  WHERE "schoolId" = ${schoolId}
`;
```

### 5. Bundle Size Analysis
```typescript
// Measure bundle impact
import { analyzeBundle } from '@next/bundle-analyzer';

const analysis = await analyzeBundle({
  before: 'main',
  after: 'feature-branch',
  modules: ['StudentTable', 'dependencies']
});

// Report size changes
console.log(`
  Bundle size impact:
  - Main bundle: +${analysis.mainBundle}KB
  - Chunk size: +${analysis.chunkSize}KB
  - First load: +${analysis.firstLoad}KB
`);
```

## Benchmark Configuration

### Options
```typescript
interface BenchmarkOptions {
  iterations?: number;      // Number of runs (default: 100)
  warmup?: number;         // Warmup runs (default: 10)
  timeout?: number;        // Max time per test (default: 60s)
  compare?: string;        // Branch to compare against
  threshold?: number;      // Performance regression threshold (%)
  output?: 'json'|'html';  // Report format
}
```

### Performance Budget
```typescript
const performanceBudget = {
  components: {
    firstRender: 100,     // ms
    rerender: 50,        // ms
    memoryDelta: 5       // MB
  },
  api: {
    p50: 200,           // ms
    p95: 500,           // ms
    p99: 1000           // ms
  },
  bundle: {
    main: 200,          // KB gzipped
    firstLoad: 100,     // KB
    chunkSize: 50       // KB
  }
};
```

## Hogwarts Platform Benchmarks

### Critical Components
```bash
# Student list performance
/benchmark StudentTable --iterations=100

# Form validation speed
/benchmark StudentForm validation --iterations=1000

# Dashboard render time
/benchmark Dashboard --with-data
```

### API Endpoints
```bash
# Bulk operations
/benchmark api/students/bulk-create --payload=100

# Search performance
/benchmark api/search --query="complex filter"

# Multi-tenant queries
/benchmark api/students --with-tenant-isolation
```

### Database Operations
```bash
# N+1 query detection
/benchmark queries/student-with-classes --detect-n+1

# Index effectiveness
/benchmark queries/attendance-by-date --explain

# Transaction performance
/benchmark transactions/enrollment --concurrent=10
```

## Comparison & Regression Detection

### Branch Comparison
```typescript
// Compare with main branch
const comparison = {
  baseline: await runBenchmark('main'),
  current: await runBenchmark('HEAD'),

  regression: current.time > baseline.time * 1.1, // 10% threshold
  improvement: current.time < baseline.time * 0.9
};
```

### Historical Tracking
```typescript
// Store benchmark results
const history = {
  commit: gitCommitHash,
  timestamp: Date.now(),
  results: benchmarkResults,

  // Track trends
  trend: calculateTrend(last30Days)
};
```

## Report Generation

### HTML Report
```html
<!-- benchmark-report.html -->
<h1>Performance Benchmark Report</h1>
<table>
  <tr>
    <th>Component</th>
    <th>Baseline</th>
    <th>Current</th>
    <th>Change</th>
    <th>Status</th>
  </tr>
  <tr>
    <td>StudentTable</td>
    <td>45ms</td>
    <td>42ms</td>
    <td>-6.7%</td>
    <td>✅ Improved</td>
  </tr>
</table>
```

### JSON Output
```json
{
  "timestamp": "2024-10-31T10:00:00Z",
  "benchmarks": [
    {
      "name": "StudentTable",
      "metrics": {
        "renderTime": 42,
        "memoryUsage": 2.3,
        "componentCount": 156
      },
      "comparison": {
        "baseline": 45,
        "change": -6.7,
        "status": "improved"
      }
    }
  ]
}
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Benchmarks
  run: |
    pnpm /benchmark all --compare=main

- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v6
  with:
    script: |
      const report = require('./benchmark-report.json');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        body: generateBenchmarkComment(report)
      });
```

### Performance Gates
```typescript
// Fail CI if performance regresses
if (regression.detected) {
  console.error(`
    ❌ Performance regression detected:
    Component: ${regression.component}
    Metric: ${regression.metric}
    Change: +${regression.percentage}%
    Threshold: ${regression.threshold}%
  `);
  process.exit(1);
}
```

## Optimization Suggestions

### Automated Recommendations
```typescript
function analyzeResults(benchmark) {
  const suggestions = [];

  if (benchmark.renderTime > 100) {
    suggestions.push('Consider implementing React.memo()');
    suggestions.push('Check for unnecessary re-renders');
  }

  if (benchmark.bundleSize > 50) {
    suggestions.push('Consider code splitting');
    suggestions.push('Check for duplicate dependencies');
  }

  return suggestions;
}
```

## Success Metrics
- <100ms component render time
- <200ms API p50 latency
- <5% performance regression threshold
- 100% critical path coverage

## Related Commands
- `/optimize`: Apply performance optimizations
- `/snapshot`: Visual regression testing
- `/lighthouse`: Core Web Vitals testing