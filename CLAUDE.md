# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Quick Start

**Hogwarts** - Multi-tenant school automation platform (Next.js 15, React 19, Prisma, NextAuth v5)

```bash
pnpm install && pnpm prisma generate && pnpm db:seed && pnpm dev
```

### The 8 Critical Rules

1. **Always use pnpm** (Vercel requirement)
2. **Always include schoolId** in database queries (multi-tenant isolation)
3. **Follow mirror pattern** (routes ↔ components)
4. **Use semantic HTML** (no hardcoded `text-*` or `font-*` classes)
5. **Run `pnpm tsc --noEmit`** before builds (catches silent failures)
6. **Always use port 3000** for dev server - NEVER switch to another port
7. **Only use central `.env`** - NEVER create `.env.local`, `.env.development`, or any `.env.x` files
8. **NEVER run `pnpm db:seed`** - Always use `pnpm db:seed:single <name>`. Full seed is manual-only.

---

## Database Safety (CRITICAL)

**Destructive database operations are FORBIDDEN without explicit user approval.**

### NEVER do these (auto-blocked by hooks):

- `prisma db execute --file <migration.sql>` - Re-running migration files drops/recreates tables and WIPES DATA
- `prisma db push --accept-data-loss` - Drops tables with data
- `prisma migrate reset` - Drops entire database
- `DROP TABLE` / `TRUNCATE` SQL statements
- Running full migration SQL files for "sync" - they contain `CREATE TABLE` (not `IF NOT EXISTS`)

### Safe alternatives:

- **Missing table?** Write targeted `CREATE TABLE IF NOT EXISTS` for that specific table only
- **Schema out of sync?** Run `prisma db push` (WITHOUT `--accept-data-loss`) and review warnings
- **Need to add a column?** Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- **Neon safety**: Create a Neon branch BEFORE any risky DB operation (`neon branches create`)

### Neon Branch-Before-Touch Protocol

Before ANY schema change or data operation that could affect existing data:

1. Create a Neon branch: use Neon MCP `create_branch`
2. Test the operation on the branch
3. If successful, apply to main
4. If failed, delete the branch - zero damage

---

## Multi-Tenant Safety (CRITICAL)

**Every database operation MUST be scoped by `schoolId`** for tenant isolation. Missing `schoolId` = data leak across schools.

### Request Flow

```
1. Edge Middleware → Detects subdomain, rewrites URL, sets x-subdomain header
2. Tenant Context → Resolves schoolId (priority: impersonation > header > session)
3. Server Action → MUST include schoolId in ALL queries
```

### Subdomain Routing

```
Production:    school.databayt.org → /[lang]/s/school/...
Preview:       tenant---branch.vercel.app → /[lang]/s/tenant/...
Development:   subdomain.localhost → /[lang]/s/subdomain/...
```

### Server Action Pattern (MANDATORY)

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

  // 2. Validate (both client UX and server security)
  const validated = itemSchema.parse(Object.fromEntries(data))

  // 3. Execute with schoolId scope (CRITICAL)
  const item = await db.item.create({
    data: { ...validated, schoolId },
  })

  // 4. Revalidate or redirect
  revalidatePath(`/items`)
  return { success: true, item }
}
```

### Database Queries

```typescript
// ✅ CORRECT - includes schoolId
await db.student.findMany({
  where: { schoolId, yearLevel: "10" },
})

// ❌ WRONG - missing schoolId (breaks tenant isolation)
await db.student.findMany({
  where: { yearLevel: "10" },
})
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

📚 **Full Details**: [Multi-Tenancy Architecture](/docs/multi-tenancy)

---

## Single-Language Storage (CRITICAL)

**All content is stored in ONE language** with a `lang` field. Translation happens on-demand via Google Translate API with database caching. **Never use bilingual field names** (`titleEn`/`titleAr`, `nameAr`/`nameEn`).

### Rules

1. **Generic field names only** - `title`, `body`, `name`, `description` (never `titleAr`, `nameEn`)
2. **`lang` field** - Every content model has `lang String @default("ar")` indicating the stored language
3. **On-demand translation** - Use `getDisplayText()` from `@/lib/content-display` to translate at display time
4. **TranslationCache** - Translated strings are cached in the database to avoid repeated API calls
5. **School's preferred language** - `School.preferredLanguage` determines the default storage language

### Pattern

```typescript
// ✅ CORRECT - generic field + lang
model Announcement {
  title String?
  body  String? @db.Text
  lang  String  @default("ar")
}

// ❌ WRONG - bilingual columns
model Announcement {
  titleEn String?
  titleAr String?
}
```

### Display

```typescript
import { getDisplayText } from "@/lib/content-display"

// Stored in Arabic, user viewing in English → translates via API
const title = await getDisplayText(announcement.title, "ar", "en", schoolId)

// Same language → returns directly, no API call
const title = await getDisplayText(announcement.title, "ar", "ar", schoolId)
```

### UI Constants

Static UI labels also use generic names with the primary language value:

```typescript
// ✅ CORRECT
const SOURCES = [
  { value: "website", label: "الموقع الإلكتروني" },
  { value: "social", label: "وسائل التواصل" },
]

// ❌ WRONG
const SOURCES = [
  { value: "website", label: "Website", labelAr: "الموقع الإلكتروني" },
]
```

### Infrastructure

| File                          | Purpose                     |
| ----------------------------- | --------------------------- |
| `src/lib/google-translate.ts` | Google Translate API client |
| `src/lib/translate.ts`        | Translation with caching    |
| `src/lib/auto-translate.ts`   | Auto-translation utilities  |
| `src/lib/content-display.ts`  | `getDisplayText()` for UI   |
| `prisma/models/school.prisma` | `TranslationCache` model    |

---

## Architecture Patterns

### Mirror Pattern

```
src/app/[lang]/s/[subdomain]/(school-dashboard)/<feature>/page.tsx
  → imports from src/components/<feature>/content.tsx
```

### Feature Component Structure

```
src/components/<feature>/
├── content.tsx       # Server component (main UI)
├── actions.ts        # Server actions ("use server")
├── validation.ts     # Zod schemas
├── form.tsx          # Client component
├── table.tsx         # Client component (DataTable)
└── column.tsx        # Client component (column definitions)
```

### Column Definition Gotcha (SSE Prevention)

Column definitions with hooks MUST be in client components:

```typescript
// ❌ WRONG - in server component
<Table columns={getColumns(dictionary)} />

// ✅ CORRECT - pass props, use useMemo in client component
<Table dictionary={dictionary} />

// table.tsx (client component)
const columns = useMemo(() => getColumns(dictionary), [dictionary])
```

📚 **Full Patterns**: [Architecture](/docs/architecture) | [Patterns](/docs/pattern)

---

## Essential Commands

### Development

```bash
pnpm dev                  # Start with Turbopack
pnpm build                # Production build
pnpm tsc --noEmit         # TypeScript check (CRITICAL before builds)
```

### Database

```bash
pnpm prisma generate              # After schema changes
pnpm prisma migrate dev            # Create migration
pnpm db:seed:single <name>        # Seed one module (ALWAYS use this)
pnpm db:seed:single --list        # List available seeds
pnpm db:seed                      # NEVER run this (manual only, 60-120s)
```

### Deploy

```bash
push                      # Full checklist → commit → push → Vercel
/quick                    # Fast commit (skip build)
```

### Error Diagnosis

```bash
/scan-errors              # Detect 204+ error patterns
/fix-build                # Auto-fix (95%+ success rate)
/diagnose-sse <route>     # Server-side exception diagnosis
```

---

## Common Gotchas

1. **Server/Client Boundaries** - Column definitions with hooks MUST be in client components
2. **Build Failures** - Always run `pnpm tsc --noEmit` before builds; hanging at "Environments: .env" = TypeScript errors
3. **Multi-Tenant Queries** - ALWAYS include `schoolId` (missing = data leak)
4. **Typography** - Use semantic HTML, import `typography` from `@/lib/typography`
5. **Prisma Client** - Regenerate after schema changes: `pnpm prisma generate`
6. **Navigation Locale** - Sidebar links: `/${locale}${item.href}`
7. **Table Overflow** - Platform layout: `overflow-x-hidden`, DataTable: `overflow-x-auto`
8. **OAuth Redirects** - Callback URL preserved via httpOnly cookies
9. **Vercel Deployments** - Requires up-to-date pnpm lockfile
10. **Onboarding Flow** - Exact sequence in `host-footer.tsx`
11. **Server-Side Exceptions** - Hooks in server components, missing error.tsx boundaries; run `/diagnose-sse`
12. **Port 3000 Only** - ALWAYS use port 3000 for dev server; kill existing processes with `lsof -ti:3000 | xargs kill -9` before starting
13. **Central .env Only** - NEVER create `.env.local`, `.env.development`, or any `.env.x` files; all env vars go in central `.env`
14. **Seeding** - NEVER run `pnpm db:seed`. Always `pnpm db:seed:single <name>`. Full seed = 60-120s waste.

---

## Key Utilities

| Utility              | Location               | Purpose                     |
| -------------------- | ---------------------- | --------------------------- |
| `cn()`               | `@/lib/utils`          | Merge Tailwind classes      |
| `auth()`             | `@/auth`               | Session with schoolId, role |
| `db`                 | `@/lib/db`             | Prisma client singleton     |
| `getTenantContext()` | `@/lib/tenant-context` | Get school context          |

---

## Documentation

### Core Concepts

- [Multi-Tenancy Architecture](/docs/multi-tenancy) - Tenant isolation, request flow, gaps
- [Authentication](/docs/authentication) - OAuth, RBAC, session management
- [Architecture](/docs/architecture) - Component hierarchy, file structure
- [Patterns](/docs/pattern) - Naming conventions, server actions

### Technical Reference

- [Database](/docs/database) - Prisma models, migrations
- [Stack](/docs/stack) - Tech stack, versions
- [Internationalization](/docs/internationalization) - Arabic/English, RTL/LTR
- [Icons](/docs/icons) - Icon system, registry

### Development

- [Claude Code](/docs/claude-code) - Agents, commands, skills
- [Get Started](/docs/get-started) - First-time setup
- [Team Workflow](/docs/team-workflow) - Git, PR process

### Full Documentation

https://ed.databayt.org/docs

---

## Quick Reference

### User Roles (8)

- **DEVELOPER**: Platform admin (no schoolId, access all schools)
- **ADMIN**: School administrator
- **TEACHER, STUDENT, GUARDIAN, ACCOUNTANT, STAFF**: School-scoped
- **USER**: Default role (no school, for onboarding)

### Test Credentials

All test accounts use password: `1234`

**Platform Accounts** (no schoolId):

| Email               | Role      | Purpose                               |
| ------------------- | --------- | ------------------------------------- |
| `dev@databayt.org`  | DEVELOPER | Platform admin, SaaS dashboard access |
| `user@databayt.org` | USER      | Fresh user, potential SaaS subscriber |

**Demo School Accounts** (tied to demo school only, **cannot access other schools**):

| Email                     | Role       | Purpose                |
| ------------------------- | ---------- | ---------------------- |
| `admin@databayt.org`      | ADMIN      | School administrator   |
| `accountant@databayt.org` | ACCOUNTANT | Finance access         |
| `staff@databayt.org`      | STAFF      | Staff member           |
| `teacher@databayt.org`    | TEACHER    | Teacher access         |
| `student@databayt.org`    | STUDENT    | Student access         |
| `parent@databayt.org`     | GUARDIAN   | Parent/guardian access |

**Bulk Accounts** (tied to demo school):

- `teacher1@databayt.org` to `teacher99@databayt.org` (100 teachers)
- `student1@databayt.org` to `student999@databayt.org` (1000 students)
- `parent1@databayt.org` to `parent1999@databayt.org` (2000 guardians)

**Testing Scenarios**:

- **SaaS Dashboard**: Use `dev@databayt.org` (only DEVELOPER role can access)
- **School Dashboard**: Use `admin@databayt.org` on `demo.localhost:3000`
- **Onboarding Flow**: Use `user@databayt.org` (no school, for testing "Get Started" → onboarding flow)
- **RBAC Testing**: Compare access between roles on same routes
- **Cross-subdomain SSO**: Login on main domain, access school subdomain

**Reset Test User** (`user@databayt.org`):
This account should stay fresh (no schoolId, USER role) for onboarding tests. If it gets modified during testing, reset with:

```bash
pnpm db:reset-test-user    # Reset user@databayt.org to fresh state
```

Or re-run the full seed: `pnpm db:seed`

### Prisma Models

All business models include `schoolId` field with `@@index([schoolId])` and `@@unique` constraints scoped by schoolId.

### Import Aliases

```typescript
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
```

---

## Project Information

- **Platform**: Hogwarts - School automation platform
- **Production**: https://ed.databayt.org
- **Database**: PostgreSQL on Neon
- **Package Manager**: pnpm 9.x
- **Test Coverage**: 514 tests passing
- **AI Automation**: 34 agents, 22 commands, 7 skills
