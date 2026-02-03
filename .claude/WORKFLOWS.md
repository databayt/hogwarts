# Development Workflows Guide

**Version**: 3.0 (Expanded)
**Last Updated**: 2025-10-31
**Platform**: Hogwarts School Automation Platform

---

## Overview

This guide documents the **automated TDD-first development workflows** for the Hogwarts platform. All workflows leverage the **35 specialized agents**, **22 commands**, and **7 skills** in the Claude Code automation suite.

**Philosophy**: Write tests first, let automation handle quality gates, focus on "vibe coding".

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [TDD Feature Development](#1-tdd-feature-development-workflow)
3. [Bug Fix Workflow](#2-bug-fix-workflow)
4. [Code Review Workflow](#3-code-review-workflow)
5. [Refactoring Workflow](#4-refactoring-workflow)
6. [Deployment Workflow](#5-deployment-workflow)
7. [Emergency Hotfix Workflow](#6-emergency-hotfix-workflow)
8. [Documentation-Only Workflow](#7-documentation-only-workflow)
9. [Quality Gates Reference](#quality-gates-reference)
10. [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Single-Command Workflows

```bash
# Feature development (TDD-first, full automation)
/feature "student attendance tracking"

# Comprehensive code review
/review

# Security audit
/security-scan

# Fix all code quality issues
/fix-all

# Deploy to environment
/deploy staging

# Generate tests
/test src/components/feature/**/*.tsx

# Check internationalization
/i18n-check

# Create component with boilerplate
/component StudentCard

# Create Next.js page
/page /s/[subdomain]/attendance

# Create server action
/api POST /attendance
```

### Agent Workflows

```bash
# Direct agent invocation for specific tasks
/agents/architecture -p "Design attendance tracking feature"
/agents/debug -p "Fix infinite loop in timetable"
/agents/docs-manager -p "Update README for attendance feature"
```

---

## 1. TDD Feature Development Workflow

**Use When**: Building new features from scratch

**Command**: `/feature "description"`

**Duration**: 60-120 minutes (automated)

**Philosophy**: Test-first development with automated quality gates

### Step-by-Step Process

#### Phase 1: Planning & Architecture (5 min)

```bash
/feature "student attendance tracking with calendar view and bulk actions"
```

**Automated Actions**:

1. **Architecture Agent**: Designs feature structure following mirror pattern
   - Route planning: `/s/[subdomain]/attendance`
   - Component structure: `src/components/platform/attendance/`
   - Database schema: Attendance model with schoolId
   - API endpoints: Server actions for CRUD operations

2. **Multi-Tenant Agent**: Verifies tenant isolation
   - Confirms schoolId in all queries
   - Validates unique constraints scoped by schoolId
   - Checks session-based authentication

3. **Security Agent**: Reviews security implications
   - Input validation requirements
   - Authorization checks (role-based access)
   - OWASP compliance planning

**Output**: Architecture design document with structure, models, and security checklist

---

#### Phase 2: TDD - Write Tests First (10 min)

**Automated Actions**: 4. **Test Agent**: Generates comprehensive test suite (RED state)

- **Unit Tests**: Component tests for AttendanceCalendar, AttendanceTable, AttendanceForm
- **Integration Tests**: Server action tests for markAttendance, getAttendance
- **E2E Tests** (if applicable): User flow tests for marking attendance
- **Target**: 95%+ coverage

5. **Run Tests**: Verify all tests fail (expected behavior for TDD)

**Output**: Comprehensive test suite in red state

**Example Test Structure**:

```typescript
// src/components/school-dashboard/attendance/content.test.tsx
describe("AttendanceContent", () => {
  it("should render attendance calendar", () => {
    // Test implementation
  })

  it("should allow bulk attendance marking", () => {
    // Test implementation
  })

  it("should filter by date range", () => {
    // Test implementation
  })
})

// src/components/school-dashboard/attendance/actions.test.ts
describe("markAttendance", () => {
  it("should mark student as present", async () => {
    // Test implementation - FAILS (not implemented yet)
  })

  it("should scope by schoolId", async () => {
    // Test implementation - FAILS
  })
})
```

---

#### Phase 3: Implementation (20-40 min - Iterative until GREEN)

**Automated Actions**: 6. **Tech Stack Agents** (parallel execution when possible):

- **React Agent**: Implements components (AttendanceCalendar, AttendanceTable, AttendanceForm)
- **Next.js Agent**: Creates pages, layouts, server components
- **Prisma Agent**: Updates database schema, creates migrations
- **TypeScript Agent**: Defines types, interfaces, validation
- **Tailwind Agent**: Applies styling with utility classes, RTL support
- **i18n Agent**: Adds Arabic and English translations

7. **API Agent**: Creates server actions with Zod validation

   ```typescript
   // actions.ts
   "use server"

   export async function markAttendance(data: FormData) {
     const session = await auth()
     const schoolId = session?.user?.schoolId

     const validated = attendanceSchema.parse(Object.fromEntries(data))

     await db.attendance.create({
       data: { ...validated, schoolId },
     })

     revalidatePath("/attendance")
   }
   ```

**Output**: Fully implemented feature with all files created

**File Structure Created**:

```
src/
├── app/[lang]/s/[subdomain]/(platform)/attendance/
│   ├── page.tsx                 # Main page
│   └── layout.tsx               # Layout
│
└── components/platform/attendance/
    ├── content.tsx              # Main UI
    ├── actions.ts               # Server actions
    ├── validation.ts            # Zod schemas
    ├── types.ts                 # TypeScript types
    ├── form.tsx                 # Form component
    ├── table.tsx                # Data table
    ├── columns.tsx              # Table columns
    ├── config.ts                # Static config
    └── *.test.tsx               # Tests
```

---

#### Phase 4: Test Validation (Iterative - Loop until PASS)

**Automated Actions**: 8. **Run Tests**: Execute test suite

```bash
pnpm test src/components/school-dashboard/attendance/**/*.test.tsx
```

9. **If Tests Fail**:
   - **Debug Agent**: Analyzes failures using 5 Whys technique
   - **Relevant Tech Agent**: Fixes issues based on analysis
   - **Return to Step 8**: Re-run tests

10. **If Tests Pass**: Proceed to Phase 5

**Example Iteration**:

```
Iteration 1:
- 15 tests run, 3 failed
- Debug Agent identifies missing schoolId in query
- Prisma Agent fixes query
- Re-run tests

Iteration 2:
- 15 tests run, 0 failed ✓
- Coverage: 97.3% (exceeds 95% target) ✓
- Proceed to Phase 5
```

**Output**: All tests passing, 95%+ coverage achieved

---

#### Phase 5: Comprehensive Review (10 min - REFACTOR)

**Automated Actions**: 11. **Parallel Review Execution** (10 agents):

- **Architecture Agent**: Pattern enforcement (mirror pattern compliant)
- **Security Agent**: Security violations (OWASP compliance)
- **Performance Agent**: Performance issues (no N+1 queries, proper memoization)
- **Typography Agent**: Semantic HTML enforcement (no hardcoded text-_/font-_)
- **Multi-Tenant Agent**: Tenant isolation (all queries have schoolId)
- **React Reviewer Agent**: React best practices (hooks usage, composition)
- **TypeScript Agent**: Type safety (no any, strict mode)
- **Tailwind Agent**: Class order, RTL support, cn() usage
- **i18n Agent**: Translation completeness (100% coverage)
- **Auto-fix**: Prettier/ESLint (via PostToolUse hooks)

**Review Checklist**:

- ✅ Mirror pattern compliance (route ↔ component)
- ✅ Component hierarchy (UI → Atoms → Feature)
- ✅ Multi-tenant safety (schoolId in ALL queries)
- ✅ Security (input validation, XSS prevention, CSRF protection)
- ✅ Performance (memoization, code splitting)
- ✅ Typography (semantic HTML only)
- ✅ Tailwind (class order, RTL support)
- ✅ TypeScript (no any, explicit types)
- ✅ i18n (Arabic & English translations)
- ✅ Accessibility (ARIA labels, keyboard navigation)

**Output**: Comprehensive review report with violations categorized by severity

---

#### Phase 6: Build Verification (Iterative - Loop until PASS)

**Automated Actions**: 12. **Next.js Agent**: Run production build

```bash
pnpm build
```

13. **If Build Fails**:

- **Next.js Agent**: Analyzes build errors
- **Relevant Tech Agent**: Fixes issues (type errors, missing imports, etc.)
- **Return to Step 12**: Re-run build

14. **If Build Passes**: Proceed to Phase 7

**Build Checklist**:

- ✅ TypeScript compilation passes (no type errors)
- ✅ Linting passes (ESLint)
- ✅ No circular dependencies
- ✅ Bundle size within limits
- ✅ All imports resolved

**Output**: Successful production build

---

#### Phase 7: Commit & Push (with Smart Blocking)

**Automated Actions**: 15. **Git-GitHub Agent**:

- Creates conventional commit message
- Commits changes
- Pushes to remote

**Smart Blocking** (via PreToolUse hooks):

- **Main/master/production branches**: BLOCKS if quality checks fail
  - Pre-Commit: tests, eslint, tsc
  - Pre-Push: build, prettier
- **Feature branches**: WARNS but allows commit/push

**Example Commit**:

```bash
feat(attendance): Add student attendance tracking with calendar view

- Implement attendance calendar component
- Add bulk attendance marking
- Create server actions with schoolId scoping
- Add Arabic/English translations
- Achieve 97.3% test coverage

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Output**: Code committed and pushed to remote

---

#### Phase 8: Documentation (Automated)

**Automated Actions**: 16. **Docs Manager Agent**:

- Updates feature-based README: `src/components/platform/attendance/README.md`
- Creates GitHub issue: #123 "Feature: Student Attendance Tracking"
- Updates main README.md (if significant feature)
- Generates changelog entry in CHANGELOG.md

**README Template Includes**:

- Feature overview
- Architecture diagram (ASCII art)
- File structure
- API reference (server actions)
- Usage examples
- Internationalization details
- Security checklist
- Performance optimizations
- Testing coverage
- Dependencies
- Troubleshooting guide

**GitHub Issue Includes**:

- Feature description
- Implementation details
- Technical stack
- Security checklist
- Performance metrics
- i18n coverage
- Test coverage
- Related issues/PRs
- Screenshots (if UI feature)

**Output**: Comprehensive documentation and GitHub issue tracking

---

### Success Metrics

**Expected Output**:

```
🎉 Feature Development Complete!

Summary:
- 🧪 Tests: 15 passed (97.3% coverage)
- 📦 Build: Success
- 🔒 Security: No violations
- 🌍 i18n: 100% coverage (Arabic & English)
- ⚡ Performance: Optimized
- 📝 Docs: Updated (README + Issue #123)

Next Steps:
- Create pull request: gh pr create
- Deploy to staging: /deploy staging
```

**Time Savings**: 10x faster than manual development

---

## 2. Bug Fix Workflow

**Use When**: Fixing bugs, errors, or unexpected behavior

**Duration**: 15-45 minutes

**Command**: Direct agent invocation or manual steps

### Step-by-Step Process

#### Step 1: Reproduce & Debug (5-10 min)

```bash
# Use debug agent for systematic analysis
/agents/debug -p "Fix infinite loop in timetable rendering causing browser freeze"
```

**Debug Agent Actions**:

1. **Reproduce the issue**: Identify steps to trigger the bug
2. **5 Whys Analysis**: Root cause investigation
3. **Identify affected code**: File and line number references
4. **Propose solution**: Fix strategy

**Example 5 Whys**:

```
Bug: Infinite loop in timetable rendering

Why 1: Why does the loop happen?
→ useEffect runs infinitely

Why 2: Why does useEffect run infinitely?
→ Dependency array includes object that changes every render

Why 3: Why does the object change every render?
→ Object is created inline without memoization

Why 4: Why isn't it memoized?
→ useMemo was not used for object creation

Why 5: Why was useMemo not used?
→ Developer oversight, no linting rule to catch it

Root Cause: Missing useMemo for object dependency
Solution: Wrap object creation in useMemo hook
```

---

#### Step 2: Write Regression Test (5 min)

```bash
# Generate test that reproduces the bug
/agents/test -p "Create regression test for timetable infinite loop bug"
```

**Test Example**:

```typescript
// src/components/school-dashboard/timetable/content.test.tsx
describe('TimetableContent - Bug Fixes', () => {
  it('should not cause infinite loop when rendering', () => {
    const renderSpy = vi.fn()

    render(
      <TimetableContent
        onRender={renderSpy}
        timetable={mockTimetable}
      />
    )

    // Should render only once
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })
})
```

---

#### Step 3: Fix the Bug (10-20 min)

```bash
# Invoke relevant tech agent to fix
/agents/react -p "Fix infinite loop in timetable by memoizing config object"
```

**Fix Example**:

```typescript
// Before (causes infinite loop)
function TimetableContent({ timetable }) {
  useEffect(() => {
    // This runs infinitely because config changes every render
  }, [{ config: timetable.config }])
}

// After (fixed with useMemo)
function TimetableContent({ timetable }) {
  const config = useMemo(() => timetable.config, [timetable.config])

  useEffect(() => {
    // This runs only when config actually changes
  }, [config])
}
```

---

#### Step 4: Verify Fix (5 min)

```bash
# Run tests to verify bug is fixed
pnpm test src/components/school-dashboard/timetable/**/*.test.tsx

# Run comprehensive review
/review
```

**Verification Checklist**:

- ✅ Regression test passes
- ✅ No new bugs introduced
- ✅ Performance not degraded
- ✅ Test coverage maintained (95%+)

---

#### Step 5: Commit & Document (5 min)

```bash
# Commit with bug fix type
/agents/git-github -p "Commit bug fix for timetable infinite loop"
```

**Commit Message**:

```
fix(timetable): Prevent infinite loop in TimetableContent rendering

Memoized config object to prevent useEffect from running infinitely.
Added regression test to prevent future occurrences.

Fixes #456

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Documentation Update**:

- Update README troubleshooting section
- Close GitHub issue #456
- Add changelog entry under "### Fixed"

---

## 3. Code Review Workflow

**Use When**: Before merging PR, after significant changes

**Duration**: 10-15 minutes (automated)

**Command**: `/review`

### Step-by-Step Process

#### Step 1: Launch Review

```bash
# Run comprehensive review
/review
```

**Automated Actions**:

- **10 agents execute in parallel**:
  1. Architecture (pattern compliance)
  2. Security (OWASP audit)
  3. Multi-tenant (schoolId verification)
  4. Performance (optimization analysis)
  5. Test (coverage review)
  6. React Reviewer (React best practices)
  7. TypeScript (type safety)
  8. Typography (semantic HTML)
  9. Tailwind (CSS compliance)
  10. i18n (translation completeness)

---

#### Step 2: Review Report

**Example Output**:

```markdown
# Comprehensive Code Review Report

## Critical Issues (🚨 Must Fix Immediately)

1. **Security**: Missing input validation in markAttendance action
   - File: src/components/platform/attendance/actions.ts:15
   - Fix: Add Zod schema validation before database insert

2. **Multi-Tenant**: Query missing schoolId scoping
   - File: src/components/platform/attendance/actions.ts:42
   - Fix: Add `where: { schoolId }` to query

## Warnings (⚠️ Should Fix Before Merge)

1. **Performance**: Missing memoization in AttendanceTable
   - File: src/components/platform/attendance/table.tsx:23
   - Fix: Wrap columns in useMemo

2. **Tests**: Coverage below target (92% vs 95% target)
   - Files: attendance/form.tsx, attendance/calendar.tsx
   - Fix: Add tests for edge cases

## Style Issues (🎨 Fix for Consistency)

1. **Typography**: Hardcoded text classes found
   - File: src/components/platform/attendance/content.tsx:67
   - Fix: Replace `text-2xl font-bold` with `<h2>`

2. **i18n**: Missing Arabic translation
   - Key: attendance.bulk_mark_success
   - Fix: Add translation to ar/attendance.json

## Suggestions (💡 Nice to Have)

1. **Performance**: Consider virtualizing attendance table for large datasets
2. **Accessibility**: Add keyboard navigation to calendar component

## Praise (✅ What's Done Well)

- ✅ Excellent test coverage overall (92%)
- ✅ Proper server-first architecture
- ✅ Clean component composition
- ✅ RTL support fully implemented

## Metrics

- Test Coverage: 92% (target: 95%)
- Security Score: Pass (after fixes)
- Performance Score: Good
- Pattern Compliance: 9/10
- i18n Coverage: 98%
- TypeScript Strictness: Pass

## Overall Grade: B+

## Recommendation: Request Changes (fix critical issues + warnings)
```

---

#### Step 3: Fix Issues

```bash
# Auto-fix simple issues
/fix-all

# Manually fix critical/warning issues
# ... (edit files)

# Re-run review to verify
/review
```

---

#### Step 4: Approve or Request Changes

**If All Issues Fixed**:

```bash
# Create pull request
/agents/git-github -p "Create PR for attendance tracking feature"
```

**If Issues Remain**:

- Address issues iteratively
- Re-run `/review` after each fix
- Only create PR when overall grade is A or B+

---

## 4. Refactoring Workflow

**Use When**: Improving code quality without changing functionality

**Duration**: 30-60 minutes

**Philosophy**: Tests must pass before and after refactoring

### Step-by-Step Process

#### Step 1: Establish Baseline (5 min)

```bash
# Run tests before refactoring (all should pass)
pnpm test

# Run comprehensive review to identify refactoring opportunities
/review
```

**Baseline Checklist**:

- ✅ All tests passing
- ✅ Current test coverage noted (e.g., 95%)
- ✅ Current performance metrics noted
- ✅ Build succeeds

---

#### Step 2: Plan Refactoring (10 min)

```bash
# Use architecture agent to plan refactoring
/agents/architecture -p "Plan refactoring of timetable components to improve modularity and reduce coupling"
```

**Refactoring Goals**:

- Improve code readability
- Reduce coupling
- Increase modularity
- Enhance performance
- Maintain/improve test coverage

**Example Plan**:

```markdown
## Refactoring Plan: Timetable Components

### Current Issues

1. TimetableContent component is 500+ lines (too large)
2. Mixed concerns (data fetching, rendering, state management)
3. Difficult to test (tight coupling)

### Proposed Changes

1. Extract TimetableGrid component (150 lines)
2. Extract TimetableHeader component (50 lines)
3. Extract TimetableCell component (80 lines)
4. Move data fetching to server actions
5. Move state management to custom hook

### Expected Outcomes

- 5 focused components (average 100 lines each)
- Improved testability (unit tests for each component)
- Better performance (memoization of sub-components)
- Maintained test coverage (95%+)
```

---

#### Step 3: Refactor Incrementally (20-30 min)

```bash
# Refactor step-by-step, running tests after each change

# Step 1: Extract TimetableGrid
/agents/react -p "Extract TimetableGrid component from TimetableContent"
pnpm test  # Verify tests still pass

# Step 2: Extract TimetableHeader
/agents/react -p "Extract TimetableHeader component from TimetableContent"
pnpm test  # Verify tests still pass

# Step 3: Move data fetching to server actions
/agents/api -p "Move timetable data fetching to server actions"
pnpm test  # Verify tests still pass

# Continue iteratively...
```

**Refactoring Rules**:

1. **One change at a time**: Small, focused refactorings
2. **Test after each change**: Ensure tests pass before next change
3. **No functionality changes**: Only structure/organization changes
4. **Maintain coverage**: Test coverage should not decrease

---

#### Step 4: Verify Refactoring (10 min)

```bash
# Run full test suite
pnpm test

# Run comprehensive review
/review

# Run build
pnpm build
```

**Verification Checklist**:

- ✅ All tests passing (same or more tests)
- ✅ Test coverage maintained or improved
- ✅ Build succeeds
- ✅ No new violations in review
- ✅ Performance maintained or improved

---

#### Step 5: Commit Refactoring (5 min)

```bash
# Commit with refactor type
/agents/git-github -p "Commit timetable component refactoring"
```

**Commit Message**:

```
refactor(timetable): Extract TimetableContent into smaller components

- Extracted TimetableGrid (150 lines)
- Extracted TimetableHeader (50 lines)
- Extracted TimetableCell (80 lines)
- Moved data fetching to server actions
- Created useTimetable custom hook

Benefits:
- Improved testability (unit tests for each component)
- Better performance (component memoization)
- Easier maintenance (focused components)
- Maintained 95%+ test coverage

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 5. Deployment Workflow

**Use When**: Deploying to staging or production

**Duration**: 10-20 minutes (depending on environment)

**Command**: `/deploy <env>`

### Step-by-Step Process

#### Step 1: Pre-Deployment Checks (5 min)

```bash
# Run pre-deployment checklist
/deploy staging  # or /deploy production
```

**Automated Pre-Flight Checks**:

1. ✅ All tests passing (100% pass rate)
2. ✅ Build succeeds (no errors)
3. ✅ No security violations
4. ✅ Environment variables configured
5. ✅ Database migrations ready (if any)
6. ✅ No uncommitted changes
7. ✅ On correct branch (main for production, develop for staging)

**If Any Check Fails**: Deployment blocked, fix issues first

---

#### Step 2: Database Migrations (if applicable)

```bash
# Run database migrations (if schema changed)
pnpm prisma migrate deploy
```

**Migration Checklist**:

- ✅ Backup database before migration
- ✅ Test migration on staging first
- ✅ Verify data integrity after migration
- ✅ Rollback plan prepared

---

#### Step 3: Deploy Application

```bash
# Staging deployment
git push origin develop  # Triggers Vercel staging deploy

# Production deployment
git push origin main  # Triggers Vercel production deploy
```

**Vercel Deployment**:

- Automatic via Vercel Git integration
- Build logs available in Vercel dashboard
- Preview URL generated for staging
- Production URL updated for main branch

---

#### Step 4: Post-Deployment Verification (5-10 min)

```bash
# Verify deployment health
# (Manual checks via browser or automated E2E tests)

# Run smoke tests
pnpm test:e2e --grep "@smoke"
```

**Smoke Test Checklist**:

- ✅ Application loads without errors
- ✅ Authentication works
- ✅ Key features functional (critical user paths)
- ✅ Database connections working
- ✅ API endpoints responding
- ✅ No console errors
- ✅ Performance acceptable (Lighthouse score)

---

#### Step 5: Monitor & Rollback (if needed)

**Monitoring Tools**:

- **Vercel Analytics**: Traffic, performance, errors
- **Sentry**: Error tracking and debugging
- **Database**: Query performance and connection pool

**Rollback Procedure** (if issues detected):

```bash
# Revert to previous deployment
git revert HEAD
git push origin main  # Triggers re-deploy of previous version

# Or use Vercel instant rollback
vercel rollback  # Roll back to previous deployment
```

---

## 6. Emergency Hotfix Workflow

**Use When**: Critical bug in production requiring immediate fix

**Duration**: 30-60 minutes (fast-tracked)

**Philosophy**: Speed + safety, skip non-critical steps

### Step-by-Step Process

#### Step 1: Create Hotfix Branch (1 min)

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-name
```

---

#### Step 2: Debug & Fix (10-20 min)

```bash
# Fast debug
/agents/debug -p "Critical bug: Users cannot login after latest deployment"

# Quick fix
/agents/auth -p "Fix login authentication issue"

# Write minimal regression test
/agents/test -p "Create minimal test for login bug"
```

**Hotfix Checklist** (streamlined):

- ✅ Bug identified and reproduced
- ✅ Root cause found
- ✅ Minimal fix applied
- ✅ Regression test added
- ✅ Tests pass

**Skip** (for speed):

- ❌ Comprehensive review (defer to post-hotfix)
- ❌ Full documentation update (defer to post-hotfix)
- ❌ Performance optimization (unless root cause)

---

#### Step 3: Fast-Track Testing (5-10 min)

```bash
# Run tests (only affected areas)
pnpm test src/components/auth/**/*.test.tsx

# Quick smoke test
pnpm test:e2e --grep "@auth"

# Build verification
pnpm build
```

---

#### Step 4: Deploy to Production (5 min)

```bash
# Merge hotfix to main
git checkout main
git merge hotfix/critical-bug-name
git push origin main  # Triggers production deploy

# Tag hotfix
git tag v1.2.1-hotfix
git push origin v1.2.1-hotfix
```

---

#### Step 5: Post-Hotfix Cleanup (15-20 min - can be done later)

```bash
# Merge hotfix back to develop
git checkout develop
git merge main
git push origin develop

# Full review (deferred)
/review

# Update documentation
/agents/docs-manager -p "Document login bug hotfix"

# Create GitHub issue for post-mortem
/agents/git-github -p "Create post-mortem issue for login bug"
```

---

## 7. Documentation-Only Workflow

**Use When**: Updating documentation without code changes

**Duration**: 10-30 minutes

**Command**: `/agents/docs-manager`

### Step-by-Step Process

#### Step 1: Identify Documentation Gaps

```bash
# Review current documentation
# Identify gaps:
# - Missing feature READMEs
# - Outdated API references
# - Incomplete troubleshooting guides
```

---

#### Step 2: Generate/Update Documentation

```bash
# Update feature README
/agents/docs-manager -p "Update attendance feature README with new bulk actions API"

# Update main README
/agents/docs-manager -p "Add attendance feature to main README feature list"

# Generate changelog entry
/agents/docs-manager -p "Generate changelog entry for v1.5.0 release"
```

---

#### Step 3: Review Documentation Quality

**Quality Checklist**:

- ✅ Code examples are accurate and runnable
- ✅ File paths are correct
- ✅ External links work
- ✅ Screenshots included (if UI feature)
- ✅ Migration guide provided (if breaking changes)
- ✅ i18n documented
- ✅ Security considerations listed
- ✅ Performance impact noted

---

#### Step 4: Commit Documentation

```bash
# Commit with docs type
/agents/git-github -p "Commit documentation updates for attendance feature"
```

**Commit Message**:

```
docs(attendance): Update README with bulk actions API reference

- Added bulk actions API documentation
- Updated usage examples
- Added troubleshooting guide for bulk operations
- Included performance considerations

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Quality Gates Reference

### Pre-Commit Hooks (Automated)

**Trigger**: `git commit`

**Checks** (via PreToolUse hooks in settings.json):

1. Run tests for changed files
2. ESLint check
3. TypeScript type check

**Behavior**:

- **Main/master/production branches**: BLOCKS commit if any check fails
- **Feature branches**: WARNS but allows commit

**Example Output**:

```bash
$ git commit -m "feat: Add attendance feature"

🔍 Pre-Commit Quality Gates (Branch: feature/attendance)

Running tests for changed files...
✓ 15 tests passed

Running ESLint...
✓ No linting errors

Running TypeScript check...
✓ No type errors

✅ Pre-Commit checks passed
```

---

### Pre-Push Hooks (Automated)

**Trigger**: `git push`

**Checks** (via PreToolUse hooks in settings.json):

1. Full production build
2. Prettier format check

**Behavior**:

- **Main/master/production branches**: BLOCKS push if any check fails
- **Feature branches**: WARNS but allows push

**Example Output**:

```bash
$ git push origin feature/attendance

🔍 Pre-Push Build Verification (Branch: feature/attendance)

Running production build...
✓ Build completed in 45s

Checking Prettier formatting...
✓ All files formatted correctly

⚠️  WARNING: Quality checks passed on feature branch (feature/attendance)
Allowing push, but please fix errors before merging to main

✅ Pre-Push checks passed
```

---

### Comprehensive Review Checklist

**Trigger**: `/review` command

**10-Point Quality Checklist**:

1. **Architecture**: Mirror pattern, component hierarchy, structure
2. **Security**: OWASP Top 10, input validation, XSS, CSRF, SQL injection
3. **Multi-Tenant**: schoolId scoping in ALL queries, unique constraints
4. **Performance**: N+1 queries, memoization, bundle size, re-renders
5. **Tests**: 95%+ coverage, unit, integration, E2E
6. **React**: Best practices, hooks, composition, props
7. **TypeScript**: No any, strict mode, explicit types
8. **Typography**: Semantic HTML, no hardcoded text-_/font-_ classes
9. **Tailwind**: Class order, RTL support, cn() usage
10. **i18n**: Arabic & English translations, dictionary keys, RTL layout

---

## Troubleshooting

### Common Issues

#### Tests Keep Failing After 3 Iterations

**Symptoms**: Test suite fails repeatedly, Debug Agent cannot resolve

**Solutions**:

1. Check test data setup (database seeds, mocks)
2. Verify test expectations vs actual implementation
3. Review test isolation (tests may be affecting each other)
4. Manual intervention: Read Debug Agent analysis and fix manually
5. Consider refactoring complex logic into smaller testable units

---

#### Build Keeps Failing

**Symptoms**: Production build fails repeatedly after fixes

**Solutions**:

1. Regenerate Prisma client: `pnpm prisma generate`
2. Clear Next.js cache: `rm -rf .next`
3. Reinstall dependencies: `rm -rf node_modules && pnpm install`
4. Check environment variables: Verify .env.local has all required vars
5. Review Next.js Agent analysis for specific error details

---

#### Review Finds Too Many Violations

**Symptoms**: `/review` returns 20+ violations

**Solutions**:

1. Run `/fix-all` first to auto-fix simple issues
2. Address violations iteratively:
   - Priority 1: Critical issues (security, multi-tenant)
   - Priority 2: Warnings (performance, patterns)
   - Priority 3: Style issues (typography, Tailwind)
3. Consider refactoring existing code if new feature follows different patterns
4. Use `/agents/architecture` to align with established patterns

---

#### Documentation Not Updating

**Symptoms**: `/agents/docs-manager` doesn't create/update files

**Solutions**:

1. Verify file permissions in feature directory
2. Check GitHub token: Ensure GITHUB_PERSONAL_ACCESS_TOKEN is set
3. Review error messages from agent
4. Manually create README if needed, then re-run docs-manager
5. Check MCP server status for GitHub integration

---

#### Smart Blocking Not Working

**Symptoms**: Commits/pushes allowed on main branch despite failing checks

**Solutions**:

1. Verify PreToolUse hooks configured in `.claude/settings.json`
2. Check current branch: `git rev-parse --abbrev-ref HEAD`
3. Review hook output for error messages
4. Manually run quality checks: `pnpm test && pnpm lint && pnpm tsc --noEmit`
5. Re-save settings.json to reload hooks

---

## Workflow Metrics

### Expected Productivity Gains

| Workflow            | Manual Time | Automated Time | Improvement    |
| ------------------- | ----------- | -------------- | -------------- |
| Feature Development | 10-20 hours | 1-2 hours      | **10x faster** |
| Bug Fix             | 2-4 hours   | 15-45 min      | **4x faster**  |
| Code Review         | 1-2 hours   | 10-15 min      | **6x faster**  |
| Refactoring         | 4-8 hours   | 30-60 min      | **8x faster**  |
| Documentation       | 2-3 hours   | 10-30 min      | **6x faster**  |

### Quality Metrics

| Metric                | Target | Typical Result |
| --------------------- | ------ | -------------- |
| Test Coverage         | 95%+   | 95-98%         |
| Security Violations   | 0      | 0-1 (minor)    |
| Pattern Compliance    | 10/10  | 9-10/10        |
| i18n Coverage         | 100%   | 98-100%        |
| Build Success Rate    | 100%   | 98-100%        |
| TypeScript Strictness | Pass   | Pass           |

---

## Best Practices Summary

### Do's ✅

1. **Always start with tests** (TDD approach)
2. **Use `/feature` for new features** (full automation)
3. **Run `/review` before merging** (comprehensive quality check)
4. **Trust the automation** (let workflows run fully)
5. **Work on feature branches** (permissive quality gates)
6. **Update documentation** (automated via docs-manager)
7. **Verify after deployment** (smoke tests)
8. **Follow mirror pattern** (route ↔ component structure)
9. **Scope by schoolId** (multi-tenant safety)
10. **Include i18n** (Arabic & English)

### Don'ts ❌

1. **Don't skip tests** (maintains quality)
2. **Don't commit directly to main** (use feature branches)
3. **Don't ignore review violations** (technical debt)
4. **Don't hardcode typography** (use semantic HTML)
5. **Don't forget schoolId** (multi-tenant isolation)
6. **Don't skip documentation** (automated, no excuse)
7. **Don't deploy without verification** (smoke tests required)
8. **Don't use any type** (TypeScript strict mode)
9. **Don't violate mirror pattern** (architecture compliance)
10. **Don't deploy hotfixes without tests** (regression prevention)

---

## Additional Resources

- **Agent Documentation**: See `.claude/agents/*.md` for individual agent capabilities
- **Command Reference**: See `.claude/commands/*.md` for all available commands
- **Skills Documentation**: See `.claude/skills/*/SKILL.md` for reusable patterns
- **Configuration**: See `.claude/settings.json` for hooks and automation config
- **Project Instructions**: See `CLAUDE.md` for codebase-specific guidelines

---

## Changelog

- **v3.0** (2025-10-31): Expanded agent and command suite
  - Expanded from 20 to 35 agents (75% growth)
  - Added 10 new commands (22 total from 12)
  - Added 1 new skill (7 total from 6)
  - Added 3 Haiku agents for cost optimization
  - Added 10 developer productivity agents

- **v2.0** (2025-10-28): Complete workflow automation
  - Added `/feature` command (TDD-first workflow)
  - Added PreToolUse hooks (smart quality gates)
  - Added docs-manager agent (auto-documentation)
  - Enhanced orchestrator (Workflow 4: TDD)
  - Enhanced review (10-point checklist)
  - Added emergency hotfix workflow

- **v1.0** (2025-10-27): Initial workflow documentation
  - Basic feature development workflow
  - Code review workflow
  - Deployment workflow

---

**Author**: Hogwarts School Automation Platform Team
**Maintained by**: Claude Code Automation Suite
**License**: MIT
**Last Updated**: 2025-10-31
