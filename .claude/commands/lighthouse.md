# Lighthouse Command - Core Web Vitals & Performance Scoring

Run Lighthouse CI for performance, accessibility, best practices, and SEO audits

## Usage
```bash
/lighthouse [url|route|all] [options]
```

## Examples
```bash
/lighthouse /lab              # Audit lab page
/lighthouse https://ed.databayt.org # Audit production URL
/lighthouse all --mobile            # Audit all routes mobile
/lighthouse /students --budget      # Check performance budget
```

## Process

### 1. Lighthouse Configuration
```javascript
// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1
        },
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }]
      }
    }
  }
};
```

### 2. Core Web Vitals Metrics

#### LCP (Largest Contentful Paint)
```typescript
// Target: < 2.5s (Good), < 4s (Needs Improvement)
const lcpOptimizations = [
  'Optimize images (WebP/AVIF)',
  'Preload critical resources',
  'Reduce server response time',
  'Use CDN for assets'
];
```

#### FID (First Input Delay) / INP (Interaction to Next Paint)
```typescript
// Target: < 100ms (Good), < 300ms (Needs Improvement)
const fidOptimizations = [
  'Break up long tasks',
  'Use web workers',
  'Reduce JavaScript execution',
  'Optimize event handlers'
];
```

#### CLS (Cumulative Layout Shift)
```typescript
// Target: < 0.1 (Good), < 0.25 (Needs Improvement)
const clsOptimizations = [
  'Set image dimensions',
  'Reserve space for ads',
  'Avoid inserting content above fold',
  'Use CSS transforms for animations'
];
```

### 3. Performance Scoring

#### Categories
```typescript
const categories = {
  performance: {
    weight: 100,
    metrics: ['FCP', 'LCP', 'TBT', 'CLS', 'SI']
  },
  accessibility: {
    weight: 100,
    audits: ['aria', 'color-contrast', 'heading-order']
  },
  bestPractices: {
    weight: 100,
    audits: ['https', 'console-errors', 'image-aspect-ratio']
  },
  seo: {
    weight: 100,
    audits: ['meta-description', 'title', 'structured-data']
  }
};
```

### 4. Hogwarts Platform Specific Audits

#### Multi-Tenant Performance
```typescript
// Check subdomain routing performance
const tenantAudits = {
  subdomainRedirect: 'Time to redirect from subdomain',
  tenantDataFetch: 'Time to fetch school-specific data',
  sessionValidation: 'Auth check performance'
};
```

#### Arabic/English Support
```typescript
// RTL/LTR layout performance
const i18nAudits = {
  fontLoading: 'Arabic/English font load time',
  rtlRender: 'RTL layout shift',
  translationLoad: 'Dictionary fetch time'
};
```

#### Education-Specific Metrics
```typescript
const educationMetrics = {
  dashboardLoad: 'Time to interactive lab',
  studentListRender: 'Large table render time',
  formValidation: 'Complex form interaction',
  reportGeneration: 'PDF generation time'
};
```

### 5. Device-Specific Testing

#### Mobile Configuration
```javascript
const mobileConfig = {
  formFactor: 'mobile',
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4
  },
  screenEmulation: {
    mobile: true,
    width: 412,
    height: 823,
    deviceScaleFactor: 1.75
  }
};
```

#### Desktop Configuration
```javascript
const desktopConfig = {
  formFactor: 'desktop',
  throttling: {
    rttMs: 40,
    throughputKbps: 10240,
    cpuSlowdownMultiplier: 1
  },
  screenEmulation: {
    mobile: false,
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1
  }
};
```

## Performance Budget

### Budget Configuration
```json
{
  "budgets": [
    {
      "path": "/*",
      "timings": [
        {
          "metric": "first-contentful-paint",
          "budget": 1000
        },
        {
          "metric": "largest-contentful-paint",
          "budget": 2500
        },
        {
          "metric": "time-to-interactive",
          "budget": 3800
        }
      ],
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 300
        },
        {
          "resourceType": "stylesheet",
          "budget": 100
        },
        {
          "resourceType": "image",
          "budget": 500
        },
        {
          "resourceType": "total",
          "budget": 1024
        }
      ],
      "resourceCounts": [
        {
          "resourceType": "third-party",
          "budget": 10
        }
      ]
    }
  ]
}
```

## Report Generation

### HTML Report
```bash
# Generate interactive HTML report
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

### JSON Report for CI
```bash
# Generate JSON for automated processing
lighthouse http://localhost:3000 --output json --output-path ./lighthouse-results.json
```

### Markdown Summary
```markdown
## Lighthouse Report - 2024-10-31

### Scores
- 🟢 Performance: 95/100
- 🟢 Accessibility: 98/100
- 🟢 Best Practices: 92/100
- 🟡 SEO: 88/100

### Core Web Vitals
- ✅ LCP: 2.1s (Good)
- ✅ FID: 45ms (Good)
- ✅ CLS: 0.05 (Good)

### Recommendations
1. Optimize images: Save 150KB
2. Remove unused CSS: Save 45KB
3. Add meta descriptions: 5 pages missing
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Lighthouse CI
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm build
      - run: pnpm start &
      - run: npx wait-on http://localhost:3000

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-report
          path: .lighthouseci/
```

### PR Comments
```typescript
// Auto-comment on PR with results
function generateComment(results) {
  return `
## 🚦 Lighthouse Results

| Metric | Score | Status |
|--------|-------|--------|
| Performance | ${results.performance} | ${getStatus(results.performance)} |
| Accessibility | ${results.accessibility} | ${getStatus(results.accessibility)} |
| Best Practices | ${results.bestPractices} | ${getStatus(results.bestPractices)} |
| SEO | ${results.seo} | ${getStatus(results.seo)} |

### Core Web Vitals
- LCP: ${results.lcp}ms
- FID: ${results.fid}ms
- CLS: ${results.cls}

[View full report](${results.reportUrl})
  `;
}
```

## Optimization Recommendations

### Automated Fixes
```typescript
// Apply recommended optimizations
function applyOptimizations(report) {
  const optimizations = [];

  // Image optimization
  if (report.audits['uses-webp-images'].score < 1) {
    optimizations.push('Convert images to WebP');
  }

  // Font optimization
  if (report.audits['font-display'].score < 1) {
    optimizations.push('Add font-display: swap');
  }

  // JavaScript optimization
  if (report.audits['unused-javascript'].score < 1) {
    optimizations.push('Remove unused JavaScript');
  }

  return optimizations;
}
```

## Tracking & History

### Score Tracking
```typescript
// Track scores over time
const scoreHistory = {
  date: new Date().toISOString(),
  commit: process.env.GITHUB_SHA,
  scores: {
    performance: 95,
    accessibility: 98,
    bestPractices: 92,
    seo: 88
  },
  metrics: {
    lcp: 2100,
    fid: 45,
    cls: 0.05
  }
};

// Store in database or JSON file
await saveScoreHistory(scoreHistory);
```

### Trend Analysis
```typescript
// Analyze performance trends
function analyzeTrends(history) {
  const trend = {
    performance: calculateTrend(history.map(h => h.scores.performance)),
    improving: trend > 0,
    alert: anyScoreBelow(history.latest, thresholds)
  };

  return trend;
}
```

## Success Metrics
- All scores > 90/100
- LCP < 2.5s on all pages
- Zero accessibility violations
- Mobile score within 10% of desktop
- Consistent scores across deployments

## Related Commands
- `/benchmark`: Detailed performance testing
- `/optimize`: Apply performance fixes
- `/snapshot`: Visual regression testing