# Multi-Tenant Architecture — Issues & Gaps

Prioritized list of 25 issues identified by comparing the Hogwarts multi-tenant implementation against Vercel Platforms best practices, OWASP multi-tenancy guidelines, and enterprise SaaS standards.

**Progress: 22 of 25 fixed** (3 remaining: #7 RLS, #12 Vercel Domains API, #21 DNS webhooks)

| #   | Status | Title                                                         |
| --- | ------ | ------------------------------------------------------------- |
| 1   | FIXED  | `debug: true` hardcoded in auth.ts                            |
| 2   | FIXED  | `/debug` listed in publicRoutes                               |
| 3   | FIXED  | Session token predictability                                  |
| 4   | FIXED  | In-memory cache → Redis distributed cache                     |
| 5   | FIXED  | Rate limiting → Redis distributed                             |
| 6   | FIXED  | Prisma schoolId enforcement (dev console.error + stack trace) |
| 7   | OPEN   | No RLS at database level (XL)                                 |
| 8   | FIXED  | Redirect callback refactored (1440→774 lines)                 |
| 9   | FIXED  | Sentry SDK wired into next.config.ts                          |
| 10  | FIXED  | ISR for school marketing pages                                |
| 11  | FIXED  | Custom domain routing via Redis in proxy.ts                   |
| 12  | OPEN   | No Vercel Domains API integration (L)                         |
| 13  | FIXED  | not-found.tsx error boundaries                                |
| 14  | FIXED  | Canonical URLs for SEO                                        |
| 15  | FIXED  | Auth logging → structured authLogger                          |
| 16  | FIXED  | requestId correlation tracking                                |
| 17  | FIXED  | Subdomain reserved words validation                           |
| 18  | FIXED  | Impersonation cookie cleared on logout                        |
| 19  | FIXED  | Circuit breaker for database failures                         |
| 20  | FIXED  | Missing FK indexes on Prisma models                           |
| 21  | OPEN   | No DNS webhook handlers (L)                                   |
| 22  | FIXED  | School join codes implemented                                 |
| 23  | FIXED  | Multi-school user switcher                                    |
| 24  | FIXED  | Prisma tenant isolation query logging                         |
| 25  | FIXED  | Auth debug logging (resolved by #15)                          |

**Severity Legend**

| Label | Meaning                                               |
| ----- | ----------------------------------------------------- |
| P0    | Critical — security risk or data leak potential       |
| P1    | High — production reliability or scaling blocker      |
| P2    | Medium — performance, SEO, or maintainability concern |
| P3    | Low — feature gap or polish item                      |

**Complexity Legend**

| Label | Effort                                        |
| ----- | --------------------------------------------- |
| S     | Small — < 1 hour, single file                 |
| M     | Medium — 1-4 hours, 2-5 files                 |
| L     | Large — 4-16 hours, multiple files + tests    |
| XL    | Extra Large — multi-day, architectural change |

---

## P0 — Critical

### 1. `debug: true` hardcoded in auth.ts

**Category:** Security
**Complexity:** S
**File:** `src/auth.ts:104`

**Gap:** NextAuth `debug: true` is hardcoded regardless of `NODE_ENV`. In production this logs full JWT payloads, OAuth tokens, and callback URLs to Vercel Function logs — visible to anyone with dashboard access.

**Impact:** Sensitive authentication data (tokens, emails, roles, schoolIds) exposed in production logs. Potential credential leakage if log aggregation services are compromised.

**Recommended Solution:**

```typescript
debug: process.env.NODE_ENV === "development",
```

**Acceptance Criteria:**

- [ ] `debug` is `false` in production
- [ ] Auth errors still logged via custom `logger` object (already configured)
- [ ] No regression in development debugging

---

### 2. `/debug` listed in publicRoutes

**Category:** Security
**Complexity:** S
**File:** `src/routes.ts:16`

**Gap:** `/debug` is listed in `publicRoutes` array, making it accessible without authentication. While no `page.tsx` currently exists at this route, adding one in the future would instantly expose it publicly. This is a preventative risk.

**Impact:** Any debug page added at this path would be publicly accessible. Common pattern is to add debug endpoints during development that accidentally ship to production.

**Recommended Solution:**

```typescript
// Remove from publicRoutes
export const publicRoutes = [
  "/",
  "/new-verification",
  "/school",
  "/client",
  "/server",
  "/setting",
  "/features",
  "/pricing",
  "/blog",
  // "/debug",  ← REMOVE
  "/docs",
  "/stream",
  "/stream/courses",
]
```

**Acceptance Criteria:**

- [ ] `/debug` removed from `publicRoutes`
- [ ] If debug page exists, requires DEVELOPER role
- [ ] No 404 regression for other public routes

---

### 3. Session token uses `Date.now()` — collision and predictability risk

**Category:** Security
**Complexity:** M
**File:** `src/auth.ts:92`

**Gap:** `generateSessionToken` creates tokens using `session_${Date.now()}`. This is:

1. **Predictable** — timestamps can be guessed within milliseconds
2. **Collision-prone** — concurrent sign-ins within the same millisecond produce identical tokens
3. **Not cryptographically random** — violates OWASP session management guidelines

**Impact:** Theoretical session fixation/prediction attack vector. In high-traffic scenarios (e.g., school-wide login at period start), collisions could cause session confusion between users.

**Recommended Solution:**

```typescript
import { randomBytes } from "crypto"

generateSessionToken: () => {
  return randomBytes(32).toString("hex")
},
```

**Acceptance Criteria:**

- [ ] Tokens are cryptographically random
- [ ] No collision in 10,000 concurrent requests
- [ ] Token format compatible with NextAuth session store

---

## P1 — High

### 4. In-memory tenant cache not shared across serverless instances

**Category:** Performance
**Complexity:** M
**Files:** `src/lib/tenant-context.ts:9-60`

**Gap:** Subdomain-to-schoolId lookups use an in-memory `Map` with 60-second TTL. In Vercel's serverless model, each function instance has its own memory space. This means:

- Every cold start triggers a database query
- Cache hit rate degrades as traffic distributes across instances
- No cache invalidation across instances when school domains change

**Impact:** Under load, N instances = N redundant database lookups for the same subdomain. School domain changes take up to 60 seconds to propagate per instance, with no cross-instance invalidation.

**Recommended Solution:**
Replace with Upstash Redis (already has env vars in `env.mjs` but unused):

```typescript
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

async function getSchoolIdFromSubdomain(
  subdomain: string
): Promise<string | null> {
  const cached = await redis.get<string>(`tenant:${subdomain}`)
  if (cached) return cached

  const school = await db.school.findUnique({
    where: { domain: subdomain },
    select: { id: true },
  })
  if (school) await redis.set(`tenant:${subdomain}`, school.id, { ex: 300 })
  return school?.id ?? null
}
```

**Acceptance Criteria:**

- [ ] Cache shared across all serverless instances
- [ ] Cache invalidation on domain change
- [ ] Graceful fallback to in-memory if Redis unavailable
- [ ] Latency < 5ms for cache hits

---

### 5. Rate limiting is per-process only (not distributed)

**Category:** Security
**Complexity:** M
**Files:** `src/lib/rate-limit.ts:8-15, 38-40`

**Gap:** Rate limiting uses an in-memory `Map` (line 40). The file's own documentation (lines 8-15) acknowledges this limitation: "Uses Map() which is NOT shared across processes. In horizontal scaling (3 Next.js instances) = 3x effective rate limit."

The rate limit implementation is comprehensive (488 lines, 14 limit configs, used in 20+ routes), but the per-process storage means an attacker can bypass limits by distributing requests across instances.

**Impact:** Auth brute-force protection is weakened proportionally to the number of active instances. An attacker hitting 3 instances gets 15 login attempts/minute instead of 5.

**Recommended Solution:**
Replace `rateLimitStore` with Upstash Redis using `@upstash/ratelimit`:

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
})
```

**Acceptance Criteria:**

- [ ] Rate limits enforced across all instances
- [ ] Existing `RATE_LIMITS` config preserved
- [ ] Fallback to in-memory if Redis unavailable
- [ ] `X-RateLimit-*` headers still returned

---

### 6. No Prisma middleware for automatic schoolId injection

**Category:** Security
**Complexity:** L
**Files:** `prisma/schema.prisma`, new `src/lib/prisma-middleware.ts`

**Gap:** Every database query relies on developers manually including `schoolId` in `where` clauses. This is documented as "human discipline required" in the security audit. A single missed `schoolId` creates a cross-tenant data leak.

**Impact:** Any server action or query that omits `schoolId` exposes data from all schools. This is the #1 multi-tenant vulnerability pattern identified by OWASP.

**Recommended Solution:**
Implement Prisma client extension that automatically injects `schoolId`:

```typescript
const db = new PrismaClient().$extends({
  query: {
    $allOperations({ model, operation, args, query }) {
      if (TENANT_SCOPED_MODELS.includes(model)) {
        const schoolId = getActiveSchoolId() // from AsyncLocalStorage
        if (schoolId) {
          args.where = { ...args.where, schoolId }
        }
      }
      return query(args)
    },
  },
})
```

**Acceptance Criteria:**

- [ ] schoolId auto-injected for all tenant-scoped models
- [ ] Opt-out mechanism for cross-tenant DEVELOPER queries
- [ ] TypeScript types updated
- [ ] All existing queries still work
- [ ] Test: query without schoolId returns only scoped data

---

### 7. No Row-Level Security (RLS) at database level

**Category:** Security
**Complexity:** XL
**Files:** `prisma/migrations/`, PostgreSQL policies

**Gap:** Tenant isolation is enforced only at the application layer (Prisma queries). If a query bypasses the ORM (raw SQL, admin tools, migration scripts), there is no database-level protection.

**Impact:** Defense-in-depth violation. Any SQL injection, raw query, or direct database access bypasses tenant isolation entirely.

**Recommended Solution:**
Implement PostgreSQL RLS policies:

```sql
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Student"
  USING ("schoolId" = current_setting('app.school_id', true));
```

Set session variable before each request:

```typescript
await db.$executeRaw`SET app.school_id = ${schoolId}`
```

**Acceptance Criteria:**

- [ ] RLS enabled on all 36 tenant-scoped tables
- [ ] Policies use `current_setting('app.school_id')`
- [ ] Session variable set in Prisma middleware
- [ ] DEVELOPER role bypasses RLS via separate connection
- [ ] Migration tested against existing data

---

### 8. 858-line redirect callback is unmaintainable

**Category:** Infrastructure
**Complexity:** L
**File:** `src/auth.ts:487-1372`

**Gap:** The `redirect` callback in `auth.ts` is 858 lines long (60% of the entire 1,432-line file). It contains 5 fallback methods for URL recovery, subdomain detection logic, school domain lookups, and locale extraction — all in a single function.

**Impact:** High risk of regression when modifying auth flows. Difficult to test individual redirect paths. New developers cannot understand the flow without significant ramp-up time.

**Recommended Solution:**
Extract into a dedicated module:

```
src/lib/auth-redirect/
  ├── index.ts           # Main redirect handler
  ├── url-recovery.ts    # 5-method callback URL retrieval
  ├── school-redirect.ts # School domain lookup + URL construction
  ├── locale.ts          # Locale extraction
  └── __tests__/         # Unit tests for each module
```

**Acceptance Criteria:**

- [ ] Redirect logic extracted to `src/lib/auth-redirect/`
- [ ] Each sub-module independently testable
- [ ] No behavior change (snapshot tests on redirect outputs)
- [ ] `auth.ts` reduced to < 600 lines

---

### 9. Sentry DSN not configured — zero error visibility

**Category:** Infrastructure
**Complexity:** S
**Files:** `.env`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

**Gap:** Sentry configuration files exist and are comprehensive (client: 48 lines, server: 38 lines, edge: 25 lines) with proper sample rates, session replay, and tenant context tagging. However, `NEXT_PUBLIC_SENTRY_DSN` in `.env` is empty — making all three configs no-ops.

**Impact:** Zero production error visibility. Auth failures, tenant isolation bugs, and server exceptions are invisible. Without Sentry, the 58 error.tsx boundaries catch errors visually but don't report them.

**Recommended Solution:**

1. Create Sentry project for Hogwarts
2. Set `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` in `.env`
3. Verify errors appear in Sentry dashboard

**Acceptance Criteria:**

- [ ] Sentry DSN configured in `.env`
- [ ] Client errors captured with session replay
- [ ] Server errors include `schoolId` context
- [ ] Sample rates: 10% traces, 100% error replays (already configured)

---

## P2 — Medium

### 10. No ISR/revalidate for school site pages

**Category:** Performance
**Complexity:** M
**Files:** `src/app/[lang]/s/[subdomain]/(school-marketing)/*/page.tsx`

**Gap:** School marketing pages (`/about`, `/academic`, `/admissions`) are server-rendered on every request with no caching. These pages change infrequently but are the most visited pages for prospective parents.

**Impact:** Every page view triggers a full server render + database query. For schools with 1,000+ daily visitors, this creates unnecessary load and slower Time to First Byte (TTFB).

**Recommended Solution:**
Add ISR with appropriate revalidation:

```typescript
// School marketing pages (change weekly)
export const revalidate = 3600 // 1 hour

// Student/teacher listings (change daily)
export const revalidate = 300 // 5 minutes

// Dashboard (real-time)
export const dynamic = "force-dynamic"
```

**Acceptance Criteria:**

- [ ] School marketing pages cached with ISR (1 hour)
- [ ] Dashboard remains dynamic
- [ ] `revalidatePath()` called when school info updated
- [ ] TTFB < 200ms for cached pages

---

### 11. Custom domain routing not in middleware

**Category:** Feature
**Complexity:** L
**Files:** `src/proxy.ts`, `src/lib/dns-service.ts`

**Gap:** The middleware (`proxy.ts`) only handles subdomain routing (`school.databayt.org`). Custom domains (`school.edu.sa`) are not detected or routed. The `DnsService` (645 lines) handles DNS verification but the middleware doesn't consume it.

**Impact:** Schools cannot use their own domain names. This is a common enterprise requirement and a feature gap vs Vercel Platforms Starter Kit.

**Recommended Solution:**
Add custom domain detection in `proxy.ts`:

```typescript
// After subdomain detection
if (!subdomain) {
  // Check if host is a custom domain
  const school = await getSchoolByCustomDomain(host)
  if (school) {
    subdomain = school.domain
  }
}
```

**Acceptance Criteria:**

- [ ] Custom domains route to correct school
- [ ] SSL handled via Vercel (automatic)
- [ ] Fallback to 404 for unknown domains
- [ ] No performance regression for subdomain routing

---

### 12. No Vercel Domains API integration

**Category:** Feature
**Complexity:** L
**Files:** `src/lib/dns-service.ts:416-453`, new `src/lib/vercel-domains.ts`

**Gap:** The Vercel domain provider in `DnsService` returns `"Vercel integration not yet implemented"` (line 452). Custom domains require Vercel API calls to register and configure SSL.

**Impact:** Domain approval workflow exists (pending → approved → verified) but cannot actually configure domains on Vercel. Manual intervention required for every custom domain.

**Recommended Solution:**
Implement Vercel Domains API client:

```typescript
// POST https://api.vercel.com/v10/projects/{projectId}/domains
// GET  https://api.vercel.com/v10/projects/{projectId}/domains/{domain}
// DELETE https://api.vercel.com/v10/projects/{projectId}/domains/{domain}
```

**Acceptance Criteria:**

- [ ] Domains added to Vercel project on approval
- [ ] SSL auto-provisioned
- [ ] Domain removed from Vercel on rejection
- [ ] Verification status synced with DomainRequest model

---

### 13. No not-found.tsx error boundaries

**Category:** Infrastructure
**Complexity:** M
**Files:** New files in `src/app/[lang]/`

**Gap:** The codebase has 58 `error.tsx` files but zero `not-found.tsx` files. When a user navigates to a non-existent page, they get Next.js default 404 instead of a branded page with navigation back to their school dashboard.

**Impact:** Poor user experience for broken links. No school branding on 404 pages. Users on school subdomains see generic 404 without context of which school they're on.

**Recommended Solution:**
Add `not-found.tsx` at key levels:

```
src/app/[lang]/not-found.tsx                           # Main domain 404
src/app/[lang]/s/[subdomain]/not-found.tsx             # School 404 (with school branding)
src/app/[lang]/(saas-dashboard)/not-found.tsx          # SaaS dashboard 404
```

**Acceptance Criteria:**

- [ ] Branded 404 page at root level
- [ ] School-branded 404 on subdomains
- [ ] Navigation links back to dashboard/home
- [ ] Internationalized (Arabic/English)

---

### 14. No canonical URLs for duplicate content SEO

**Category:** Performance
**Complexity:** M
**Files:** `src/app/[lang]/s/[subdomain]/(school-marketing)/layout.tsx`

**Gap:** School marketing pages are accessible via both:

- `school.databayt.org/about` (user-facing)
- `ed.databayt.org/en/s/school/about` (internal rewritten URL)

Without canonical URLs, search engines may index the internal URL, diluting SEO and exposing internal routing structure.

**Impact:** Duplicate content penalty from search engines. Internal URLs leaked in search results expose multi-tenant routing structure.

**Recommended Solution:**
Add canonical URL in layout metadata:

```typescript
export async function generateMetadata({ params }) {
  const { subdomain, lang } = await params
  return {
    alternates: {
      canonical: `https://${subdomain}.databayt.org/${lang}`,
    },
  }
}
```

**Acceptance Criteria:**

- [ ] Canonical URLs set on all school marketing pages
- [ ] Internal rewrite URLs not indexed
- [ ] `robots.txt` blocks `/s/` path prefix

---

### 15. Verbose auth logging could hit Vercel limits

**Category:** Infrastructure
**Complexity:** M
**Files:** `src/auth.ts:106-142`, `src/lib/auth-logger.ts`

**Gap:** Auth logging is extremely verbose — every JWT callback, session callback, and redirect logs multiple entries with full payloads. Combined with `debug: true`, each auth flow generates 10-20 log entries.

Vercel Function logs have limits:

- 4KB per log line
- 1MB per invocation
- Log retention varies by plan

**Impact:** High-traffic schools (1,000+ daily active users) could hit log limits, causing log truncation and missing error entries that matter.

**Recommended Solution:**

- Set `debug: false` in production (Issue #1)
- Reduce auth logger to `warn` and `error` levels in production
- Use structured logging with log levels:

```typescript
const LOG_LEVEL = process.env.NODE_ENV === "production" ? "warn" : "debug"
```

**Acceptance Criteria:**

- [ ] Production logs reduced to warnings and errors
- [ ] Development retains full debug logging
- [ ] No log line exceeds 4KB
- [ ] Critical auth events always logged regardless of level

---

### 16. requestId always null — no request correlation

**Category:** Infrastructure
**Complexity:** M
**Files:** `src/lib/tenant-context.ts:122`

**Gap:** `TenantContext.requestId` is always `null` (line 122). There is no correlation ID passed through the request lifecycle, making it impossible to trace a single user request across middleware → tenant context → server action → database query in logs.

**Impact:** Debugging production issues requires manual correlation of timestamps across log entries. Multi-tenant bugs (wrong school data returned) cannot be traced to the specific request that caused them.

**Recommended Solution:**
Generate or extract correlation ID:

```typescript
const requestId =
  hdrs.get("x-vercel-id") ?? hdrs.get("x-request-id") ?? crypto.randomUUID()
return { schoolId, requestId, role, isPlatformAdmin }
```

**Acceptance Criteria:**

- [ ] Every request has a unique `requestId`
- [ ] requestId propagated to auth logger and server actions
- [ ] Sentry errors tagged with requestId
- [ ] Vercel deployment ID used when available

---

### 17. No subdomain reserved words validation on school creation

**Category:** Security
**Complexity:** S
**Files:** `src/lib/subdomain-actions.ts`, `src/lib/dns-service.ts:505-533`

**Gap:** `DnsService` has `isReservedSubdomain()` with 20 reserved words (line 505-533), but `src/lib/subdomain-actions.ts` `reserveSubdomain()` does not call this validation. A school could register "api", "www", or "admin" as their subdomain.

**Impact:** School registering "api.databayt.org" would conflict with API routes. "admin.databayt.org" could be used for phishing.

**Recommended Solution:**
Call `isReservedSubdomain()` in `reserveSubdomain()` and `checkSubdomainAvailability()`:

```typescript
if (dnsService.isReservedSubdomain(subdomain)) {
  return { success: false, error: "This subdomain is reserved" }
}
```

**Acceptance Criteria:**

- [ ] Reserved words blocked during school creation
- [ ] Reserved word list includes: www, api, admin, mail, ftp, app, dashboard, portal
- [ ] Error message suggests alternatives
- [ ] Existing schools with reserved subdomains flagged for migration

---

### 18. Impersonation cookie not cleared on logout

**Category:** Security
**Complexity:** S
**Files:** `src/auth.ts` (signOut event), `src/components/saas-dashboard/tenants/actions.ts`

**Gap:** The impersonation cookie (`impersonate_schoolId`) has a 1-hour `maxAge` (line 225 of actions.ts) and is properly cleared via `stopImpersonation()` with audit logging. However, if a DEVELOPER logs out while impersonating, the cookie persists until its maxAge expires. The next login would resume impersonation unexpectedly.

**Impact:** DEVELOPER could accidentally view another school's data after re-login. Audit trail shows impersonation started but not stopped via logout.

**Recommended Solution:**
Clear impersonation cookie in signOut event:

```typescript
events: {
  async signOut() {
    const cookieStore = await cookies()
    cookieStore.delete("impersonate_schoolId")
  },
}
```

**Acceptance Criteria:**

- [ ] Impersonation cookie cleared on logout
- [ ] Audit log entry: `IMPERSONATION_STOPPED` with reason "logout"
- [ ] No impersonation state after re-login

---

## P3 — Low

### 19. No circuit breaker for database failures

**Category:** Infrastructure
**Complexity:** L
**Files:** `src/lib/db.ts`, new `src/lib/circuit-breaker.ts`

**Gap:** If the Neon PostgreSQL database becomes unavailable, every request continues to attempt database connections, increasing latency and exhausting connection pool. `getTenantContext()` catches errors silently (line 124-131) but doesn't prevent subsequent attempts.

**Impact:** During database outages, all serverless functions hang for the connection timeout (default 5s per Neon), degrading the entire platform instead of failing fast.

**Recommended Solution:**
Implement circuit breaker pattern:

```typescript
class CircuitBreaker {
  private failures = 0
  private lastFailure = 0
  private state: "closed" | "open" | "half-open" = "closed"

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open" && Date.now() - this.lastFailure < 30000) {
      throw new Error("Circuit breaker open")
    }
    // ...
  }
}
```

**Acceptance Criteria:**

- [ ] Circuit breaker wraps database calls
- [ ] Opens after 5 consecutive failures
- [ ] Half-open after 30 seconds
- [ ] Health check endpoint reports circuit state
- [ ] Graceful fallback UI when circuit open

---

### 20. Missing indexes on foreign key columns

**Category:** Performance
**Complexity:** S
**Files:** `prisma/models/*.prisma`

**Gap:** While all models have `@@index([schoolId])`, many foreign key columns used in joins lack indexes. For example, `Attendance.studentId`, `Assignment.classId`, `Invoice.studentId` are used in queries but not indexed.

**Impact:** JOIN queries degrade as data grows. A school with 1,000 students and 200 days of attendance data (200,000 rows) will see slow attendance reports without proper indexes.

**Recommended Solution:**
Add indexes to frequently queried foreign keys:

```prisma
model Attendance {
  @@index([schoolId])
  @@index([studentId])
  @@index([classId])
  @@index([date])
}
```

**Acceptance Criteria:**

- [ ] Indexes added to foreign keys used in joins
- [ ] Migration generated and applied
- [ ] Query performance validated with EXPLAIN ANALYZE
- [ ] No significant impact on write performance

---

### 21. No webhook handlers for DNS providers

**Category:** Feature
**Complexity:** L
**Files:** New `src/app/api/webhooks/dns/route.ts`

**Gap:** Domain verification is manual (pull-based). No webhook endpoints exist for DNS providers to notify when records propagate or SSL certificates are issued.

**Impact:** Domain verification requires manual polling or user-initiated checks. Schools must wait and retry verification manually instead of being notified automatically.

**Recommended Solution:**
Add webhook endpoints:

```typescript
// POST /api/webhooks/vercel/domains
// POST /api/webhooks/cloudflare/dns
```

**Acceptance Criteria:**

- [ ] Vercel domain webhook handler
- [ ] Auto-update DomainRequest status on verification
- [ ] Webhook signature validation
- [ ] Idempotent processing

---

### 22. School join codes not implemented

**Category:** Feature
**Complexity:** M
**Files:** New `prisma/models/join-code.prisma`, new `src/components/admin/join-codes/`

**Gap:** There is no mechanism for school administrators to invite users to join their school. New users must be manually added by admins or go through the onboarding flow.

**Impact:** High friction for onboarding teachers and staff. Schools with 50+ staff members need one-by-one manual creation.

**Recommended Solution:**
Implement invite code system:

- Admin generates time-limited join code (e.g., `DEMO-2024-TEACHER`)
- Code encodes: schoolId, role, expiry
- Users enter code during onboarding to auto-join school

**Acceptance Criteria:**

- [ ] Admin can generate join codes per role
- [ ] Codes expire after configurable period
- [ ] Single-use or multi-use option
- [ ] Audit trail for code usage

---

### 23. Multi-school user switcher missing

**Category:** Feature
**Complexity:** L
**Files:** New `src/components/school-switcher/`

**Gap:** Users who belong to multiple schools (e.g., a teacher at two schools, a parent with children at different schools) have no way to switch between schools without logging out and back in.

**Impact:** Multi-school users must maintain separate browser sessions or repeatedly log in/out. This is a significant UX gap for district-level users.

**Recommended Solution:**
School switcher component in sidebar:

```typescript
// Query all schools where user is a member
const schools = await db.user.findUnique({
  where: { id: userId },
  include: { school: true },
})

// On switch: update session schoolId + redirect to school subdomain
```

**Acceptance Criteria:**

- [ ] Sidebar dropdown shows all user's schools
- [ ] Switching updates JWT schoolId
- [ ] Redirect to correct subdomain after switch
- [ ] Current school highlighted

---

### 24. No Prisma query logging for tenant isolation auditing

**Category:** Security
**Complexity:** M
**Files:** `src/lib/db.ts`, new `src/lib/query-logger.ts`

**Gap:** There is no logging of Prisma queries to verify tenant isolation. In compliance audits, there is no way to prove that every query included `schoolId`.

**Impact:** Cannot demonstrate tenant isolation compliance. If a bug causes a query without `schoolId`, there is no audit trail to detect it.

**Recommended Solution:**
Add Prisma query logging middleware:

```typescript
db.$use(async (params, next) => {
  if (TENANT_MODELS.includes(params.model) && !params.args?.where?.schoolId) {
    logger.warn(`Query without schoolId on ${params.model}`, {
      action: params.action,
      model: params.model,
    })
  }
  return next(params)
})
```

**Acceptance Criteria:**

- [ ] Queries without schoolId on tenant models logged as warnings
- [ ] Log includes model, action, and caller context
- [ ] No performance impact in production (sampling or async logging)
- [ ] Dashboard for viewing isolation violations

---

### 25. Console removal in production hides auth debug info

**Category:** Documentation
**Complexity:** S
**Files:** `next.config.ts:87-91`

**Gap:** `next.config.ts` removes `console.log` and `console.debug` in production (keeping only `console.error` and `console.warn`). The auth logger uses `console.log` for debug entries, meaning auth debugging is impossible in production even when `debug: true`.

This creates a contradiction: `debug: true` enables verbose logging, but the build config strips the log calls.

**Impact:** Low — this is actually a safety net that partially mitigates Issue #1. However, it means auth debugging in production requires a code change (can't just flip an env var).

**Recommended Solution:**
Document the behavior and ensure auth logger uses appropriate levels:

- `authLogger.error()` → `console.error` (preserved in production)
- `authLogger.warn()` → `console.warn` (preserved in production)
- `authLogger.info()` → `console.warn` (promoted to survive stripping)
- `authLogger.debug()` → `console.log` (stripped in production — intentional)

**Acceptance Criteria:**

- [ ] Auth logger levels documented
- [ ] Critical auth events use `console.error`/`console.warn`
- [ ] Debug logs intentionally stripped in production
- [ ] README updated with production logging behavior

---

## Summary

| Priority | Count | Categories                                                     |
| -------- | ----- | -------------------------------------------------------------- |
| P0       | 3     | Security (3)                                                   |
| P1       | 6     | Security (3), Performance (1), Infrastructure (2)              |
| P2       | 9     | Performance (2), Feature (2), Infrastructure (3), Security (2) |
| P3       | 7     | Infrastructure (2), Performance (1), Feature (3), Security (1) |

**Quick Wins (S complexity):** Issues #1, #2, #9, #17, #18, #25
**High Impact:** Issues #3, #5, #6, #8
**Architectural:** Issues #7 (RLS), #4 (distributed cache)

---

## Cross-Reference

Issues are referenced in `content/docs-en/multi-tenancy.mdx` Section 14 (Gap Analysis).

| Doc Section          | Related Issues                        |
| -------------------- | ------------------------------------- |
| Edge Middleware      | #2, #11, #14                          |
| Tenant Context       | #4, #16                               |
| Authentication & SSO | #1, #3, #8, #15, #18                  |
| Database Isolation   | #6, #7, #20, #24                      |
| Domain Management    | #11, #12, #17, #21                    |
| RBAC Matrix          | #2                                    |
| Caching Strategy     | #4, #5, #10                           |
| Security             | #1, #2, #3, #5, #6, #7, #17, #18, #24 |
| Monitoring           | #9, #15, #16, #25                     |
| Testing              | #13                                   |
