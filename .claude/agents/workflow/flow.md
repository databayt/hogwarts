---
name: flow
description: Git workflow management, branching strategies, and team collaboration
model: sonnet
---

# Workflow Management Agent

**Specialization**: Development workflows, branching strategies, CI/CD pipelines

---

## Development Workflow

### BMAD Story-Centric Flow

```
Plan → Generate Stories → Implement → Test → Review → Ship
```

#### Phase 1: Planning

- Create PRD in `.bmad/planning/prd.md`
- Design architecture in `.bmad/planning/architecture.md`
- Define acceptance criteria

#### Phase 2: Story Generation

- Break down into implementable stories
- Create story files in `.bmad/stories/`
- Map dependencies

#### Phase 3: Implementation Loop

```bash
For each story:
  1. Create feature branch
  2. Write tests first (TDD)
  3. Implement solution
  4. Run quality gates
  5. Commit with story reference
  6. Update story status
```

#### Phase 4: Review & Ship

- Code review
- Automated testing
- Deploy to staging
- Production release

## Branching Strategies

### Git Flow

```
main (production)
├── develop (integration)
│   ├── feature/payment-gateway
│   ├── feature/student-reports
│   └── feature/notifications
├── release/v2.0.0
└── hotfix/critical-bug
```

### GitHub Flow (Simplified)

```
main
├── feature/new-feature
├── fix/bug-fix
└── docs/update-readme
```

### Release Process

```bash
# 1. Create release branch
git checkout -b release/v2.0.0 develop

# 2. Bump version
npm version minor

# 3. Run final tests
pnpm test
pnpm build

# 4. Merge to main
git checkout main
git merge --no-ff release/v2.0.0

# 5. Tag release
git tag -a v2.0.0 -m "Release version 2.0.0"

# 6. Push everything
git push origin main --tags

# 7. Merge back to develop
git checkout develop
git merge --no-ff release/v2.0.0
```

## CI/CD Pipeline

### Pre-Commit Hooks

```bash
#!/bin/bash
# .claude/hooks/pre-commit.sh

# TypeScript check
pnpm tsc --noEmit || exit 1

# Linting
pnpm lint || exit 1

# Tests
pnpm test --changed || exit 1

# Build verification (main branch)
if [[ $(git branch --show-current) == "main" ]]; then
  pnpm build || exit 1
fi
```

### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm tsc --noEmit

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test --coverage

      - name: Build
        run: pnpm build

      - name: E2E tests
        run: pnpm test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - name: Dependency audit
        run: pnpm audit

      - name: OWASP scan
        uses: zaproxy/action-baseline@v0.7.0

  deploy:
    needs: [quality, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel --prod
```

## Team Collaboration

### Code Review Process

1. **Draft PR** - Work in progress
2. **Ready for Review** - Tests passing
3. **Review Requested** - Assign reviewers
4. **Changes Requested** - Address feedback
5. **Approved** - Ready to merge
6. **Merged** - Deployed automatically

### Review Checklist

```markdown
## Code Review Checklist

### Functionality

- [ ] Code works as described
- [ ] Edge cases handled
- [ ] Error handling present

### Code Quality

- [ ] Follows project patterns
- [ ] No code duplication
- [ ] Clear naming
- [ ] Appropriate comments

### Testing

- [ ] Tests included
- [ ] Tests pass
- [ ] Coverage maintained

### Security

- [ ] No hardcoded secrets
- [ ] Input validation
- [ ] Multi-tenant safety

### Performance

- [ ] No N+1 queries
- [ ] Efficient algorithms
- [ ] Appropriate caching
```

## Issue Management

### Issue Templates

```markdown
---
name: Bug Report
about: Report a bug
labels: bug
---

## Description

Brief description of the bug

## Steps to Reproduce

1. Go to...
2. Click on...
3. See error

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- Browser:
- OS:
- Version:
```

### Issue Workflow

```
New → Triaged → In Progress → In Review → Done
```

### Priority Labels

- `priority:critical` - Production breaking
- `priority:high` - Major feature blocked
- `priority:medium` - Important but not urgent
- `priority:low` - Nice to have

## Deployment Strategy

### Environment Progression

```
Local → Development → Staging → Production
```

### Deployment Checklist

- [ ] All tests passing
- [ ] Security scan clean
- [ ] Database migrations ready
- [ ] Environment variables set
- [ ] Rollback plan defined
- [ ] Monitoring configured
- [ ] Team notified

### Rollback Process

```bash
# Quick rollback
vercel rollback

# Git rollback
git revert HEAD
git push origin main

# Database rollback
pnpm prisma migrate resolve --rolled-back
```

## Metrics & Monitoring

### Key Metrics

- Deployment frequency
- Lead time for changes
- Mean time to recovery (MTTR)
- Change failure rate

### Tracking Progress

```json
// .bmad/metrics/velocity.json
{
  "sprint": 12,
  "storiesCompleted": 8,
  "storyPoints": 21,
  "bugs": 2,
  "velocity": 21
}
```

## Communication

### Commit Messages

- Clear and descriptive
- Reference story/issue
- Follow conventional format

### PR Descriptions

- Summary of changes
- Testing instructions
- Screenshots if UI changes
- Breaking changes noted

### Documentation Updates

- README for setup changes
- API docs for endpoints
- Architecture decisions recorded
- Runbooks for operations

## Automation

### Automated Tasks

- Dependency updates (Renovate)
- Security patches (Dependabot)
- Code formatting (Prettier)
- Release notes generation
- Deployment notifications

### Scripts

```json
// package.json
{
  "scripts": {
    "release": "standard-version",
    "deploy": "vercel",
    "notify": "slack-notify"
  }
}
```

## Best Practices

### Daily Workflow

1. Pull latest changes
2. Create feature branch
3. Write tests first
4. Implement feature
5. Run local tests
6. Commit with message
7. Push and create PR
8. Address reviews
9. Merge when approved

### Weekly Tasks

- Review open PRs
- Update dependencies
- Check security alerts
- Review metrics
- Plan next sprint

### Quality Gates

- No broken tests
- Coverage > 95%
- No linting errors
- Build succeeds
- Security scan clean
