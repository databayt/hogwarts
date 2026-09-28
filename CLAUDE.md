# CLAUDE.md

> **Deployment: Cloudflare, not Vercel** (since 2026-09-07). `balqalam.com` and every `*.balqalam.com`
> school tenant are served by the `hogwarts` Worker in front of a container. Every Vercel hostname on
> the databayt accounts answers HTTP 402. Runbook: `.claude/rules/cloudflare-deploy.md`, the
> `cloudflare` skill, and `DEPLOYMENT.md`. Ship with `scripts/deploy-cloudflare.sh`.

## Quick Start

**Hogwarts** - Multi-tenant school automation platform (Next.js 16, React 19, Prisma, NextAuth v5)

```bash
pnpm install && pnpm prisma generate && pnpm dev
```

### The 9 Critical Rules

1. **Always use pnpm** — the lockfile is pnpm's, and the Cloudflare build installs from it
2. **Always include schoolId** in database queries (multi-tenant isolation)
3. **Follow mirror pattern** (routes ↔ components)
4. **Use semantic HTML** (no hardcoded `text-*` or `font-*` classes)
5. **Run `pnpm tsc --noEmit`** before builds (catches silent failures)
6. **Port 3000 only**; **central `.env` only** — never `.env.local` / `.env.x`
7. **Full seed is idempotent + the default auto-provision** — `prebuild` runs `ensure-demo.ts`, which drives the full `seedMain` against the prod demo on every deploy (short-circuits when seeded; never fails the build). `pnpm db:seed` is safe to re-run (per-phase count-guards); `SEED_FORCE=1` forces a full re-walk; `pnpm db:seed:single <name>` (`--list`) re-seeds one module. See `prisma/seeds/README.md`.
8. **Work directly on `main`** in `/Users/abdout/hogwarts` — never branches, worktrees, stashes or snapshots, never `git checkout`/`switch`, no "park" / "integration" switching. Push to production only when the user says "deploy".
9. **Protected test account** — `dev@balqalam.com` (DEVELOPER) must never be reset; bulk `updateMany` with `role:` must exclude protected emails (`.claude/rules/accounts.md`).

---

## Database Safety (CRITICAL)

**Destructive database operations are FORBIDDEN without explicit user approval.** Never (hooks auto-block most): `prisma db execute --file <migration.sql>` (re-running migration files drops/recreates tables and WIPES DATA) · `prisma db push --accept-data-loss` · `prisma migrate reset` · `DROP TABLE` / `TRUNCATE` · full migration SQL files for "sync" (they `CREATE TABLE` without `IF NOT EXISTS`).

Safe alternatives: a missing table → targeted `CREATE TABLE IF NOT EXISTS` for that table only · schema out of sync → `prisma db push` WITHOUT `--accept-data-loss`, and review warnings · a new column → `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

**Neon branch-before-touch:** before ANY schema change or data operation that could affect existing data, create a Neon branch (Neon MCP `create_branch`), test the operation there, apply to main only if it succeeded, delete the branch if it failed — zero damage.

---

## Multi-Tenant Safety (CRITICAL)

**Every database operation MUST be scoped by `schoolId`.** Missing `schoolId` = data leak across schools.

Request flow: edge middleware detects the subdomain, rewrites the URL, sets `x-subdomain` → tenant context resolves `schoolId` (impersonation > header > session) → the server action MUST include `schoolId` in ALL queries.

```
Production:    school.databayt.org → /[lang]/s/school/...   (main host: ed.databayt.org)
               school.balqalam.com → /[lang]/s/school/...   (main host: balqalam.com apex)
Development:   subdomain.localhost → /[lang]/s/subdomain/...
```

Root domains live in `src/lib/root-domain.ts` — the single source of truth for host → tenant/main classification, cookie Domain scoping (`.databayt.org` / `.balqalam.com`, per root, never cross-root) and tenant/main origin building. To serve another apex: add it there, then route it to the `hogwarts` Worker on Cloudflare (`.claude/rules/cloudflare-deploy.md`).

**Server action pattern (MANDATORY):** (1) `auth()` check, (2) `getTenantContext()` for schoolId, (3) permission check, (4) validate input with Zod, (5) execute with schoolId in the query + `revalidatePath`. Return `ActionResponse<T>`.

```typescript
import { getTenantContext } from "@/lib/tenant-context"

const { schoolId, subdomain } = await getTenantContext()
```

---

## Single-Language Storage (CRITICAL)

**All content is stored in ONE language** with a `lang` field; translation happens on demand (Google Translate API, cached in the DB). **Never use bilingual field names** (`titleEn`/`titleAr`, `nameAr`/`nameEn`).

1. **Generic field names only** — `title`, `body`, `name`, `description`
2. **`lang` field** — every content model has `lang String @default("ar")`; `School.preferredLanguage` sets the default storage language
3. **On-demand translation** — batched `localize(model, rows)` from `@/components/translation/localize` for lists; `getText()` for single values (NEVER in loops); `after(() => prewarm(...))` on writes
4. **UI constants** — a generic `label` holding the primary-language value (never `labelAr`/`labelEn`)

---

## Architecture Patterns

**Mirror pattern:** `src/app/[lang]/s/[subdomain]/(school-dashboard)/<feature>/page.tsx` → imports from `src/components/<feature>/content.tsx`.

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

**Blocks:** 72 feature blocks under `src/components/` and `src/components/school-dashboard/` are registered in `.claude/blocks.json` (regenerate with `node /Users/abdout/kun/.claude/scripts/generate-blocks.mjs .` after adding/renaming block dirs). Naming one activates the block protocol (the global rule + its hooks): read `<block>/README.md`, `ISSUE.md`, `CLAUDE.md` and the related issue first; afterwards update them, `content/docs-en/<block>.mdx` (+ `content/docs-ar/` where it exists), and comment/close the issue.

---

## Essential Commands

```bash
pnpm dev                  # Start with Turbopack
pnpm build                # Production build
pnpm tsc --noEmit         # TypeScript check (CRITICAL before builds)
pnpm prisma generate      # After schema changes
pnpm prisma migrate dev   # Create migration — disposable DB only, never prod
```

---

## Common Gotchas

1. **Server/Client boundaries** — column definitions with hooks MUST be in client components; pass the dictionary as props and `useMemo` in the client component (SSE prevention)
2. **Build failures** — hanging at "Environments: .env" = TypeScript errors
3. **Typography** — semantic HTML; import `typography` from `@/lib/typography`
4. **Navigation locale** — sidebar links: `/${locale}${item.href}`
5. **Table overflow** — platform layout `overflow-x-hidden`, DataTable `overflow-x-auto`
6. **OAuth redirects** — the callback URL is preserved via httpOnly cookies
7. **Onboarding flow** — the exact sequence lives in `src/components/onboarding/config.ts`
8. **Server-side exceptions** — hooks in server components, missing `error.tsx` boundaries; run `/diagnose-sse`
9. **Subdomain paths** — client-facing paths use `/${lang}/path` WITHOUT `/s/${subdomain}/`; the `/s/` segment is internal (middleware maps clean URLs to file-system routes). `redirect()`, `Link href` and `router.push()` must NEVER include `/s/${subdomain}/` — only `revalidatePath()` and `proxy.ts` reference `/s/`. Use `redirect(\`/${lang}/dashboard\`)`, not `redirect(\`/${lang}/s/${subdomain}/dashboard\`)`.
10. **Hardcoded strings** — ALL UI text uses dictionary keys: `ValidationHelper` for Zod, `ToastHelper` for toasts, error codes for server actions. Never hardcode English in JSX, toasts or error returns (`.claude/rules/translation.md`).

---

## Quick Reference

| Utility              | Location               | Purpose                     |
| -------------------- | ---------------------- | --------------------------- |
| `cn()`               | `@/lib/utils`          | Merge Tailwind classes      |
| `auth()`             | `@/auth`               | Session with schoolId, role |
| `db`                 | `@/lib/db`             | Prisma client singleton     |
| `getTenantContext()` | `@/lib/tenant-context` | Get school context          |

**Roles (8):** DEVELOPER (platform admin, no schoolId, all schools) · ADMIN (school administrator) · TEACHER, STUDENT, GUARDIAN, ACCOUNTANT, STAFF (school-scoped) · USER (default, no school, for onboarding). Every business model carries `schoolId` with `@@index([schoolId])` and schoolId-scoped `@@unique` constraints.

**Test accounts** — password `1234` for all. Platform (no schoolId): `dev@balqalam.com` DEVELOPER (SaaS dashboard; only this role gets in) · `user@balqalam.com` USER (onboarding) · `applicant@balqalam.com` USER (application flow, `demo.localhost:3000/apply`). Demo school: `admin@` ADMIN (school dashboard on `demo.localhost:3000`) · `accountant@` · `staff@` · `teacher@` · `student@` · `parent@` GUARDIAN — all `@balqalam.com`. Reset: `pnpm db:reset-test-user` / `pnpm db:reset-test-applicant`.

**Production:** https://ed.databayt.org + https://balqalam.com (one app, two root domains; tenants on `*.databayt.org` and `*.balqalam.com`) · **Database:** PostgreSQL on Neon · **Docs:** https://ed.databayt.org/docs

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
