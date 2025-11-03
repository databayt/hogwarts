# Hogwarts - Technical Specification

**Feature ID:** TS-XXX
**Author:** [Your Name]
**Date:** [YYYY-MM-DD]
**Project Level:** Level 0 (Small Feature / Bug Fix)
**Change Type:** [New Feature | Enhancement | Bug Fix | Refactor]
**Development Context:** Hogwarts School Automation Platform
**Estimated Time:** [1-4 hours]

---

## Context

### Available Documents
- PRD: `/PRD.md` (25,000+ words, 200+ functional requirements)
- Epics: `/epics.md` (12 epics, 190+ stories)
- Architecture: `/architecture.md` (BMAD-METHOD structure, 15+ ADRs)
- Architecture Page: `/src/app/[lang]/docs/architecture/page.mdx`

### Project Stack
- **Framework**: Next.js 15.4.4 (App Router) with React 19.1.0
- **Language**: TypeScript 5.x (strict mode)
- **Database**: PostgreSQL (Neon) with Prisma ORM 6.14.0
- **Authentication**: NextAuth v5 (Auth.js 5.0.0-beta.29)
- **Styling**: Tailwind CSS 4 with shadcn/ui (New York style)
- **Testing**: Vitest 2.0.6 + React Testing Library + Playwright 1.55.0
- **Deployment**: Vercel (serverless)

### Existing Codebase Structure

**Mirror Pattern** (routes mirror component folders):
```
src/
  app/[lang]/s/[subdomain]/(platform)/<feature>/
    page.tsx                    # Route definition
  components/platform/<feature>/
    content.tsx                 # Main UI composition
    actions.ts                  # Server actions ("use server")
    validation.ts               # Zod schemas
    types.ts                    # TypeScript types
    form.tsx                    # Form components
    column.tsx                  # Data table columns
```

---

## The Change

### Problem Statement

[Describe the problem this change addresses. Be specific about user pain points or technical limitations.]

**User Story:**
```
As a [role],
I want [goal/desire]
So that [benefit/value]
```

### Proposed Solution

[Describe the solution at a high level. What will change? How will it solve the problem?]

### Scope

**In Scope:**
- [ ] [Specific feature or change 1]
- [ ] [Specific feature or change 2]
- [ ] [Specific feature or change 3]

**Out of Scope:**
- [ ] [What will NOT be included in this change]
- [ ] [Future enhancements to consider separately]

---

## Implementation Details

### Source Tree Changes

**Files to Create:**
```
[List new files to be created]
```

**Files to Modify:**
```
src/components/platform/<feature>/[file].ts    # [Brief description of changes]
src/app/[lang]/s/[subdomain]/(platform)/...   # [Route changes]
prisma/models/[model].prisma                    # [Schema changes]
```

### Technical Approach

**Database Changes:**
```prisma
// Example schema changes
model [ModelName] {
  id        String   @id @default(cuid())
  schoolId  String   // REQUIRED for multi-tenant safety
  [field]   [Type]

  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@unique([field, schoolId])  // Scope uniqueness by tenant
  @@index([schoolId, field])
}
```

**Server Action Pattern:**
```typescript
// src/components/platform/<feature>/actions.ts
"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { revalidatePath } from "next/cache"
import { [schema] } from "./validation"

export async function [actionName](input: z.infer<typeof [schema]>) {
  // 1. Authentication
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // 2. Authorization (role-based)
  if (![ALLOWED_ROLES].includes(session.user.role)) {
    throw new Error("Forbidden")
  }

  // 3. Tenant context (CRITICAL)
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // 4. Validation
  const parsed = [schema].parse(input)

  // 5. Database operation (with schoolId)
  const result = await db.[model].create({
    data: { ...parsed, schoolId }
  })

  // 6. Revalidate
  revalidatePath("/[path]")

  return { success: true, data: result }
}
```

### Existing Patterns to Follow

**Multi-Tenant Safety:**
- ✅ ALL queries MUST include `{ where: { schoolId } }`
- ✅ Use `getTenantContext()` to get schoolId
- ✅ Scope unique constraints by schoolId

**Validation Pattern:**
```typescript
// validation.ts
import { z } from "zod"

export const [feature]Schema = z.object({
  [field]: z.string().min(1, "Required"),
  // ...
})
```

**Form Pattern:**
```typescript
// form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { [schema] } from "./validation"

const form = useForm({
  resolver: zodResolver([schema])
})
```

### Integration Points

**Components:**
- [ ] `src/components/platform/<feature>/content.tsx` - Main UI
- [ ] `src/components/platform/<feature>/form.tsx` - Form component
- [ ] `src/components/ui/*` - shadcn/ui primitives

**APIs:**
- [ ] Server action: `[actionName]` in `actions.ts`
- [ ] Validation: `[schema]` in `validation.ts`

**Database:**
- [ ] Model: `[ModelName]` in `prisma/models/[model].prisma`
- [ ] Relations: [Describe relationships]

---

## Development Context

### Relevant Existing Code

**Similar Implementations:**
- `src/components/platform/[similar-feature]/actions.ts` - Reference implementation
- `src/components/platform/[similar-feature]/form.tsx` - Form pattern example

### Dependencies

**Framework/Libraries:**
- `zod` (4.0.14) - Validation
- `react-hook-form` (7.61.1) - Form handling
- `@hookform/resolvers` - Zod integration
- `next/navigation` - revalidatePath, redirect

**Internal Modules:**
- `@/auth` - Authentication
- `@/lib/db` - Prisma client
- `@/lib/tenant-context` - Multi-tenant utilities
- `@/components/ui/*` - UI components

### Configuration Changes

**Environment Variables:**
```env
# No new environment variables required
```

**Prisma Migration:**
```bash
# If schema changes are needed
pnpm prisma migrate dev --name [migration_name]
pnpm prisma generate
```

### Existing Conventions (Brownfield)

**Naming Conventions:**
- Components: PascalCase (`StudentForm.tsx`)
- Actions: camelCase (`createStudent`)
- Files: kebab-case (`student-form.tsx`)
- Schemas: camelCase with suffix (`studentCreateSchema`)

**Code Organization:**
- Server actions in `actions.ts` with `"use server"` directive
- Client components marked with `"use client"`
- Types in `types.ts`, validation in `validation.ts`
- Mirror pattern: route structure matches component structure

**Error Handling:**
- Server actions return `{ success: boolean, data?: T, error?: string }`
- Client displays errors via toast notifications
- Log errors with `requestId` for traceability

**Logging:**
```typescript
console.log(`[${feature}] ${message}`, { requestId, schoolId })
```

### Test Framework & Standards

**Unit Tests (Vitest):**
```typescript
// [feature].test.ts
import { describe, it, expect, vi } from 'vitest'
import { [action] } from './actions'

describe('[Feature] Actions', () => {
  it('should [expected behavior]', async () => {
    // Arrange
    // Act
    // Assert
  })
})
```

**E2E Tests (Playwright):**
```typescript
// [feature].spec.ts
import { test, expect } from '@playwright/test'

test('[feature] - [scenario]', async ({ page }) => {
  // Test implementation
})
```

**Coverage Target:** 95%+

---

## Implementation Stack

**Primary Technologies:**
- Next.js 15.4.4 App Router
- React 19.1.0 Server Components
- TypeScript 5.x (strict mode)
- Prisma 6.14.0 ORM
- PostgreSQL (Neon serverless)

**UI Stack:**
- Tailwind CSS 4 (utility-first)
- shadcn/ui components (Radix UI primitives)
- React Hook Form + Zod validation

**Deployment:**
- Vercel serverless functions
- Automatic deployments from main branch
- Edge network for global distribution

---

## Technical Details

### Data Flow
1. User interaction triggers form submission
2. Client-side validation (Zod schema)
3. Server action called with form data
4. Server-side validation (same Zod schema)
5. Multi-tenant scoping (schoolId injection)
6. Database operation (Prisma)
7. Cache revalidation (revalidatePath)
8. UI update (React state / SWR refetch)

### Security Considerations
- ✅ Authentication check (session required)
- ✅ Authorization check (role-based)
- ✅ Multi-tenant isolation (schoolId scoping)
- ✅ Input validation (Zod schemas)
- ✅ XSS prevention (React auto-escaping)
- ✅ CSRF protection (NextAuth tokens)

### Performance Considerations
- Database indexes on frequently queried fields
- Pagination for large datasets (10 items per page default)
- Server Components for zero-JS rendering
- Lazy loading for heavy components

---

## Development Setup

**Prerequisites:**
```bash
# Node.js 18+, pnpm 9.x
node --version  # v18+
pnpm --version  # 9.x
```

**Local Development:**
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm db:seed

# Start development server
pnpm dev
```

**Access:**
- Main: http://localhost:3000
- Subdomain: http://subdomain.localhost:3000

---

## Implementation Guide

### Setup Steps

1. **Create Database Schema (if needed):**
```bash
# Edit prisma/models/[model].prisma
# Run migration
pnpm prisma migrate dev --name [migration_name]
pnpm prisma generate
```

2. **Create Validation Schema:**
```typescript
// src/components/platform/<feature>/validation.ts
export const [feature]Schema = z.object({
  // Define schema
})
```

3. **Create Server Action:**
```typescript
// src/components/platform/<feature>/actions.ts
"use server"
// Implement action following pattern above
```

4. **Create UI Components:**
```typescript
// src/components/platform/<feature>/form.tsx
// src/components/platform/<feature>/content.tsx
```

5. **Create Route:**
```typescript
// src/app/[lang]/s/[subdomain]/(platform)/<feature>/page.tsx
```

### Implementation Steps

1. [ ] **Database Schema** (if needed)
   - Update Prisma schema
   - Run migration
   - Generate Prisma client

2. [ ] **Server Actions**
   - Create actions.ts with "use server"
   - Implement CRUD operations
   - Include schoolId scoping (CRITICAL)

3. [ ] **Validation**
   - Create validation.ts with Zod schemas
   - Export type inference

4. [ ] **UI Components**
   - Create form.tsx (client component)
   - Create content.tsx (server component)
   - Use shadcn/ui components

5. [ ] **Route**
   - Create page.tsx
   - Import feature content

6. [ ] **Testing**
   - Unit tests for actions
   - Component tests for forms
   - E2E tests for workflows

### Testing Strategy

**Unit Tests:**
```bash
# Test specific file
pnpm test src/components/platform/<feature>/**/*.test.tsx

# Watch mode
pnpm test --watch
```

**E2E Tests:**
```bash
# Run E2E tests
pnpm test:e2e

# UI mode
pnpm test:e2e:ui
```

### Acceptance Criteria

- [ ] Feature works as described in user story
- [ ] Multi-tenant safety verified (schoolId scoping)
- [ ] Validation works on client and server
- [ ] Error handling graceful
- [ ] Tests pass (95%+ coverage)
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Responsive (mobile, tablet, desktop)
- [ ] i18n support (Arabic + English)
- [ ] Performance acceptable (Lighthouse >90)

---

## Developer Resources

### File Paths Reference

**Primary Files:**
```
src/components/platform/<feature>/
  content.tsx              # Main UI composition (server component)
  actions.ts               # Server actions ("use server")
  validation.ts            # Zod schemas
  types.ts                 # TypeScript types
  form.tsx                 # Form components (client)
  column.tsx               # Data table columns (client)

src/app/[lang]/s/[subdomain]/(platform)/<feature>/
  page.tsx                 # Route (imports content.tsx)

prisma/models/
  [model].prisma           # Database schema
```

### Key Code Locations

**Authentication:**
- `src/auth.ts` (867 lines) - NextAuth configuration
- `src/auth.config.ts` - JWT/session callbacks
- `src/middleware.ts` - Route protection

**Multi-Tenant:**
- `src/lib/tenant-context.ts` - getTenantContext()
- `src/middleware.ts` - Subdomain routing

**Database:**
- `src/lib/db.ts` - Prisma client singleton
- `prisma/schema.prisma` - Main schema file
- `prisma/models/*.prisma` - 28 model files

**UI Components:**
- `src/components/ui/*` - shadcn/ui primitives
- `src/components/atom/*` - Composed atoms

### Testing Locations

**Unit Tests:**
```
src/components/platform/<feature>/__tests__/
  actions.test.ts          # Server action tests
  form.test.tsx            # Component tests
```

**E2E Tests:**
```
tests/e2e/
  <feature>.spec.ts        # Playwright tests
```

### Documentation to Update

**After Implementation:**
- [ ] Add entry to `/docs/features/<feature>.md` (if new feature)
- [ ] Update `/src/app/[lang]/docs/architecture/page.mdx` (if architectural impact)
- [ ] Update `/PRD.md` functional requirements (if PRD-level change)
- [ ] Update `/epics.md` story status (mark as completed)
- [ ] Add CHANGELOG entry for next release

---

## UX/UI Considerations

**Accessibility (WCAG 2.1 AA):**
- [ ] Keyboard navigation works
- [ ] Screen reader compatible (semantic HTML, ARIA labels)
- [ ] Color contrast ratios meet standards (4.5:1 text, 3:1 large text)
- [ ] Focus indicators visible

**Responsive Design:**
- [ ] Mobile: 375px - 767px
- [ ] Tablet: 768px - 1023px
- [ ] Desktop: 1024px+

**Internationalization:**
- [ ] All text uses dictionary keys (no hardcoded strings)
- [ ] RTL layout support (Arabic)
- [ ] LTR layout support (English)
- [ ] Date/number formatting locale-aware

**Error States:**
- [ ] Validation errors shown inline
- [ ] Toast notifications for success/error
- [ ] Loading states (spinners, skeleton loaders)

---

## Testing Approach

### Manual Testing Checklist

**Functional Tests:**
- [ ] Happy path works (main user flow)
- [ ] Validation errors display correctly
- [ ] Success messages appear
- [ ] Data persists to database
- [ ] Multi-tenant isolation works (cannot access other schools' data)

**Edge Cases:**
- [ ] Empty form submission
- [ ] Invalid data formats
- [ ] Duplicate entries
- [ ] Unauthorized access attempts
- [ ] Network errors

**Cross-Browser:**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (WebKit)

**Cross-Device:**
- [ ] Mobile (iOS + Android)
- [ ] Tablet
- [ ] Desktop

### Automated Testing

**Unit Tests:**
```typescript
describe('[Feature] Actions', () => {
  it('should create [entity] with schoolId', async () => {
    const result = await [action]({ /* data */ })
    expect(result.success).toBe(true)
    expect(result.data.schoolId).toBeDefined()
  })

  it('should throw error without authentication', async () => {
    await expect([action]({ /* data */ })).rejects.toThrow('Unauthorized')
  })
})
```

**E2E Tests:**
```typescript
test('[feature] - complete workflow', async ({ page }) => {
  // Login
  await page.goto('/login')
  // Navigate to feature
  // Fill form
  // Submit
  // Verify success
})
```

---

## Deployment Strategy

### Deployment Steps

**Automatic Deployment:**
1. Push to `main` branch
2. Vercel automatically builds and deploys
3. Production URL: https://ed.databayt.org

**Manual Verification:**
1. Check deployment logs in Vercel dashboard
2. Test feature on production URL
3. Monitor Sentry for errors

**Database Migrations:**
```bash
# Migrations are automatically applied by Vercel build
# Ensure prisma/migrations/ is committed to git
```

### Rollback Plan

**If Deployment Fails:**
1. Check Vercel build logs for errors
2. Fix issues locally, push new commit
3. Vercel auto-deploys the fix

**If Feature Has Bugs:**
1. Disable feature via feature flag (if implemented)
2. Or revert commit: `git revert HEAD && git push`
3. Vercel auto-deploys the revert

**Database Rollback:**
```bash
# If migration breaks production
pnpm prisma migrate resolve --rolled-back [migration_name]
pnpm prisma migrate deploy
```

### Monitoring

**Error Tracking:**
- Sentry automatically captures errors
- Check https://sentry.io dashboard

**Performance Monitoring:**
- Vercel Analytics tracks Core Web Vitals
- Check Vercel dashboard for metrics

**Logs:**
- Vercel Functions logs available in dashboard
- Include `requestId` in all logs for traceability

---

## Appendix

### Glossary

**Terms:**
- **Multi-Tenant**: Single codebase serves multiple schools (tenants)
- **schoolId**: Unique identifier for each school (tenant)
- **Mirror Pattern**: Route structure matches component folder structure
- **Server Action**: Function with `"use server"` directive for server-side execution

### References

**Documentation:**
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [NextAuth v5 Docs](https://authjs.dev)

**Internal:**
- `/PRD.md` - Product Requirements Document
- `/epics.md` - Epic and Story Breakdown
- `/architecture.md` - Architecture Documentation
- `/CLAUDE.md` - Development Guidelines

### Change Log

| Date | Author | Changes |
|------|--------|---------|
| [YYYY-MM-DD] | [Name] | Initial creation |

---

**Status:** [Draft | In Review | Approved | In Progress | Completed]
**Last Updated:** [YYYY-MM-DD]
