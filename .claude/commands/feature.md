# Feature Development Command

**Command**: `/feature <description>`

**Purpose**: Complete TDD-first feature development workflow with automated quality gates

**Description**: Master workflow orchestrator that handles entire feature development lifecycle from test generation to documentation updates.

---

## Usage

```bash
# Basic usage
/feature "student attendance tracking"

# With detailed requirements
/feature "student attendance tracking with calendar view, bulk actions, and export to Excel"

# With specific technical constraints
/feature "real-time chat system using WebSockets and Redis for multi-tenant support"
```

---

## Workflow Execution

This command invokes the orchestrator agent with a **TDD-First Feature Development** workflow:

### Phase 1: Planning & Architecture (5 min)
1. **Architecture Agent**: Design feature structure following mirror pattern
2. **Multi-Tenant Agent**: Verify tenant isolation (schoolId scoping)
3. **Security Agent**: Review security implications (OWASP, auth, validation)

### Phase 2: TDD - Write Tests First (10 min)
4. **Test Agent**: Generate comprehensive test suite
   - Unit tests for components
   - Integration tests for server actions
   - E2E tests for user flows (if applicable)
   - Target: 95%+ coverage
5. **Verify Tests Fail**: Run tests to confirm red state

### Phase 3: Implementation (20-40 min)
6. **Tech Stack Agents** (parallel execution when possible):
   - **React Agent**: Component implementation
   - **Next.js Agent**: Pages, layouts, server components
   - **Prisma Agent**: Database schema & migrations (if needed)
   - **TypeScript Agent**: Type definitions & validation
   - **Tailwind Agent**: Styling with utility classes
   - **i18n Agent**: Arabic/English translations
7. **API Agent**: Server actions with Zod validation

### Phase 4: Test Validation (iterative until pass)
8. **Run Tests**: Execute test suite
9. **If Tests Fail**:
   - Debug Agent analyzes failures
   - Relevant tech agent fixes issues
   - Repeat step 8
10. **If Tests Pass**: Proceed to Phase 5

### Phase 5: Comprehensive Review (10 min)
11. **Parallel Review Execution**:
    - **Architecture Agent**: Pattern enforcement (mirror pattern, component hierarchy)
    - **Security Agent**: Security violations (OWASP, input validation, XSS, CSRF)
    - **Performance Agent**: Performance issues (re-renders, bundle size, N+1 queries)
    - **Typography Agent**: Semantic HTML enforcement (no hardcoded text-*/font-* classes)
    - **Multi-Tenant Agent**: Tenant isolation verification (schoolId in all queries)
    - **React Reviewer Agent**: React best practices (hooks, composition, props)
    - **TypeScript Agent**: Type safety violations (any usage, implicit types)
    - **Tailwind Agent**: Class order enforcement (cn() usage, RTL support)
    - **i18n Agent**: Translation completeness (Arabic & English coverage)
    - **Prettier/ESLint**: Code formatting and style violations (auto-fixed)

### Phase 6: Build Verification (iterative until pass)
12. **Next.js Agent**: Run production build
13. **If Build Fails**:
    - Next.js Agent analyzes build errors
    - Relevant tech agent fixes issues
    - Repeat step 12
14. **If Build Passes**: Proceed to Phase 7

### Phase 7: Commit & Push (with smart blocking)
15. **Git-GitHub Agent**:
    - Create conventional commit message
    - Commit changes
    - Push to remote
    - **Smart Blocking**:
      - Main/master/production branches: Blocked if any quality check fails
      - Feature branches: Warning only, allow override

### Phase 8: Documentation (automated)
16. **Docs Manager Agent**:
    - Update feature-based README in component directory
    - Create/update GitHub issues for feature tracking
    - Update main README.md if significant feature
    - Generate changelog entry

---

## Quality Gates (Automated)

### Pre-Commit Checks (via PreToolUse hooks)
- ✅ Tests pass for changed files
- ✅ ESLint passes (quiet mode)
- ✅ TypeScript type check passes (noEmit)
- **Behavior**:
  - Main branch: BLOCKS commit if any check fails
  - Feature branch: WARNS but allows commit

### Pre-Push Checks (via PreToolUse hooks)
- ✅ Full production build passes
- ✅ Prettier format check passes
- **Behavior**:
  - Main branch: BLOCKS push if any check fails
  - Feature branch: WARNS but allows push

### Comprehensive Review Checklist
- ✅ Mirror pattern compliance (route ↔ component structure)
- ✅ Component hierarchy (UI → Atoms → Templates → Blocks → Micro → Apps)
- ✅ Multi-tenant safety (schoolId in all queries)
- ✅ Security (OWASP Top 10, input validation, XSS, CSRF, SQL injection)
- ✅ Performance (memoization, code splitting, N+1 queries)
- ✅ Typography (semantic HTML, no hardcoded text-*/font-* classes)
- ✅ Tailwind (class order, cn() usage, RTL support)
- ✅ TypeScript (no any, explicit types, strict mode)
- ✅ i18n (Arabic & English translations complete)
- ✅ Accessibility (ARIA labels, keyboard navigation, semantic HTML)

---

## Example Output

```bash
$ /feature "student attendance tracking with calendar view"

🚀 Starting TDD Feature Development Workflow...

📐 Phase 1: Planning & Architecture
  ✅ Architecture designed (mirror pattern: /attendance → /components/attendance)
  ✅ Multi-tenant safety verified (schoolId scoping confirmed)
  ✅ Security reviewed (input validation, auth checks planned)

🧪 Phase 2: TDD - Write Tests First
  ✅ Test suite generated (15 tests, 95% coverage target)
  ❌ Tests run: 15 failed (expected - red state confirmed)

💻 Phase 3: Implementation
  ✅ React components created (AttendanceCalendar, AttendanceTable, AttendanceForm)
  ✅ Next.js pages created (/s/[subdomain]/attendance/page.tsx)
  ✅ Prisma schema updated (Attendance model with schoolId)
  ✅ Server actions created (markAttendance, getAttendance)
  ✅ Translations added (Arabic & English)

✅ Phase 4: Test Validation
  ✅ Tests run: 15 passed, 0 failed (green state achieved!)
  ✅ Coverage: 97.3% (exceeds 95% target)

🔍 Phase 5: Comprehensive Review
  ✅ Architecture: Mirror pattern compliant
  ✅ Security: No violations found
  ✅ Performance: No issues detected
  ✅ Typography: Semantic HTML enforced
  ✅ Multi-tenant: All queries scoped by schoolId
  ✅ React: Best practices followed
  ✅ TypeScript: Strict typing enforced
  ✅ Tailwind: Class order correct, RTL supported
  ✅ i18n: Translations complete (100% coverage)
  ✅ Prettier/ESLint: All files formatted

🏗️ Phase 6: Build Verification
  ✅ Production build successful
  ✅ No type errors
  ✅ Bundle size within limits

📝 Phase 7: Commit & Push
  ✅ Commit created: "feat(attendance): Add student attendance tracking with calendar view"
  ✅ Pushed to origin/feature/attendance-tracking
  ℹ️  Branch: feature branch (warnings only, no blocking)

📚 Phase 8: Documentation
  ✅ README updated: src/components/platform/attendance/README.md
  ✅ GitHub issue created: #123 "Student Attendance Tracking Feature"
  ✅ Changelog updated: CHANGELOG.md

🎉 Feature Development Complete!

Summary:
- 🧪 Tests: 15 passed (97.3% coverage)
- 📦 Build: Success
- 🔒 Security: No violations
- 🌍 i18n: 100% coverage
- ⚡ Performance: Optimized
- 📝 Docs: Updated

Next Steps:
- Create pull request: gh pr create
- Deploy to staging: /deploy staging
```

---

## Error Handling

### Tests Never Pass
- After 3 iterations, Debug Agent performs deep analysis
- Presents 5 Whys root cause analysis
- Offers manual intervention option

### Build Never Passes
- After 3 iterations, Next.js Agent performs deep analysis
- Checks for common issues (missing dependencies, type errors, env vars)
- Offers manual intervention option

### Review Violations
- Lists all violations with file:line references
- Automatically fixes auto-fixable issues (prettier, eslint, simple types)
- Requests approval for complex refactoring
- Re-runs review after fixes

---

## Configuration

### Required Agents
- `/agents/orchestrate` - Master coordinator
- `/agents/architecture` - Pattern enforcement
- `/agents/test` - TDD & test generation
- `/agents/react` - Component implementation
- `/agents/nextjs` - Pages & build
- `/agents/prisma` - Database (if needed)
- `/agents/typescript` - Type safety
- `/agents/tailwind` - Styling
- `/agents/i18n` - Translations
- `/agents/api` - Server actions
- `/agents/security` - Security review
- `/agents/performance` - Performance review
- `/agents/typography` - Semantic HTML
- `/agents/multi-tenant` - Tenant safety
- `/agents/react-reviewer` - React review
- `/agents/git-github` - Git operations
- `/agents/docs-manager` - Documentation
- `/agents/debug` - Error analysis (fallback)

### Required Hooks (settings.json)
- **PostToolUse**: Auto-format on Write/Edit (already configured)
- **PreToolUse**: Pre-commit tests/lint/type-check (to be added)
- **PreToolUse**: Pre-push build verification (to be added)

### Environment Variables
- `MULTI_TENANT=true` - Enables tenant safety checks
- `I18N_LANGUAGES=en,ar` - Enables i18n validation

---

## Best Practices

### When to Use This Command
✅ **USE for**:
- New features with multiple components
- Features requiring database changes
- Features needing comprehensive testing
- Features affecting multiple areas (auth, security, performance)

❌ **DON'T USE for**:
- Simple bug fixes (use `/agents/debug` instead)
- Documentation-only updates (use `/agents/docs-manager` instead)
- Styling tweaks (use `/agents/tailwind` instead)
- Single-file changes (use specific agent directly)

### Tips for Best Results
1. **Be specific**: Provide detailed requirements in the feature description
2. **Mention constraints**: Include technical requirements (WebSockets, specific libraries, etc.)
3. **Trust the process**: Let the workflow run fully before manual intervention
4. **Review output**: Check the summary for any warnings or suggestions
5. **Feature branch**: Work on feature branches for permissive quality gates

---

## Related Commands

- `/test <file>` - Run tests for specific file only
- `/review` - Run comprehensive review without feature development
- `/build` - Run build verification only
- `/deploy <env>` - Deploy to staging/production
- `/fix-all` - Auto-fix all code quality issues
- `/security-scan` - Full security audit
- `/i18n-check` - Translation completeness check

---

## Troubleshooting

### "Tests keep failing after 3 iterations"
- Review Debug Agent analysis
- Check test expectations vs actual implementation
- Verify test data setup (database seeds, mocks)
- Consider manual intervention for complex logic

### "Build keeps failing"
- Review Next.js Agent analysis
- Check for missing dependencies: `pnpm install`
- Regenerate Prisma client: `pnpm prisma generate`
- Verify environment variables in .env

### "Review finds too many violations"
- Run `/fix-all` first to auto-fix simple issues
- Address violations iteratively (security first, then patterns, then style)
- Consider refactoring existing code if new feature follows patterns

### "Documentation not updating"
- Verify Docs Manager Agent is available
- Check file permissions in feature directory
- Ensure GitHub token is configured for issue creation

---

## Version History

- **v1.0** (2025-10-28): Initial release with TDD-first workflow
  - 8-phase automated workflow
  - Smart quality gates (branch-aware blocking)
  - Comprehensive review (10-point checklist)
  - Auto-documentation with GitHub issues
