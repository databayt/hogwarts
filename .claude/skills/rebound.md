# Block Rebound Skill

**Purpose**: Systematically optimize any platform block for production-readiness through competitor research, technical assessment, and actionable recommendations.

## Trigger Recognition

Activate this skill when the user says:
- "rebound {block}"
- "rebound the {block} block"
- "optimize {block} for production"
- "make {block} production-ready"
- "audit {block} block"

## Valid Blocks

### Core (4)
dashboard, profile, settings, admin

### People (4)
students, teachers, parents, staff

### Academic (5)
subjects, classes, lessons, timetable, attendance

### Assessment (3)
exams, assignments, grades

### Finance (12)
finance, fees, billing, invoice, receipt, banking, salary, expenses, payroll, budget, wallet, accounts

### Operations (5)
announcements, messaging, notifications, events, library

---

## Phase 1: Research (5-10 min)

**Objective**: Understand what best-in-class solutions offer for this domain.

### Search Strategy by Block Type

#### Finance Blocks
```
Search: "best school fee management software 2025"
Search: "school billing system features"
Search: "education payment gateway integration"
Search: "school accounting software comparison"

Competitors: Blackbaud, FACTS Management, PaySchools, Ravenna
```

#### Attendance Blocks
```
Search: "modern attendance tracking software features"
Search: "school attendance management best practices"
Search: "biometric attendance for schools"
Search: "automated attendance notification system"

Competitors: PowerSchool, Alma SIS, SchoolMint, Boardingware
```

#### Student/Teacher Management
```
Search: "student information system features 2025"
Search: "best SIS for K-12 schools"
Search: "teacher management software features"

Competitors: PowerSchool, Infinite Campus, Skyward, Gradelink
```

#### Timetable/Scheduling
```
Search: "automated school timetable generation"
Search: "class scheduling software features"
Search: "school scheduler conflict resolution"

Competitors: Untis, aSc TimeTables, Lantiv Timetabler, Prime Timetable
```

#### Announcements/Communication
```
Search: "school communication platform features"
Search: "parent notification system best practices"
Search: "school messaging app features 2025"

Competitors: ClassDojo, Remind, Bloomz, ParentSquare
```

### Research Output Template

```markdown
## Competitor Analysis: {Block}

### Top 5 Solutions
1. **{Name}** - {pricing}, {key differentiator}
2. **{Name}** - {pricing}, {key differentiator}
...

### Feature Matrix
| Feature | Hogwarts | Comp 1 | Comp 2 | Comp 3 |
|---------|----------|--------|--------|--------|
| {feat}  | Yes/No   | ...    | ...    | ...    |

### Must-Have Features (Industry Standard)
1. {feature} - Every competitor has this
2. {feature} - Required for basic functionality

### Differentiating Features (Competitive Advantage)
1. {feature} - Only top 2 competitors have this
2. {feature} - Could set us apart

### Innovation Opportunities
1. {feature} - No competitor does this well
2. {feature} - Emerging trend we could pioneer
```

---

## Phase 2: Assessment (10-15 min)

**Objective**: Evaluate current implementation against standards and best practices.

### Files to Analyze

```
# Component files
src/components/platform/{block}/
├── content.tsx           # Main server component
├── actions.ts            # Server actions
├── validation.ts         # Zod schemas
├── types.ts              # TypeScript types
├── columns.tsx           # Table columns
├── table.tsx             # Data table
├── form.tsx              # Forms
└── {sub-block}/          # Sub-modules

# Route files
src/app/[lang]/s/[subdomain]/(platform)/{block}/
├── page.tsx
├── layout.tsx
└── [id]/page.tsx

# Prisma models
prisma/models/{related}.prisma
```

### Assessment Checklist

#### Architecture Compliance
- [ ] Mirror pattern followed (route mirrors component)
- [ ] Server/client component boundaries correct
- [ ] Component hierarchy (UI → Atoms → Features)
- [ ] Proper use of Server Actions
- [ ] No oversized files (>500 lines)

#### Multi-Tenant Safety
- [ ] schoolId in ALL database queries
- [ ] schoolId in unique constraints
- [ ] Session verification before operations
- [ ] No cross-tenant data leakage
- [ ] Proper scoping in aggregations

#### Security
- [ ] Input validation on all forms (Zod)
- [ ] Server-side validation in actions
- [ ] SQL injection prevention (Prisma parameterization)
- [ ] XSS prevention (React escaping)
- [ ] Authorization checks on all endpoints
- [ ] Rate limiting on sensitive operations

#### Performance
- [ ] No N+1 queries
- [ ] Proper use of useMemo/useCallback
- [ ] Efficient data fetching (pagination, filtering)
- [ ] Lazy loading for heavy components
- [ ] Optimized bundle size

#### UX
- [ ] Loading states on all async operations
- [ ] Error handling with user-friendly messages
- [ ] Empty states for no-data scenarios
- [ ] Responsive design (mobile-first)
- [ ] RTL support for Arabic
- [ ] Keyboard navigation
- [ ] Accessible (ARIA labels)

#### Code Quality
- [ ] TypeScript strict mode compliance
- [ ] No `any` types
- [ ] Comprehensive error handling
- [ ] Test coverage (target: 95%)
- [ ] Documentation (JSDoc, README)
- [ ] Consistent naming patterns

#### i18n Coverage
- [ ] All user-facing strings translated
- [ ] Arabic translations complete
- [ ] RTL layout works correctly
- [ ] Date/number formatting localized

### Assessment Output Template

```markdown
## Technical Assessment: {Block}

### Files Analyzed
- Component files: {count}
- Route files: {count}
- Prisma models: {list}

### Architecture Score: {X}/10
- Mirror pattern: ✅/❌
- Server/client boundaries: ✅/❌
- Component hierarchy: ✅/❌

### Multi-Tenant Safety: {X}/10
- Issues found: {count}
- {issue 1}: {file}:{line}
- {issue 2}: {file}:{line}

### Security: {X}/10
- Issues found: {count}
- {issue 1}: {severity}
- {issue 2}: {severity}

### Performance: {X}/10
- N+1 queries: {count}
- Bundle size: {KB}
- Issues: {list}

### UX: {X}/10
- Loading states: {%}
- Error handling: {%}
- Accessibility: {score}

### i18n Coverage: {X}%
- Missing keys: {count}
- RTL issues: {count}

### Test Coverage: {X}%
- Current: {files covered}/{total files}
- Missing: {list}

### Gap Analysis vs Competitors
| Feature | Us | Competitors | Gap |
|---------|-----|-------------|-----|
| {feat}  | No  | Yes (4/5)   | High |
| {feat}  | Partial | Yes (3/5) | Medium |
```

---

## Phase 3: Checklist (5 min)

**Objective**: Create actionable, prioritized task list for production-readiness.

### Priority Levels

#### Critical (Must fix before production)
- Security vulnerabilities
- Multi-tenant isolation issues
- Data integrity problems
- Crashes or major bugs

#### High Priority (Should fix soon)
- Missing core features
- Performance issues (>500ms response)
- Major UX problems
- Important missing validations

#### Medium Priority (Plan for near-term)
- Feature enhancements
- i18n gaps
- Accessibility improvements
- Code quality issues

#### Low Priority (Backlog)
- Nice-to-have features
- Polish and refinement
- Documentation gaps
- Minor UX improvements

### Checklist Output Template

```markdown
# {Block} Production Readiness Checklist

Generated: {date}
Total Items: {count}
Estimated Effort: {hours} hours

## Critical ({count} items, {hours}h)

### Security
- [ ] {issue} - Est: {hours}h - File: {path}
- [ ] {issue} - Est: {hours}h - File: {path}

### Multi-Tenant
- [ ] {issue} - Est: {hours}h - File: {path}

### Data Integrity
- [ ] {issue} - Est: {hours}h - File: {path}

## High Priority ({count} items, {hours}h)

### Missing Features
- [ ] {feature} - Est: {hours}h

### Performance
- [ ] {issue} - Est: {hours}h - File: {path}

### UX
- [ ] {issue} - Est: {hours}h

## Medium Priority ({count} items, {hours}h)

### Enhancements
- [ ] {feature} - Est: {hours}h

### i18n
- [ ] {issue} - Est: {hours}h

### Accessibility
- [ ] {issue} - Est: {hours}h

## Low Priority ({count} items, {hours}h)

### Nice-to-Have
- [ ] {feature} - Est: {hours}h
```

---

## Phase 4: Recommendations (5 min)

**Objective**: Provide strategic guidance and implementation order.

### Priority Matrix

```
HIGH IMPACT
    ^
    |   [Quick Wins]        [Major Wins]
    |   Low effort,         High effort,
    |   high value          high value
    |
    |   [Fill-ins]          [Big Bets]
    |   Low effort,         High effort,
    |   low value           low value
    +---------------------------------> HIGH EFFORT
```

### Recommendation Output Template

```markdown
## Recommendations: {Block}

### Quick Wins (Do This Week)
High impact, low effort - start here

1. **{task}** - {30 min}
   - Why: {impact}
   - How: {approach}

2. **{task}** - {1 hour}
   - Why: {impact}
   - How: {approach}

### Implementation Phases

#### Phase 1: Foundation ({X} hours, Week 1)
Focus: Security and stability
- {task 1}
- {task 2}
- {task 3}

#### Phase 2: Core Features ({X} hours, Week 2-3)
Focus: Feature parity with competitors
- {task 1}
- {task 2}

#### Phase 3: Polish ({X} hours, Week 4)
Focus: UX and completeness
- {task 1}
- {task 2}

#### Phase 4: Enhancement (Future)
Focus: Differentiation
- {task 1}
- {task 2}

### Dependencies

```
[Task A] → [Task B] → [Task C]
    ↓
[Task D]
```

### Success Metrics

After optimization:
- [ ] Zero critical issues
- [ ] Zero high-priority security issues
- [ ] 95%+ test coverage
- [ ] 100% i18n coverage
- [ ] <200ms average API response
- [ ] Mobile-responsive on all views
- [ ] WCAG 2.1 AA compliance
```

---

## Integration Points

### Reuse Existing Agents

```bash
# Security deep-dive
/agents/security -p "Audit {block} block"

# Multi-tenant verification
/agents/multi-tenant -p "Verify {block} tenant isolation"

# Performance analysis
/agents/performance -p "Optimize {block} block"

# Translation audit
/agents/i18n -p "Check {block} translations"
```

### Reuse Existing Skills

```bash
# Invoke skills during assessment
skill: multi-tenant-validator
skill: security-scanner
skill: prisma-optimizer
skill: react-performance
```

---

## Output Location

All reports saved to:
```
.claude/workflows/rebound-outputs/{block}/
└── rebound-{YYYY-MM-DD}.md
```

Combined single file containing:
1. Research findings
2. Technical assessment
3. Production checklist
4. Recommendations

---

## Success Criteria

A block is **production-ready** when:

- [ ] Zero critical issues
- [ ] Zero high-priority security issues
- [ ] Multi-tenant isolation verified
- [ ] 95%+ test coverage
- [ ] 100% i18n coverage (Arabic + English)
- [ ] All core features implemented
- [ ] Performance within targets (<200ms API, <100KB bundle)
- [ ] Accessibility compliant (WCAG 2.1 AA)
- [ ] Documentation complete
- [ ] Mobile-responsive

---

## Example Invocation

```
User: rebound finance

Claude: Starting Block Rebound for finance...

[Phase 1: Research]
Searching for competitors and best practices...
✓ Found 5 competitors: Blackbaud, FACTS, PowerSchool...
✓ Identified 15 must-have features
✓ 8 differentiation opportunities

[Phase 2: Assessment]
Analyzing current implementation...
✓ 147 files analyzed
✓ Architecture: 85% compliant
✓ Multi-tenant: 3 issues found
✓ Security: 4 issues found
✓ Test coverage: 67%

[Phase 3: Checklist]
Generating production checklist...
• Critical: 8 items (20h)
• High: 8 items (30h)
• Medium: 5 items (20h)
• Low: 3 items (10h)

[Phase 4: Recommendations]
Creating implementation plan...
• Quick wins: 4 items (5h)
• Phase 1: Security (Week 1)
• Phase 2: Features (Week 2-3)
• Phase 3: Polish (Week 4)

✓ Report saved to: .claude/workflows/rebound-outputs/finance/rebound-2025-12-10.md
```
