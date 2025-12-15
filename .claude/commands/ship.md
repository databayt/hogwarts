---
description: Complete deployment workflow with validation and testing
---

# Ship Command - Smart Deployment

Execute complete deployment pipeline with comprehensive validation, testing, and deployment.

## Usage

```bash
/ship [environment]
```

## Environments

- `staging` - Deploy to staging environment (default)
- `production` - Deploy to production (requires confirmation)
- `preview` - Deploy to preview branch

## Process

1. **Pre-Flight Checks**: Validate readiness
2. **Test Suite**: Run all tests
3. **Security Scan**: Check for vulnerabilities
4. **Build**: Production build with optimization
5. **Deploy**: Push to target environment
6. **Verify**: Health checks and monitoring
7. **Notify**: Update team and stakeholders

## Examples

```bash
# Deploy to staging (default)
/ship
/ship staging

# Deploy to production with confirmation
/ship production

# Deploy to preview environment
/ship preview

# Dry run without deploying
/ship staging --dry-run
```

## Pre-Flight Checks

### 1. Code Quality

- ✅ No uncommitted changes
- ✅ Branch up to date
- ✅ No merge conflicts

### 2. Tests

- ✅ Unit tests passing
- ✅ Integration tests passing
- ✅ E2E tests passing
- ✅ Coverage ≥ 95%

### 3. Build

- ✅ TypeScript compilation
- ✅ No build errors
- ✅ Bundle size acceptable

### 4. Security

- ✅ No vulnerable dependencies
- ✅ No security violations
- ✅ Secrets not exposed

## Deployment Pipeline

### Stage 1: Validation

```bash
# Check git status
git status

# Verify branch
git branch --show-current

# Check for updates
git fetch
git status -uno
```

### Stage 2: Test Execution

```bash
# Run test suite
pnpm test

# Run E2E tests
pnpm test:e2e

# Check coverage
pnpm test --coverage
```

### Stage 3: Security Scan

```bash
# Dependency audit
pnpm audit

# Security scan
/security-scan

# Secret scanning
git secrets --scan
```

### Stage 4: Build

```bash
# Production build
pnpm build

# Analyze bundle
ANALYZE=true pnpm build

# Verify build output
ls -la .next
```

### Stage 5: Deploy

```bash
# Staging deployment
vercel --env=staging

# Production deployment
vercel --prod

# With environment variables
vercel --prod --build-env KEY=value
```

### Stage 6: Verification

```bash
# Health check
curl https://app.domain.com/api/health

# Smoke tests
pnpm test:smoke

# Performance check
lighthouse https://app.domain.com
```

### Stage 7: Notification

```bash
# Update GitHub deployment
gh deployment create production

# Notify Slack
curl -X POST $SLACK_WEBHOOK -d '{
  "text": "Deployment successful to production"
}'

# Update issue tracker
gh issue comment 123 --body "Deployed to production"
```

## Environment-Specific Config

### Staging

```json
{
  "staging": {
    "url": "https://staging.databayt.org",
    "branch": "develop",
    "tests": ["unit", "integration"],
    "requireApproval": false
  }
}
```

### Production

```json
{
  "production": {
    "url": "https://ed.databayt.org",
    "branch": "main",
    "tests": ["unit", "integration", "e2e", "smoke"],
    "requireApproval": true,
    "notifications": ["slack", "email"]
  }
}
```

## Rollback Process

If deployment fails or issues detected:

```bash
# Quick rollback
vercel rollback

# Git-based rollback
git revert HEAD
git push
/ship production

# Database rollback
pnpm prisma migrate resolve --rolled-back
```

## Progress Display

```
═══════════════════════════════════════
🚢 DEPLOYMENT PIPELINE
═══════════════════════════════════════
Environment: Production
Branch: main
Version: v2.1.0

✅ Pre-flight checks
✅ Tests (1,234 passing)
✅ Security scan (0 vulnerabilities)
⏳ Building... (2/4 steps)
⏸️  Deploy
⏸️  Verify
⏸️  Notify

Progress: ████████░░░░░░░░░░░░ 40%
Time: 3m 45s
═══════════════════════════════════════
```

## Deployment Checklist

### Before Deployment

- [ ] All stories in epic completed
- [ ] Code reviewed and approved
- [ ] Tests passing with good coverage
- [ ] No security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Database migrations ready

### During Deployment

- [ ] Monitor deployment logs
- [ ] Watch error rates
- [ ] Check performance metrics
- [ ] Verify functionality
- [ ] Run smoke tests

### After Deployment

- [ ] Verify application health
- [ ] Check user-facing features
- [ ] Monitor error tracking
- [ ] Review performance metrics
- [ ] Update status page
- [ ] Notify stakeholders

## Error Handling

### Build Failures

1. Check TypeScript errors
2. Verify dependencies
3. Clear cache and rebuild
4. Check environment variables

### Deployment Failures

1. Check deployment logs
2. Verify credentials
3. Check network connectivity
4. Review platform status

### Post-Deploy Issues

1. Check error monitoring
2. Review application logs
3. Verify database connectivity
4. Check external services

## Implementation

```typescript
// Complete deployment pipeline
await invokeAgent("/agents/workflow/git", {
  task: "ensure-clean-state",
})

await invokeAgent("/agents/quality/test", {
  task: "run-all-tests",
})

await invokeAgent("/agents/quality/secure", {
  task: "security-audit",
})

await invokeAgent("/agents/devtools/build", {
  task: "production-build",
})

await deployToEnvironment(environment)

await verifyDeployment(environment)

await notifyStakeholders(environment)
```

## Metrics Tracked

### Deployment Metrics

- Deployment frequency
- Lead time for changes
- Mean time to recovery
- Change failure rate
- Deployment duration

### Quality Metrics

- Test pass rate
- Coverage percentage
- Build success rate
- Security score
- Performance score

## Configuration

```json
{
  "ship": {
    "environments": {
      "staging": {
        "autoApprove": true,
        "runE2E": false,
        "notifySlack": false
      },
      "production": {
        "autoApprove": false,
        "runE2E": true,
        "notifySlack": true,
        "requireTwoFactorAuth": true
      }
    },
    "checks": {
      "minCoverage": 95,
      "maxBundleSize": "500KB",
      "allowedVulnerabilities": 0
    },
    "rollback": {
      "automatic": true,
      "errorThreshold": 0.01
    }
  }
}
```

## Success Criteria

✅ All pre-flight checks pass
✅ Test suite passes (100%)
✅ Security scan clean
✅ Build successful
✅ Deployment successful
✅ Health checks pass
✅ Stakeholders notified

## Tips

- Always deploy to staging first
- Use feature flags for gradual rollout
- Monitor metrics after deployment
- Have rollback plan ready
- Document deployment process
- Automate everything possible
