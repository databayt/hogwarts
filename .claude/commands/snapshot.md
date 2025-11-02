# Snapshot Command - Visual UI Testing

Generate and validate visual snapshots for UI components using Playwright

## Usage
```bash
/snapshot [component|page|all] [options]
```

## Examples
```bash
/snapshot StudentCard              # Snapshot specific component
/snapshot /students                 # Snapshot page route
/snapshot all --update             # Update all snapshots
/snapshot StudentForm --mobile     # Mobile viewport snapshot
```

## Process

### 1. Identify Target
- Parse command arguments to determine what to snapshot
- Locate component or page files
- Check for existing snapshots

### 2. Generate Snapshot Test
```typescript
// Generate test file
import { test, expect } from '@playwright/test';

test.describe('Visual Snapshots: ${componentName}', () => {
  test('default state', async ({ page }) => {
    await page.goto('/components/${componentName}');
    await expect(page).toHaveScreenshot('${componentName}-default.png');
  });

  test('hover state', async ({ page }) => {
    await page.goto('/components/${componentName}');
    await page.hover('[data-testid="${componentName}"]');
    await expect(page).toHaveScreenshot('${componentName}-hover.png');
  });

  test('mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/components/${componentName}');
    await expect(page).toHaveScreenshot('${componentName}-mobile.png');
  });
});
```

### 3. Run Snapshot Tests
```bash
# Execute Playwright snapshot tests
pnpm playwright test --project=chromium --grep="Visual Snapshots"

# Update snapshots if --update flag
pnpm playwright test --update-snapshots
```

### 4. Multi-Browser Testing
- Chrome/Chromium (default)
- Firefox (cross-browser)
- Safari/WebKit (macOS)
- Mobile viewports (responsive)

### 5. Accessibility Snapshots
```typescript
// Include accessibility tree snapshot
const accessibilitySnapshot = await page.accessibility.snapshot();
await expect(accessibilitySnapshot).toMatchSnapshot('${componentName}-a11y.json');
```

### 6. Dark Mode Snapshots
```typescript
// Test both light and dark themes
test('dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/components/${componentName}');
  await expect(page).toHaveScreenshot('${componentName}-dark.png');
});
```

## Options

### Flags
- `--update`: Update existing snapshots
- `--mobile`: Include mobile viewports
- `--a11y`: Include accessibility snapshots
- `--dark`: Include dark mode snapshots
- `--all-browsers`: Test all browsers
- `--diff`: Show visual diff for failures

### Viewport Presets
- `desktop`: 1920x1080
- `laptop`: 1366x768
- `tablet`: 768x1024
- `mobile`: 375x667

## Integration with Hogwarts Platform

### Component Library Snapshots
```bash
# Snapshot all shadcn/ui components
/snapshot components/ui/* --update

# Specific platform components
/snapshot StudentCard TeacherCard ClassroomCard
```

### Critical Page Snapshots
```bash
# Snapshot key pages
/snapshot /dashboard /students /teachers /exams
```

### Multi-Language Snapshots
```bash
# Test Arabic RTL layout
/snapshot StudentForm --lang=ar

# Test English LTR layout
/snapshot StudentForm --lang=en
```

## Validation Rules

### Snapshot Comparison
1. Pixel-perfect matching (strict mode)
2. Threshold matching (5% tolerance)
3. Layout shift detection
4. Color contrast validation
5. Text rendering consistency

### Failure Handling
```typescript
// On snapshot mismatch
1. Generate diff image
2. Save actual vs expected
3. Create HTML report
4. Suggest fixes
```

## Storage Structure
```
tests/
  snapshots/
    StudentCard/
      StudentCard-default-chromium.png
      StudentCard-hover-chromium.png
      StudentCard-mobile-chromium.png
      StudentCard-dark-chromium.png
      StudentCard-a11y.json
    __diff_output__/
      StudentCard-default-diff.png
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Visual Regression Tests
  run: |
    pnpm playwright install
    pnpm /snapshot all

- name: Upload Snapshots
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: snapshot-diffs
    path: tests/snapshots/__diff_output__
```

### Pre-Commit Hook
```bash
# Validate changed components
/snapshot --changed-only
```

## Performance Considerations

### Optimization
- Parallel snapshot generation
- Cached browser instances
- Smart diffing algorithm
- Compressed image storage

### Benchmarks
- Single component: ~2s
- Full page: ~5s
- Component library: ~30s
- All pages: ~2min

## Error Recovery

### Common Issues
1. **Timing issues**: Add wait conditions
2. **Flaky elements**: Mask dynamic content
3. **Font loading**: Wait for fonts
4. **Animations**: Disable for snapshots

### Retry Logic
```typescript
test.describe.configure({
  retries: 2,
  timeout: 30000
});
```

## Success Metrics
- 100% component coverage
- <1% false positives
- 5s average snapshot time
- Automated PR checks

## Related Commands
- `/test`: Generate unit tests
- `/e2e`: Generate E2E tests
- `/lighthouse`: Performance testing