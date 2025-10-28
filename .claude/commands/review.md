---
description: Comprehensive code review (project)
---

Launch comprehensive code review using orchestrator with parallel execution of 10 specialized agents:

Invoke /agents/orchestrate with prompt:
"Coordinate comprehensive code review using Workflow 3 (Parallel Execution):

**Architecture & Patterns**:
1. /agents/architecture - Pattern compliance (mirror pattern, component hierarchy, structure)
   - Verify route ↔ component mirroring
   - Check component hierarchy (UI → Atoms → Templates → Blocks → Micro → Apps)
   - Validate file structure and naming conventions
   - Ensure server-first architecture

**Security & Multi-Tenancy**:
2. /agents/security - Security audit (OWASP Top 10, input validation, XSS, CSRF, SQL injection)
3. /agents/multi-tenant - Tenant safety verification (schoolId scoping in all queries)
   - Verify ALL database queries include schoolId
   - Check unique constraints are scoped by schoolId
   - Validate session-based tenant isolation

**Performance & Quality**:
4. /agents/performance - Performance analysis (re-renders, bundle size, N+1 queries, memoization)
5. /agents/test - Test coverage review (target: 95%+, unit, integration, E2E)

**React & TypeScript**:
6. /agents/react-reviewer - React best practices (hooks, composition, props, state management)
7. /agents/typescript - Type safety violations (any usage, implicit types, strict mode compliance)

**Styling & Typography**:
8. /agents/typography - Semantic HTML enforcement
   - NO hardcoded text-*/font-* classes
   - Use h1-h6, p, small for all text content
   - Theme-aware colors (text-foreground, text-muted-foreground)
   - Verify semantic token usage (--color-*, --radius-*, --spacing-*)

9. /agents/tailwind - Tailwind CSS compliance
   - Class order enforcement (cn() utility usage)
   - RTL/LTR support verification (start/end instead of left/right)
   - Responsive design patterns
   - Dark mode support
   - No arbitrary values without justification

**Internationalization**:
10. /agents/i18n - Translation completeness
    - Arabic (RTL) and English (LTR) coverage
    - Dictionary key usage (no hardcoded strings)
    - RTL layout correctness
    - Locale-aware date/number formatting

**Auto-Fix (via hooks)**:
- Prettier formatting (automatic on save)
- ESLint auto-fixable issues (run /fix-all if needed)

**Synthesis**:
Synthesize all findings into comprehensive report with:

### Critical Issues (🚨 Must Fix Immediately)
- Security vulnerabilities
- Multi-tenant safety violations (missing schoolId)
- Breaking changes
- Test failures

### Warnings (⚠️ Should Fix Before Merge)
- Performance issues
- Pattern violations
- Type safety issues
- Missing tests (below 95%)

### Style Issues (🎨 Fix for Consistency)
- Typography violations (hardcoded classes)
- Tailwind order violations
- Missing i18n translations
- Accessibility issues

### Suggestions (💡 Nice to Have)
- Performance optimizations
- Code refactoring opportunities
- Architecture improvements

### Praise (✅ What's Done Well)
- Security best practices followed
- Excellent test coverage
- Performance optimizations
- Clean architecture

**Metrics**:
- Test Coverage: [X]%
- Security Score: [Pass/Fail]
- Performance Score: [Good/Fair/Poor]
- Pattern Compliance: [X/10]
- i18n Coverage: [X]%
- TypeScript Strictness: [Pass/Fail]

**Overall Grade**: [A/B/C/D/F]
**Recommendation**: [Approve/Request Changes/Reject]"
