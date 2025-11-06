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
- [Build System](#build-system)
- [Testing](#testing)
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

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
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
    data: { ...validated, schoolId }
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
import { z } from "zod"

export const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

export type ItemFormData = z.infer<typeof itemSchema>

// form.tsx - client component
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { itemSchema } from "./validation"

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

### Typography System

**NEVER hardcode typography classes**. Always use semantic HTML:

| Instead of | Use |
|------------|-----|
| `<div className="text-3xl font-bold">` | `<h2>` |
| `<div className="text-2xl font-semibold">` | `<h3>` |
| `<div className="text-sm text-muted-foreground">` | `<p className="muted">` |
| `<div className="text-xl">` | `<p className="lead">` |
| `<div className="text-xs">` | `<small>` |

Typography styles are defined in `src/styles/typography.css`.

### Import Aliases

```typescript
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { useFeature } from "@/hooks/use-feature"
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
  where: { schoolId, yearLevel: "10" }
})

await db.class.create({
  data: { name: "Math 101", schoolId }
})

// ❌ WRONG - missing schoolId (breaks tenant isolation)
await db.student.findMany({
  where: { yearLevel: "10" }
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

### Creating a New Feature

1. **Plan** (for complex features):
   ```bash
   /plan <feature>        # Generate PRD and architecture
   /story <feature>       # Create implementation stories
   ```

2. **Generate boilerplate**:
   ```bash
   /component StudentCard    # React component with tests
   /page students/profile    # Next.js page with mirror pattern
   /api create students      # Server action with validation
   ```

3. **Implement with TDD**:
   ```bash
   /test src/components/students/form.tsx   # Generate tests
   pnpm test -- --watch                     # Run in watch mode
   ```

4. **Validate**:
   ```bash
   /scan-errors              # Check for 204+ error patterns
   pnpm tsc --noEmit         # TypeScript validation
   /review                   # Comprehensive code review
   ```

5. **Commit & Deploy**:
   ```bash
   git add .
   git commit -m "feat: add student profile"  # Auto-validation runs
   /ship staging             # Deploy with validation
   ```

### Before Every Build

**CRITICAL**: Always validate TypeScript before building:

```bash
pnpm tsc --noEmit          # Must show 0 errors
```

**Why?** Next.js build hangs at "Environments: .env" when TypeScript errors exist (silent failure).

### Error Prevention Workflow

```bash
# 1. Detect errors before commit
/scan-errors               # Finds 204+ error patterns (7s)

# 2. Auto-fix
/fix-build                 # 95%+ success rate (7s vs 3 hours manual)

# 3. Validate fixes
/pre-commit-full           # Comprehensive validation (15s)

# 4. Commit safely
git commit -m "feat: add feature"
```

### Pre-Commit Validation

Enabled via `.claude/settings.json` - automatically runs before commits:

1. TypeScript compilation (`pnpm tsc --noEmit`)
2. Prisma client sync (if schema changed)
3. ESLint validation
4. Test execution (changed files)

**Branch-aware:**
- **Protected branches** (main/master/production): STRICT blocking
- **Feature branches**: Warning but allows override

Override with `git commit --no-verify` (not recommended).

---

## Automation & Agents

### 33 Specialized Agents

**Core**: orchestrate (master coordinator)

**Stack (7)**: next, react, shadcn, prisma, typescript, tailwind, i18n

**Quality (8)**: architecture, test, security, auth, performance, typography, type-safety, review-react

**Workflow (5)**: git-github, workflow, api, multi-tenant, database-optimizer

**DevTools (10)**: build, deps, dx, cli, tooling, docs, docs-manager, refactor, legacy, mcp

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

| Task | Agent/Command | Why |
|------|---------------|-----|
| New page/route | `/agents/next` | App Router + build expertise |
| Component optimization | `/agents/react` | Performance patterns |
| UI component | `/agents/shadcn` | Component library expert |
| Database query | `/agents/prisma` | ORM expertise |
| Type errors | `/agents/typescript` | Type system expert |
| Styling | `/agents/tailwind` | CSS utility expert |
| Translation | `/agents/i18n` | RTL/LTR expert |
| Architecture | `/agents/architecture` | Design + patterns |
| Testing | `/agents/test` | TDD expert |
| Security | `/agents/security` | OWASP expert |
| Build issues | `/agents/build` | Turbopack, pnpm |
| Complex feature | `/agents/orchestrate` | Multi-agent coordination |

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

## Build System

### Build Commands

```bash
pnpm build                   # Production build (Prisma + Next.js)
/build                       # Smart build with 4-phase validation

ANALYZE=true pnpm build      # Bundle analysis
pnpm build --profile         # Build profiling
```

### Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Cold Build | <30s | ✅ 28s |
| Incremental Build | <5s | ✅ 4s |
| HMR | <100ms | ✅ 85ms |
| Bundle Size (per route) | <100KB | ✅ 92KB |
| Cache Hit Rate | >90% | ✅ 93% |

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

| Category | Patterns | Auto-Fix | Time Saved |
|----------|----------|----------|------------|
| Dictionary Properties | 173+ | 100% | 3h → 7s |
| Prisma Field Types | 13+ | 100% | 1h → 2s |
| Enum Completeness | 2+ | 100% | 30m → 1s |
| **Total** | **204+** | **95%+** | **99.9%** |

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

4. **Typography Violations**
   - Never use `<div>` for text content
   - Use semantic HTML (h1-h6, p, small)
   - Never hardcode `text-*` or `font-*` classes

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
import { IconWrapper } from '@/components/icons/icon-wrapper'

<IconWrapper name="hands-gesture-01" size={24} />
```

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
- **Test Coverage**: 234 test files
- **MVP Status**: 100% complete, production-ready
- **AI Automation**: 33 agents, 22 commands, 7 skills
