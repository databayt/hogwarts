---
description: Block optimization for production-readiness (research, assess, checklist, recommend)
requiresArgs: true
---

Block Rebound: $1

Execute the full 4-phase Block Rebound workflow for the specified block.

## Workflow

### Phase 1: Research

- WebSearch for top 5 competitors in this domain
- Feature benchmarking matrix
- Industry best practices
- Innovation opportunities

### Phase 2: Assessment

Read and analyze:

- `src/components/platform/$1/` (all files)
- `src/app/[lang]/s/[subdomain]/(platform)/$1/` (routes)
- Related Prisma models

Check:

- Architecture compliance (mirror pattern)
- Multi-tenant safety (schoolId in queries)
- Security (validation, auth checks)
- Performance (N+1, bundle size)
- UX (loading, error, empty states)
- i18n coverage (Arabic/English)
- Test coverage (target: 95%)

### Phase 3: Checklist

Generate prioritized production checklist:

- Critical (must fix): Security, multi-tenant, data integrity
- High priority: Missing features, performance, major UX
- Medium priority: Enhancements, i18n, accessibility
- Low priority: Nice-to-have, polish

Include effort estimates for each item.

### Phase 4: Recommendations

- Priority matrix (impact vs effort)
- Quick wins list
- Implementation phases (weekly)
- Dependencies between tasks
- Success metrics

## Output

Save combined report to:
`.claude/workflows/rebound-outputs/$1/rebound-{date}.md`

## Integration

Invoke during assessment:

- `/agents/security` for security deep-dive
- `/agents/multi-tenant` for tenant isolation
- `/agents/performance` for optimization analysis
- `skill: prisma-optimizer` for query analysis

## Valid Blocks

dashboard, students, teachers, parents, finance, attendance, grades, exams, assignments, timetable, subjects, classes, lessons, announcements, messaging, events, billing, fees, invoice, banking, library, settings, profile, admin
