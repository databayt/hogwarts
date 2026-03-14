# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Quick Start

**Hogwarts** - Multi-tenant school automation platform (Next.js 16, React 19, Prisma, NextAuth v5)

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

Every server action must: (1) `auth()` check, (2) `getTenantContext()` for schoolId, (3) permission check, (4) validate input with Zod, (5) execute with schoolId in query + `revalidatePath`. Return `ActionResponse<T>`. See existing actions for examples.

### Tenant Context

```typescript
import { getTenantContext } from "@/lib/tenant-context"

const { schoolId, subdomain } = await getTenantContext()
```

---

## Single-Language Storage (CRITICAL)

**All content is stored in ONE language** with a `lang` field. Translation happens on-demand via Google Translate API with database caching. **Never use bilingual field names** (`titleEn`/`titleAr`, `nameAr`/`nameEn`).

### Rules

1. **Generic field names only** - `title`, `body`, `name`, `description` (never `titleAr`, `nameEn`)
2. **`lang` field** - Every content model has `lang String @default("ar")`
3. **On-demand translation** - Use `getDisplayText()` from `@/lib/content-display`
4. **TranslationCache** - Translated strings cached in DB
5. **School's preferred language** - `School.preferredLanguage` determines default storage language
6. **UI constants** - Use generic `label` with primary language value (never `labelAr`/`labelEn`)

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
├── queries.ts        # Read-only database queries
├── authorization.ts  # Permission checks (RBAC)
├── validation.ts     # Zod schemas
├── form.tsx          # Client component
├── table.tsx         # Client component (DataTable)
└── columns.tsx       # Client component (column definitions)
```

### Column Definition Gotcha (SSE Prevention)

Column definitions with hooks MUST be in client components. Pass dictionary as props, use `useMemo` in client component.

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
```

---

## Common Gotchas

1. **Server/Client Boundaries** - Column definitions with hooks MUST be in client components
2. **Build Failures** - Hanging at "Environments: .env" = TypeScript errors
3. **Typography** - Use semantic HTML, import `typography` from `@/lib/typography`
4. **Prisma Client** - Regenerate after schema changes: `pnpm prisma generate`
5. **Navigation Locale** - Sidebar links: `/${locale}${item.href}`
6. **Table Overflow** - Platform layout: `overflow-x-hidden`, DataTable: `overflow-x-auto`
7. **OAuth Redirects** - Callback URL preserved via httpOnly cookies
8. **Vercel Deployments** - Requires up-to-date pnpm lockfile
9. **Onboarding Flow** - Exact sequence in `host-footer.tsx`
10. **Server-Side Exceptions** - Hooks in server components, missing error.tsx boundaries; run `/diagnose-sse`
11. **Subdomain Paths** - Client-facing paths use `/${lang}/path` WITHOUT `/s/${subdomain}/`. The `/s/` segment only exists in file system routes.

---

## Key Utilities

| Utility              | Location               | Purpose                     |
| -------------------- | ---------------------- | --------------------------- |
| `cn()`               | `@/lib/utils`          | Merge Tailwind classes      |
| `auth()`             | `@/auth`               | Session with schoolId, role |
| `db`                 | `@/lib/db`             | Prisma client singleton     |
| `getTenantContext()` | `@/lib/tenant-context` | Get school context          |

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

| Email                    | Role      | Purpose                                  |
| ------------------------ | --------- | ---------------------------------------- |
| `dev@databayt.org`       | DEVELOPER | Platform admin, SaaS dashboard access    |
| `user@databayt.org`      | USER      | Fresh user, potential SaaS subscriber    |
| `applicant@databayt.org` | USER      | Fresh user, for application flow testing |

**Demo School Accounts** (tied to demo school only):

| Email                     | Role       | Purpose                |
| ------------------------- | ---------- | ---------------------- |
| `admin@databayt.org`      | ADMIN      | School administrator   |
| `accountant@databayt.org` | ACCOUNTANT | Finance access         |
| `staff@databayt.org`      | STAFF      | Staff member           |
| `teacher@databayt.org`    | TEACHER    | Teacher access         |
| `student@databayt.org`    | STUDENT    | Student access         |
| `parent@databayt.org`     | GUARDIAN   | Parent/guardian access |

**Testing Scenarios**:

- **SaaS Dashboard**: Use `dev@databayt.org` (only DEVELOPER role can access)
- **School Dashboard**: Use `admin@databayt.org` on `demo.localhost:3000`
- **Onboarding Flow**: Use `user@databayt.org` (no school)
- **Application Flow**: Use `applicant@databayt.org` on `demo.localhost:3000/apply`
- **Reset**: `pnpm db:reset-test-user` or `pnpm db:reset-test-applicant`

### Prisma Models

All business models include `schoolId` field with `@@index([schoolId])` and `@@unique` constraints scoped by schoolId.

---

## Project Information

- **Production**: https://ed.databayt.org
- **Database**: PostgreSQL on Neon
- **Full docs**: https://ed.databayt.org/docs
