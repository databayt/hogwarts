# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📑 Table of Contents

- [Quick Start](#quick-start)
- [Essential Commands](#essential-commands)
- [Tech Stack](#tech-stack)
- [Architecture Patterns](#architecture-patterns)
- [Multi-Tenant Safety](#multi-tenant-safety)
- [Development Workflows](#development-workflows)
- [Automation & Agents](#automation--agents)
- [Block Rebound Workflow](#block-rebound-workflow)
- [Build System](#build-system)
- [Testing](#testing)
- [UI Factory System](#ui-factory-system)
- [Common Gotchas](#common-gotchas)

---

## Quick Start

**Hogwarts** is a school automation platform built with Next.js 15, React 19, Prisma, and NextAuth v5.

### First Time Setup

```bash
pnpm install              # Install dependencies
pnpm prisma generate      # Generate Prisma client
pnpm db:seed             # Seed database
pnpm dev                 # Start development server
```

### Critical Rules

1. **Always use pnpm** (required for Vercel deployments)
2. **Always include schoolId** in database queries (multi-tenant isolation)
3. **Follow mirror pattern** - routes mirror component folders
4. **Use semantic HTML** - never hardcode `text-*` or `font-*` classes
5. **Run `pnpm tsc --noEmit`** before builds to catch TypeScript errors

---

## Essential Commands

```bash
# Development
pnpm dev                     # Start with Turbopack
pnpm build                   # Production build (Prisma + Next.js)
pnpm lint                    # Run ESLint
pnpm test                    # Run all Vitest tests
pnpm test path/to/file.tsx   # Run specific test

# Database
pnpm db:seed                 # Seed with test data
pnpm prisma generate         # Generate Prisma client
pnpm prisma migrate dev      # Create and apply migration

# E2E Testing
pnpm test:e2e               # Run Playwright tests
pnpm test:e2e:ui            # Run with UI mode
pnpm test:e2e:debug         # Debug mode

# Build Validation
pnpm tsc --noEmit           # Check TypeScript (CRITICAL before builds)
/scan-errors                # Detect 204+ error patterns
/fix-build                  # Auto-fix with 95%+ success rate

# Error Diagnosis
/diagnose-sse <route>       # Diagnose server-side exceptions
```

---

## Tech Stack

### Core Framework

- **Next.js 15.4.4** - App Router with Turbopack (dev + production)
- **React 19.1.0** - Server Components, concurrent features
- **TypeScript 5.x** - Strict mode enabled
- **Prisma 6.14.0** - PostgreSQL ORM with Neon database

### UI & Styling

- **Tailwind CSS 4** - Utility-first styling with RTL/LTR support
- **shadcn/ui** - Radix UI primitives (New York style)
- **Framer Motion** - Animations
- **Recharts** - Data visualization

### Authentication & Security

- **NextAuth v5** - JWT strategy, 8 user roles
- **bcryptjs** - Password hashing
- **Zod 4.0.14** - Schema validation
- **Multi-tenant isolation** - schoolId scoping

### Forms & Data

- **react-hook-form 7.61.1** - Form management
- **@tanstack/react-table 8.21.3** - Data tables
- **SWR** - Client-side data fetching
- **Server Actions** - Mutations with "use server"

### Internationalization

- **Arabic (RTL, default) & English (LTR)**
- **800+ translation keys**
- **Fonts**: Tajawal (Arabic), Inter (English)

### Testing & Monitoring

- **Vitest 2.0.6** - Unit testing
- **Playwright 1.55.0** - E2E testing
- **Sentry 10.12.0** - Error monitoring
- **Vercel Analytics** - Performance tracking

### Package Manager

- **pnpm 9.x** - Required (lockfile must be up-to-date for Vercel)

---

## Architecture Patterns

### Directory Structure (Mirror Pattern)

The codebase follows a **strict mirroring pattern** between routes and components:

```
src/
  app/[lang]/s/[subdomain]/(platform)/<feature>/
    page.tsx              # Imports {Feature}Content from components
    layout.tsx            # Route-specific layout

  components/<feature>/
    content.tsx           # Main UI composition (server component)
    actions.ts            # Server actions ("use server")
    validation.ts         # Zod schemas
    types.ts              # TypeScript types
    form.tsx              # Form components (client)
    table.tsx             # Data table (client)
    column.tsx            # Column definitions (client)
    use-<feature>.ts      # Custom React hooks
```

### Component Hierarchy (Build Bottom-Up)

1. **UI** (`src/components/ui/*`) - shadcn/ui primitives
2. **Atoms** (`src/components/atom/*`) - Compose 2+ UI primitives
3. **Features** (`src/components/<feature>/*`) - Business logic + UI
4. **Pages** (`src/app/<route>/page.tsx`) - Import feature content

### Server Actions Pattern

**CRITICAL**: All server actions must follow this pattern for security:

```typescript
// actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { itemSchema } from "./validation"

export async function createItem(data: FormData) {
  // 1. Authenticate and get schoolId
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) throw new Error("Unauthorized")

  // 2. Parse and validate (validate twice: client UX, server security)
  const validated = itemSchema.parse(Object.fromEntries(data))

  // 3. Execute with schoolId scope (CRITICAL for multi-tenant safety)
  const item = await db.item.create({
    data: { ...validated, schoolId },
  })

  // 4. Revalidate or redirect (never return without this)
  revalidatePath(`/items`)

  return { success: true, item }
}
```

**Requirements:**

- Start with `"use server"` directive
- Include `schoolId` from session in ALL queries
- Validate with Zod on both client (UX) and server (security)
- Call `revalidatePath()` or `redirect()` after mutations
- Return typed results, handle errors gracefully

### Form & Validation Pattern

Co-locate validation with forms:

```typescript
// validation.ts
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { itemSchema } from "./validation"

export const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

export type ItemFormData = z.infer<typeof itemSchema>

// form.tsx - client component
;("use client")

export function ItemForm() {
  const form = useForm({
    resolver: zodResolver(itemSchema),
  })
  // ...
}
```

### Data Table Column Pattern

**CRITICAL**: Column definitions using hooks MUST be generated in client components:

```typescript
// column.tsx - "use client"
"use client"

import type { ColumnDef } from "@tanstack/react-table"

export const getColumns = (dictionary?: Dictionary): ColumnDef<Row>[] => [
  // Column definitions that may use hooks like useModal
]

// content.tsx - server component (WRONG ❌)
<Table columns={getColumns(dictionary)} /> // Will cause server-side exception

// content.tsx - server component (CORRECT ✅)
<Table dictionary={dictionary} /> // Pass props instead

// table.tsx - client component (CORRECT ✅)
const columns = useMemo(() => getColumns(dictionary), [dictionary])
```

### Typography System (shadcn/ui Inline Utilities)

Use **semantic HTML with inline Tailwind classes** following shadcn/ui patterns:

```tsx
import { typography } from "@/lib/typography"

// Use constants for consistency
<h1 className={typography.h1}>Page Title</h1>
<p className={typography.p}>Body text</p>
<p className={typography.lead}>Intro paragraph</p>

// Or inline classes directly
<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
<h2 className="scroll-m-20 text-3xl font-semibold tracking-tight border-b pb-2">
<p className="leading-7 [&:not(:first-child)]:mt-6">
```

**Typography constants** in `src/lib/typography.ts`:

| Key     | Classes                                                           |
| ------- | ----------------------------------------------------------------- |
| `h1`    | `scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl`  |
| `h2`    | `scroll-m-20 text-3xl font-semibold tracking-tight border-b pb-2` |
| `h3`    | `scroll-m-20 text-2xl font-semibold tracking-tight`               |
| `h4`    | `scroll-m-20 text-xl font-semibold tracking-tight`                |
| `p`     | `leading-7 [&:not(:first-child)]:mt-6`                            |
| `lead`  | `text-xl text-muted-foreground`                                   |
| `muted` | `text-sm text-muted-foreground`                                   |
| `small` | `text-sm font-medium leading-none`                                |

**Utility classes** (`.lead`, `.muted`) remain in `src/styles/typography.css`.

### Import Aliases

```typescript
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { useFeature } from "@/hooks/use-feature"
import { Button } from "@/components/ui/button"
```

---

## Multi-Tenant Safety

**CRITICAL**: Every database operation MUST be scoped by `schoolId` for tenant isolation.

### Subdomain Routing

Middleware (`src/middleware.ts`) rewrites subdomains to tenant-scoped routes:

```
Production:    school.databayt.org → /[lang]/s/school/...
Preview:       tenant---branch.vercel.app → /[lang]/s/tenant/...
Development:   subdomain.localhost → /[lang]/s/subdomain/...
```

### Tenant Context

```typescript
import { getTenantContext } from "@/lib/tenant-context"

// In server components
const { schoolId, subdomain } = await getTenantContext()

// In server actions
const session = await auth()
const schoolId = session?.user?.schoolId
```

### Database Queries (MANDATORY schoolId)

```typescript
// ✅ CORRECT - includes schoolId
await db.student.findMany({
  where: { schoolId, yearLevel: "10" },
})

await db.class.create({
  data: { name: "Math 101", schoolId },
})

// ❌ WRONG - missing schoolId (breaks tenant isolation)
await db.student.findMany({
  where: { yearLevel: "10" },
})
```

### Prisma Models

All business models include:

- Required `schoolId` field
- `@@unique` constraints scoped by `schoolId`
- `@@index` on `schoolId` for performance

```prisma
model Student {
  id        String   @id @default(cuid())
  email     String
  schoolId  String   // Required for multi-tenancy

  school    School   @relation(fields: [schoolId], references: [id])

  @@unique([email, schoolId])  // Same email allowed across schools
  @@index([schoolId])
}
```

### User Roles & Scoping

8 roles with different scopes:

- **DEVELOPER**: Platform admin (no schoolId, access all schools)
- **ADMIN**: School administrator
- **TEACHER, STUDENT, GUARDIAN, ACCOUNTANT, STAFF**: School-scoped
- **USER**: Default role

Session includes extended user data:

```typescript
session.user.schoolId
session.user.role
session.user.isPlatformAdmin
```

---

## Development Workflows

### Manual Deploy Mode (Default)

**Describe what you need** - edits are formatted, push when ready:

```
You: "Fix the login validation bug"
     ↓
Claude: Makes changes
     ↓ (automatic)
PostToolUse Hook: Prettier formats code
     ↓
You: "push" (when ready)
     ↓
/push command runs:
  1. TypeScript check
  2. Lint check (auto-fix)
  3. Build check
  4. Show changes
  5. Commit
  6. Push
  7. Show Vercel preview URL
```

### Push Command

Say **"push"** when ready to deploy. Runs full checklist:

| Step | Check      | Action on Fail    |
| ---- | ---------- | ----------------- |
| 1    | TypeScript | STOP - fix errors |
| 2    | Lint       | Auto-fix, retry   |
| 3    | Build      | STOP - fix errors |
| 4    | Status     | Show changes      |
| 5    | Commit     | Create commit     |
| 6    | Push       | Push to remote    |
| 7    | Monitor    | Show Vercel URL   |

### Other Commands

| Command            | Use Case                   | Time  |
| ------------------ | -------------------------- | ----- |
| `push`             | Deploy with full checklist | ~45s  |
| `/quick`           | Tiny changes (skip build)  | ~10s  |
| `/dev`             | Small changes with tests   | ~30s  |
| `/validate`        | Full agent validation      | ~2min |
| `/ship production` | Production release         | ~5min |

### For Complex Features

1. **Plan**: `/plan <feature>` - Generate PRD
2. **Stories**: `/story <feature>` - Create tasks
3. **Implement**: Describe each task
4. **Deploy**: Say "push" when ready

### Pre-Commit Hooks

When you run `git commit` (manual or via push), these checks run:

- TypeScript compilation
- Prisma client sync
- ESLint validation
- Test execution

---

## Automation & Agents

### 34 Specialized Agents

**Core**: orchestrate (master coordinator)

**Stack (7)**: next, react, shadcn, prisma, typescript, tailwind, i18n

**Quality (8)**: architecture, test, security, auth, performance, typography, type-safety, review-react

**Workflow (5)**: git-github, workflow, api, multi-tenant, database-optimizer

**DevTools (11)**: build, deps, dx, cli, tooling, docs, docs-manager, refactor, legacy, mcp, prettier

**Special (2)**: debug, react-reviewer

### Essential Commands

```bash
# Code Generation
/component <name>           # React component with boilerplate
/page <path>                # Next.js page with mirror pattern
/api <method> <path>        # Server action with validation

# Quality Assurance
/review                     # Comprehensive code review
/test <file>                # Generate and run tests
/security-scan              # OWASP vulnerability audit
/fix-all                    # Auto-fix all issues

# Error Prevention (204+ patterns)
/scan-errors [pattern]      # Detect dictionary, Prisma, enum errors
/fix-build [type]           # Auto-fix with 95%+ success (7s vs 3h manual)
/validate-prisma <file>     # Validate Prisma queries
/pre-commit-full            # Comprehensive pre-commit validation

# Build & Performance
/build                      # Smart build with analysis
/optimize <file>            # Performance optimization
/benchmark [target]         # Performance benchmarking

# Internationalization
/i18n-check                 # Verify translation completeness

# Database
/migration <name>           # Generate Prisma migration

# Deployment
/ship <env>                 # Deploy with validation pipeline
```

### Agent Best Practices

| Task                   | Agent/Command          | Why                          |
| ---------------------- | ---------------------- | ---------------------------- |
| New page/route         | `/agents/next`         | App Router + build expertise |
| Component optimization | `/agents/react`        | Performance patterns         |
| UI component           | `/agents/shadcn`       | Component library expert     |
| Database query         | `/agents/prisma`       | ORM expertise                |
| Type errors            | `/agents/typescript`   | Type system expert           |
| Styling                | `/agents/tailwind`     | CSS utility expert           |
| Translation            | `/agents/i18n`         | RTL/LTR expert               |
| Architecture           | `/agents/architecture` | Design + patterns            |
| Testing                | `/agents/test`         | TDD expert                   |
| Security               | `/agents/security`     | OWASP expert                 |
| Build issues           | `/agents/build`        | Turbopack, pnpm              |
| Code formatting        | `/agents/prettier`     | shadcn/ui patterns           |
| Complex feature        | `/agents/orchestrate`  | Multi-agent coordination     |

### 7 Reusable Skills

- **dictionary-validator** - i18n validation (prevents 173+ errors)
- **prisma-optimizer** - Query optimization, field validation (prevents 13+ errors)
- **react-performance** - Component optimization
- **security-scanner** - OWASP Top 10 checklist
- **test-generator** - TDD patterns
- **api-designer** - Server action best practices
- **multi-tenant-validator** - Tenant isolation verification

### MCP Integration (13 Servers)

PostgreSQL, GitHub, Vercel, Sentry, Figma, Linear, Browser (Playwright), Stripe, Ref Tools, PostHog, Notion, Memory Bank, Slack

---

## Block Rebound Workflow

**Purpose**: Systematically optimize any block for production-readiness through research, assessment, and actionable recommendations.

### Natural Language Triggers

When the user says any of these, invoke the Block Rebound workflow:

- "rebound {block}" (e.g., "rebound finance")
- "rebound the {block} block"
- "optimize {block} for production"
- "make {block} production-ready"
- "audit {block} block"

### Valid Blocks (37 total)

- **Core**: dashboard, profile, settings, admin
- **People**: students, teachers, parents, staff
- **Academic**: subjects, classes, lessons, timetable, attendance
- **Assessment**: exams, assignments, grades
- **Finance**: finance, fees, billing, invoice, receipt, banking, salary, expenses, payroll, budget, wallet, accounts
- **Operations**: announcements, messaging, notifications, events, library

### Workflow Phases

1. **Research** (5-10 min): Web search competitors, feature benchmarking, industry best practices
2. **Assess** (10-15 min): Analyze current implementation, architecture compliance, multi-tenant safety, security, performance, i18n, test coverage
3. **Checklist** (5 min): Generate prioritized production checklist with effort estimates
4. **Recommend** (5 min): Strategic improvement plan with quick wins and phases

### Invocation

```bash
# Natural language (preferred)
rebound finance
rebound the attendance block

# Slash command
/rebound finance

# Agent direct
/agents/rebound -p "Analyze finance block"
```

### Output

Reports saved to: `.claude/workflows/rebound-outputs/{block}/rebound-{date}.md`

Contains:

- Competitor analysis and feature benchmarks
- Technical assessment with gap analysis
- Prioritized checklist (Critical → High → Medium → Low)
- Implementation recommendations with phases

### Integration

Reuses existing agents:

- `/agents/security` - Security deep-dive
- `/agents/multi-tenant` - Tenant isolation
- `/agents/performance` - Performance analysis
- `/agents/i18n` - Translation audit

---

## Build System

### Build Commands

```bash
pnpm build                   # Production build (Prisma + Next.js)
/build                       # Smart build with 4-phase validation

ANALYZE=true pnpm build      # Bundle analysis
pnpm build --profile         # Build profiling
```

### Performance Targets

| Metric                  | Target | Status  |
| ----------------------- | ------ | ------- |
| Cold Build              | <30s   | ✅ 28s  |
| Incremental Build       | <5s    | ✅ 4s   |
| HMR                     | <100ms | ✅ 85ms |
| Bundle Size (per route) | <100KB | ✅ 92KB |
| Cache Hit Rate          | >90%   | ✅ 93%  |

### Enhanced /build Command (4 Phases)

1. **Pre-Build Validation** (~15s)
   - TypeScript compilation check
   - Prisma client sync check
   - Error pattern detection (204+ patterns)
   - Process check

2. **Execute Build** (~28s)
   - Production build with Turbopack
   - Real-time progress indicators

3. **Post-Build Analysis** (~2s)
   - Performance metrics
   - Route-level bundle analysis
   - Build warnings detection

4. **Recommendations**
   - Code-splitting opportunities
   - Bundle optimization suggestions
   - Caching improvements

**Total time:** ~45s (vs potential 3+ hours of debugging)

### Error Prevention System

**204+ Error Patterns Caught:**

| Category              | Patterns | Auto-Fix | Time Saved |
| --------------------- | -------- | -------- | ---------- |
| Dictionary Properties | 173+     | 100%     | 3h → 7s    |
| Prisma Field Types    | 13+      | 100%     | 1h → 2s    |
| Enum Completeness     | 2+       | 100%     | 30m → 1s   |
| **Total**             | **204+** | **95%+** | **99.9%**  |

### Common Build Issues

**Build hangs at "Environments: .env"**

```bash
# Cause: TypeScript errors (silent failure)
# Fix:
pnpm tsc --noEmit           # Check for errors
/fix-build                  # Auto-fix if possible
```

**Prisma Client Out of Sync**

```bash
pnpm prisma generate        # Regenerate client
```

**Memory Exhaustion**

```bash
# Windows
$env:NODE_OPTIONS="--max-old-space-size=8192"

# Linux/Mac
NODE_OPTIONS="--max-old-space-size=8192" pnpm build
```

### Historical Lessons

**Build Hang - November 4, 2025:**

- **Issue**: Build hung after Prisma schema changes
- **Root Cause**: 20 TypeScript errors (silent failure)
- **Lesson**: ALWAYS check TypeScript errors BEFORE running build
- **Prevention**: Automated via `/scan-errors` and pre-commit hooks

**Finance Module - October 29, 2025:**

- **Issue**: 31+ TypeScript errors during deployment
- **Time Lost**: 3 hours, 30 commits
- **Solution**: `/scan-errors` + `/fix-build` (7s vs 3 hours)

### Emergency Recovery

```bash
# Step 1: Kill processes
taskkill /F /IM node.exe     # Windows

# Step 2: Validate TypeScript (must show 0 errors)
pnpm tsc --noEmit

# Step 3: Detect patterns
/scan-errors

# Step 4: Auto-fix
/fix-build

# Step 5: Regenerate Prisma (if schema changed)
pnpm prisma generate

# Step 6: Clean build
rm -rf .next && pnpm build
```

---

## Testing

### Unit Tests (Vitest)

```bash
pnpm test                           # Run all tests
pnpm test -- --watch                # Watch mode
pnpm test path/to/test.tsx          # Run specific test
pnpm test src/components/platform/**/*.test.tsx  # Pattern matching
```

**Test files:** `*.test.{ts,tsx}`

### E2E Tests (Playwright)

```bash
pnpm test:e2e                # Run all E2E tests
pnpm test:e2e:ui             # UI mode
pnpm test:e2e:debug          # Debug mode
pnpm test:e2e:report         # Show test report
```

### Coverage Target

**95%+ coverage** maintained via `/agents/test` agent.

---

## Development Environment

**HTTPS Localhost (Required)**

- Always use `https://localhost:3000` for local development
- Required by Facebook OAuth - HTTP won't work
- Auth cookies use `__Secure-authjs.session-token` prefix on HTTPS
- Middleware checks both HTTP and HTTPS cookie names

---

## Common Gotchas

1. **Server/Client Component Boundaries**
   - Column definitions with hooks (useModal) MUST be generated in client components
   - Never call column functions from server components
   - Pass dictionary/lang props instead and use `useMemo` to generate columns

2. **Build Failures**
   - Always run `pnpm tsc --noEmit` before builds
   - Build hanging at "Environments: .env" = TypeScript errors
   - Update lockfile before pushing: `pnpm install`

3. **Multi-Tenant Queries**
   - ALWAYS include `schoolId` in database queries
   - Missing `schoolId` breaks tenant isolation

4. **Typography Pattern**
   - Use semantic HTML with inline Tailwind classes (shadcn/ui approach)
   - Import `typography` from `@/lib/typography` for consistent classes
   - Utility classes `.lead` and `.muted` available in CSS

5. **Prisma Client**
   - Regenerate after schema changes: `pnpm prisma generate`
   - Check for 13+ field type errors: `/validate-prisma <file>`

6. **Navigation Locale**
   - Sidebar links must include locale prefix: `/${locale}${item.href}`
   - Prevents unwanted language switches

7. **Table Horizontal Overflow**
   - Platform layout: Add `overflow-x-hidden` to main wrapper
   - DataTable: Add `overflow-x-auto` to table container
   - Page wrapper: Use `w-full` without `overflow-x-auto`
   - Result: Table scrolls within container, no browser scrollbar

8. **OAuth Redirects**
   - Callback URL preservation via httpOnly cookies (`auth-callback-url`)
   - Complex redirect logic in `src/auth.ts` (400+ lines)

9. **Vercel Deployments**
   - Requires pnpm lockfile to be up-to-date
   - Run `pnpm install` locally before pushing

10. **onboarding Flow**
    - Exact sequence defined in `host-footer.tsx`
    - Navigation handled by `HostFooter` with context-aware validation

11. **Server-Side Exceptions (SSE)**
    - "Application error: a server-side exception has occurred" with digest code
    - **Root Causes**:
      - Hooks called from server components (useModal, useState in async functions)
      - Column definitions with hooks called outside client component context
      - Unhandled async errors (Stripe API, database queries without try-catch)
      - Missing null checks before property access
      - Missing error.tsx boundaries in route groups
    - **Diagnosis**: Run `/diagnose-sse /route/path` to analyze
    - **Prevention**:
      - Always add error.tsx to route groups
      - Wrap external API calls (Stripe) in try-catch
      - Use useMemo for column generation in client components
      - Check for null before arithmetic operations

---

## Key Utilities

- **cn()** (`src/lib/utils.ts`) - Merge Tailwind classes
- **auth()** (`src/auth.ts`) - Get session with extended user data
- **db** (`src/lib/db.ts`) - Prisma client singleton
- **getTenantContext()** (`src/lib/tenant-context.ts`) - Get school context
- **env** (`src/env.mjs`) - Type-safe environment variables
- **routes.ts** (`src/routes.ts`) - Route protection definitions

---

## Prisma Schema

Models split across 27 files in `prisma/models/*.prisma`:

**Core**: auth, school, staff, students, subjects, classrooms

**Academic**: assessments, attendance, lessons, timetable, exam

**Finance**: fees, banking, invoice, receipt, subscription

**Operations**: announcements, library, schedule, task, admission

**System**: branding, legal, domain, audit, stream

All business models include:

- Required `schoolId` field
- `@@index([schoolId])` for performance
- `@@unique` constraints scoped by `schoolId`

---

## Internationalization

- **Languages**: Arabic (RTL, default) & English (LTR)
- **Routing**: `[lang]` dynamic segment (`/en/...`, `/ar/...`)
- **Fonts**: Tajawal (Arabic), Inter (English)
- **Translation Keys**: 800+ keys
- **Files**: `src/components/internationalization/dictionaries.ts`
- **Detection**: Cookie → Accept-Language header → default (ar)

---

## Middleware Features

`src/middleware.ts` handles:

- **i18n Locale Detection**: Arabic or English based on cookie/headers
- **Subdomain Rewriting**: Maps subdomains to tenant-scoped routes
- **Auth Protection**: Enforces authentication on private routes
- **Request ID Generation**: Adds `x-request-id` header for traceability
- **Locale Preservation**: Ensures routes include locale prefix
- **Security Headers**: CSP, HSTS, X-Frame-Options

---

## Environment & Deployment

- **Production**: https://ed.databayt.org
- **Platform**: Vercel (automatic deployments from main branch)
- **Database**: PostgreSQL on Neon
- **Package Manager**: pnpm 9.x (lockfile must be up-to-date)

---

## Git Workflow

- **Main branch**: `main` (not master)
- **Commit format**: Conventional commits preferred
- **Pre-commit hooks**: TypeScript, ESLint, tests (auto-validation)
- **Push command**: `git push`

---

## Authentication Flow

NextAuth v5 configuration:

- JWT strategy with 24-hour sessions
- Extended session: `schoolId`, `role`, `isPlatformAdmin`
- Callbacks in `src/auth.config.ts`
- Middleware enforces auth on protected routes
- **OAuth**: Google, Facebook, Credentials (bcrypt)
- **Cookie domain**: `.databayt.org` for cross-subdomain support

---

## Performance Optimizations

- **Turbopack**: Dev + production builds (2-5x faster)
- **Code Splitting**: Automatic with App Router
- **Image Optimization**: Next/Image with WebP/AVIF
- **Bundle Optimization**: `optimizePackageImports` in next.config.ts
- **Console Removal**: Production builds remove console.log
- **Database Indexes**: All FKs and frequently queried fields

---

## Icon System

Comprehensive icon management following Anthropic design guidelines.

**Commands:**

- `/icon-add` - Add new icon
- `/icon-generate` - Generate icon with AI
- `/icon-validate [scope]` - Validate icons

**Design Requirements:**

- ViewBox: `0 0 1000 1000` or `0 0 1680 1260`
- Colors: Only `#FAF9F5` (light) and `#141413` (dark)
- Structure: Root `<svg fill="none">`, paths with explicit `fill`
- Naming: `{Category}-{Description}.svg`

**Registry:** `src/components/icons/registry.ts` (51 icons)

**Usage:**

```tsx
import { IconWrapper } from "@/components/icons/icon-wrapper"

;<IconWrapper name="hands-gesture-01" size={24} />
```

---

## UI Factory System

**AI-Powered Component Generation** following shadcn/ui patterns with full automation.

> 📚 **Complete Documentation**: See [UI_FACTORY.md](./UI_FACTORY.md) for comprehensive guide including:
>
> - Installation & Setup
> - All Commands (`/ui-add`, `/ui-generate`, `/ui-validate`, `/ui-copy-showcase`)
> - Quality Standards & Validation System
> - Radix UI Primitives Reference
> - Pre-commit Hooks
> - Troubleshooting & Examples

### Philosophy

The UI Factory follows shadcn/ui's **copy-paste architecture**:

- Components are copied to your codebase (not installed as dependencies)
- Full control over source code and styling
- No hidden dependencies or version lock-in
- Built on Radix UI primitives for accessibility
- Styled with Tailwind CSS and semantic tokens

### Architecture Layers

1. **Structure & Behavior** - Headless components (Radix UI)
2. **Visual Presentation** - Tailwind utility classes + CSS variables
3. **Composition** - Flexible, customizable through props
4. **Accessibility** - WCAG 2.1 AA compliance built-in

### Quick Start

```bash
# Add a component from shadcn registry
/ui-add button

# Generate custom component with AI
/ui-generate "create a pricing card with three tiers"

# Validate UI quality
/ui-validate

# Copy shadcn showcase components
/ui-copy-showcase
```

### Component Organization

```
src/components/
├── ui/           # shadcn/ui primitives (Button, Card, Input)
├── atom/         # Composed components
│   └── lab/      # shadcn showcase components
├── platform/     # Feature components
└── marketing/    # Landing page components
```

### MCP Integration

The shadcn MCP server enables natural language component installation:

**Configuration** (`.mcp.json`):

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

**Usage Examples:**

- "Show me all available components"
- "Add a login form"
- "Install @shadcn/pricing-card"
- "Find me a data table component"

### Commands

#### `/ui-add <component>`

Adds a component from the shadcn registry.

```bash
/ui-add button          # Add button component
/ui-add form input      # Add multiple components
/ui-add @custom/header  # From custom registry
```

#### `/ui-generate <prompt>`

AI-powered component generation following all quality standards.

```bash
/ui-generate "multi-step form with progress indicator"
/ui-generate "responsive navbar with dropdown menu"
/ui-generate "dashboard stat cards with charts"
```

**Automatic Quality Checks:**

- ✅ Semantic HTML compliance
- ✅ Semantic token usage (95%+)
- ✅ TypeScript strict mode
- ✅ Accessibility (ARIA, keyboard navigation)
- ✅ Internationalization ready
- ✅ Responsive design (mobile-first)
- ✅ Test coverage

#### `/ui-validate [file]`

Validates UI components against quality standards.

```bash
/ui-validate                          # Validate all components
/ui-validate src/components/ui/*      # Validate UI directory
/ui-validate src/components/atom/card # Validate specific component
```

**Checks:**

- Semantic token violations
- Typography violations
- Accessibility issues
- Missing internationalization
- Tailwind best practices
- Component composition patterns

#### `/ui-copy-showcase`

Copies all shadcn showcase components to `src/components/atom/lab/`.

### Agents

#### `ui-factory`

Master agent for UI development and component generation.

**Capabilities:**

- Component design and architecture
- shadcn/ui pattern implementation
- Accessibility compliance
- Responsive design
- Test generation

**Usage:**

```bash
# Generate complex UI
/agents/ui-factory "build a file upload component with drag-and-drop, progress bars, and preview"

# Refactor existing component
/agents/ui-factory "refactor the Header component to use shadcn patterns"
```

#### `shadcn-expert`

Specialized agent for shadcn/ui best practices.

**Focus Areas:**

- Radix UI primitive usage
- Component composition
- Tailwind patterns
- Theme integration
- Registry configuration

### Skills

#### `component-generator`

Generates production-ready components.

**Process:**

1. Analyze requirements
2. Select appropriate Radix primitives
3. Design component API
4. Implement with semantic tokens
5. Add TypeScript types
6. Generate tests
7. Create documentation

**Template:**

```tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ComponentProps {
  // Typed props
}

export function Component({ ...props }: ComponentProps) {
  return (
    // Implementation with semantic tokens
  )
}
```

#### `ui-validator`

Validates components against quality standards.

**Validation Rules:**

1. **Semantic Tokens** - No hardcoded colors
2. **Typography** - Semantic HTML only
3. **Accessibility** - ARIA attributes, keyboard nav
4. **Internationalization** - No hardcoded strings
5. **TypeScript** - Strict mode compliance
6. **Testing** - 95%+ coverage

### Component Quality Standards

#### 1. Semantic Token Usage (Mandatory)

```tsx
// ❌ WRONG - Hardcoded colors
<div className="bg-white dark:bg-gray-900 text-black">

// ✅ CORRECT - Semantic tokens
<div className="bg-background text-foreground">
```

**Token Categories:**

- **Backgrounds**: `bg-background`, `bg-card`, `bg-muted`, `bg-accent`
- **Text**: `text-foreground`, `text-muted-foreground`
- **Borders**: `border-border`, `border-input`
- **Actions**: `bg-primary`, `bg-secondary`, `bg-destructive`

#### 2. Semantic HTML (Mandatory)

```tsx
// ❌ WRONG - Typography utilities
<div className="text-3xl font-bold">Title</div>

// ✅ CORRECT - Semantic HTML
<h2>Title</h2>
```

#### 3. Accessibility (WCAG 2.1 AA)

```tsx
// Required attributes
<button
  aria-label="Close menu"
  aria-expanded={isOpen}
  aria-controls="menu-content"
>

// Keyboard navigation
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape') close()
  if (e.key === 'Enter' || e.key === ' ') toggle()
}
```

#### 4. Internationalization

```tsx
import { useDictionary } from "@/components/internationalization/use-dictionary"

export function Component() {
  const { dictionary } = useDictionary()

  return <button>{dictionary?.ui?.save || "Save"}</button>
}
```

#### 5. Responsive Design

```tsx
// Mobile-first approach
<div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {/* Content */}
  </div>
</div>
```

### Radix UI Primitives

**Available Primitives:**

- **Dialog** - Modals, alerts, confirmations
- **Dropdown Menu** - Context menus, action menus
- **Popover** - Tooltips, popovers, dropdowns
- **Select** - Custom select inputs
- **Checkbox** - Toggle states
- **Radio Group** - Single selection
- **Tabs** - Navigation tabs
- **Accordion** - Collapsible sections
- **Slider** - Range inputs
- **Switch** - Boolean toggles
- **Toast** - Notifications

**Pattern:**

```tsx
import * as Dialog from "@radix-ui/react-dialog"

;<Dialog.Root>
  <Dialog.Trigger asChild>
    <button>Open</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="bg-background/80 backdrop-blur-sm" />
    <Dialog.Content className="bg-card border-border border">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Pre-Commit Quality Hooks

Automatic validation before commits:

```json
{
  "hooks": {
    "pre-commit": [
      "ui-token-check", // Validate semantic tokens
      "ui-html-check", // Validate semantic HTML
      "ui-a11y-check", // Accessibility audit
      "ui-i18n-check", // Internationalization check
      "ui-test-check" // Component test coverage
    ]
  }
}
```

### Registry Configuration

**components.json:**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json",
    "@custom": {
      "url": "https://registry.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

### Component Lifecycle

1. **Generate** - `/ui-generate` or `/ui-add`
2. **Validate** - `/ui-validate` (automatic in pre-commit)
3. **Test** - `/test` generates comprehensive tests
4. **Document** - Auto-generated JSDoc comments
5. **Review** - `/review` for quality assurance
6. **Deploy** - Included in build pipeline

### Performance Patterns

```tsx
// 3. Virtualization for long lists
import { useVirtualizer } from "@tanstack/react-virtual"

// 4. Debounced search
import { useDebouncedValue } from "@/hooks/use-debounced-value"

// 1. Lazy loading
const HeavyComponent = lazy(() => import("./heavy-component"))

// 2. Memoization
const MemoizedComponent = memo(Component)
```

### Anti-Patterns to Avoid

❌ **Don't:**

- Modify shadcn/ui components directly (copy and customize)
- Use hardcoded colors or `dark:` classes
- Nest components too deeply (max 3 levels)
- Create components with too many props (>10)
- Skip accessibility attributes
- Hardcode text (always use dictionary)
- Use `div` for text content

✅ **Do:**

- Copy components and customize locally
- Use semantic tokens for all colors
- Favor composition over deep nesting
- Keep components focused (single responsibility)
- Include ARIA attributes
- Internationalize all text
- Use semantic HTML

### Troubleshooting

**Issue**: Component doesn't respond to theme changes
**Solution**: Replace hardcoded colors with semantic tokens

**Issue**: TypeScript errors after adding component
**Solution**: Run `pnpm tsc --noEmit` and fix type issues

**Issue**: Component not accessible
**Solution**: Run `/ui-validate` and add missing ARIA attributes

**Issue**: Build fails after adding component
**Solution**: Check imports, ensure "use client" directive if needed

### Success Metrics

- **100% semantic token adoption** - No hardcoded colors
- **Zero accessibility violations** - WCAG 2.1 AA compliance
- **95%+ test coverage** - All components tested
- **Sub-100ms interactions** - Optimized performance
- **RTL/LTR support** - Full internationalization

---

## Success Metrics

- **10x faster** feature development with agent coordination
- **Zero manual formatting** (auto-format on save)
- **95%+ test coverage** maintained automatically
- **204+ errors prevented** before CI/CD
- **99.9% time saved** on error debugging (7s vs 3 hours)
- **Zero build failures** in production (last 30 days)

---

## Documentation

- **Full documentation**: https://ed.databayt.org/docs
- **BMAD Guide**: `/docs/claude-code/bmad-guide`
- **Agent Reference**: `/docs/claude-code/agent-reference`
- **Command Reference**: `/docs/claude-code/commands`
- **Build System**: `/docs/build`
- **Typography**: `/docs/typography`
- **Icons**: `/docs/icons`

---

## Project Information

- **Platform**: Hogwarts - School automation platform
- **License**: MIT
- **Test Coverage**: 51 test files, **514 tests passing** (26 suites pass, 25 need mock fixes)
- **Type Safety**: ✅ 0 `db as any` casts (was 181) - all converted to prisma-guards
- **MVP Status**: ~80% functional (3 blockers fixed: Guardian Linking, Type Safety, Test Infra)
- **AI Automation**: 34 agents, 22 commands, 7 skills

### Critical Blockers (MVP)

| Blocker                    | Status         | Impact                                       | Notes                                        |
| -------------------------- | -------------- | -------------------------------------------- | -------------------------------------------- |
| Password Reset             | UNTESTED       | Works but no test coverage                   | Implemented but zero tests, RTL bug in email |
| Guardian Linking           | ✅ IMPLEMENTED | Server actions work                          | `linkGuardian` exists, tests fail on import  |
| Academic Year Setup        | 15% complete   | Cannot configure school calendar             | Actions exist, no UI or workflow             |
| Subject Teacher Assignment | INCOMPLETE     | Only homeroom teachers, not subject teachers |                                              |
| Type Safety Erosion        | ✅ FIXED       | All 181 bypasses converted to prisma-guards  | Multi-tenant now compiler-verified           |
| Test Infrastructure        | ✅ FIXED       | 514 tests passing (was 383)                  | Vitest alias resolution fixed                |

See [roadmap.mdx](</content/docs/(root)/roadmap.mdx>) for detailed URL-by-URL readiness assessment.
