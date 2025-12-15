# SSE Scanner Skill

**Purpose**: Diagnose and fix Next.js server-side exceptions ("Application error: a server-side exception has occurred")

## Quick Usage

```bash
# Scan specific route by URL
"Run sse-scanner on /en/admin/billing"

# Scan by file path
"Run sse-scanner on src/app/[lang]/s/[subdomain]/(platform)/admin/billing"

# Scan specific component
"Run sse-scanner on src/components/platform/billing/content.tsx"

# Full app scan
"Run sse-scanner --full"

# Scan route group
"Run sse-scanner on (platform)"
```

## SSE Error Patterns (15 Categories)

### Category 1: Browser APIs in Server Components (CRITICAL)

**Pattern**: `window`, `document`, `navigator`, `localStorage`, `sessionStorage`

```typescript
// ❌ SSE CAUSE - Browser API in async function (server component)
export default async function Page() {
  return <Button onClick={() => window.location.reload()}>Retry</Button>
}

// ✅ FIX - Throw error to client error boundary
export default async function Page() {
  throw new Error("Error message");  // Caught by error.tsx
}
```

**Detection Regex**:

```regex
^(?!.*"use client").*window\.|document\.|navigator\.|localStorage\.|sessionStorage\.
```

### Category 2: Hooks in Server Components (CRITICAL)

**Pattern**: React hooks called outside client components

```typescript
// ❌ SSE CAUSE - useState in server component
export default async function Page() {
  const [state, setState] = useState(false);  // FAILS
}

// ❌ SSE CAUSE - Column function with hooks called from server
// columns.tsx
export function getColumns() {
  return [{
    cell: () => {
      const { openModal } = useModal();  // Hook called during render
      return <button>Edit</button>
    }
  }]
}

// content.tsx (Server Component)
const columns = getColumns();  // ❌ Hook runs on server!

// ✅ FIX - Generate columns in client component
// table.tsx ("use client")
const columns = useMemo(() => getColumns(dictionary), [dictionary])
```

**Detection Regex**:

```regex
^(?!.*"use client").*use[A-Z][a-zA-Z]*\(
```

### Category 3: Missing "use client" Directive (CRITICAL)

**Pattern**: Client-only code without directive

```typescript
// ❌ SSE CAUSE - Hooks without directive
import { useEffect, useEffect, useState, useState } from "react"

export function Component() {
  const [state, setState] = useState(false)
}

// ✅ FIX - Add directive
;("use client")
```

**Detection**: Check first 10 lines for `"use client"` if file contains hooks

### Category 4: Unhandled External API Errors (HIGH)

**Pattern**: Stripe, Prisma, fetch without try-catch

```typescript
// ❌ SSE CAUSE - Stripe error crashes page
const subscription = await stripe.subscriptions.retrieve(id)

// ✅ FIX - Wrap in try-catch
try {
  const subscription = await stripe.subscriptions.retrieve(id)
} catch (error) {
  console.error("Stripe error:", error)
  return null
}
```

**Detection**: External API calls not wrapped in try-catch

### Category 5: Null Property Access (HIGH)

**Pattern**: Accessing properties on potentially null values

```typescript
// ❌ SSE CAUSE - user might be null
const isPaid = user.stripeCurrentPeriodEnd.getTime() > Date.now()

// ✅ FIX - Null check
const isPaid = user?.stripeCurrentPeriodEnd
  ? user.stripeCurrentPeriodEnd.getTime() > Date.now()
  : false
```

**Detection Regex**:

```regex
\.\w+\.\w+\(\)  // Deep method calls without optional chaining
```

### Category 6: Missing Error Boundaries (HIGH)

**Pattern**: Route groups without error.tsx

```typescript
// Required for every route group
src/app/[lang]/s/[subdomain]/(platform)/admin/billing/
├── page.tsx     ✅ Required
├── error.tsx    ⚠️ MISSING - Add this!
├── loading.tsx  ✅ Recommended
```

**Detection**: Check for error.tsx in route directories

### Category 7: Arithmetic on Undefined (MEDIUM)

**Pattern**: Math operations on possibly undefined values

```typescript
// ❌ SSE CAUSE - undefined + 86400000 = NaN
const expiry = user.expiryTime?.getTime() + 86_400_000

// ✅ FIX - Guard the arithmetic
const expiry = user.expiryTime ? user.expiryTime.getTime() + 86_400_000 : null
```

### Category 8: Deep Dictionary Access (MEDIUM)

**Pattern**: Accessing nested dictionary properties without guards

```typescript
// ❌ SSE CAUSE - Throws if any level undefined
const title = dictionary.school.billing.title

// ✅ FIX - Optional chaining with fallback
const title = dictionary?.school?.billing?.title ?? "Billing"
```

### Category 9: Async Component Import Errors (MEDIUM)

**Pattern**: Incorrect async/dynamic imports

```typescript
// ❌ SSE CAUSE - Wrong dynamic import
const Component = await import("./client-component")

// ✅ FIX - Use next/dynamic for client components
const Component = dynamic(() => import("./client-component"), { ssr: false })
```

### Category 10: Server Action Throws (MEDIUM)

**Pattern**: Server actions that throw without proper handling

```typescript
// ❌ SSE CAUSE - Throw not caught by caller
"use server"
export async function deleteItem(id: string) {
  if (!id) throw new Error("Missing ID") // Crashes page
}

// ✅ FIX - Return error result
;("use server")
export async function deleteItem(id: string) {
  if (!id) return { success: false, error: "Missing ID" }
}
```

### Category 11: Edge Runtime Incompatibility (MEDIUM)

**Pattern**: Node.js APIs in Edge runtime

```typescript
import fs from "fs"

// ❌ SSE CAUSE - fs not available in Edge
export const runtime = "edge"

// ✅ FIX - Use edge-compatible alternatives or remove runtime
export const runtime = "nodejs"
```

### Category 12: Prisma Edge Runtime (MEDIUM)

**Pattern**: Prisma without edge adapter

```typescript
// ❌ SSE CAUSE - Prisma needs adapter for Edge
export const runtime = "edge"
const data = await db.user.findMany()

// ✅ FIX - Use Node.js runtime or configure Prisma Edge
export const runtime = "nodejs"
```

### Category 13: Missing Environment Variables (MEDIUM)

**Pattern**: Accessing undefined env vars

```typescript
// ❌ SSE CAUSE - Undefined env var
const apiKey = process.env.STRIPE_SECRET_KEY
stripe.setApiKey(apiKey) // Fails if undefined

// ✅ FIX - Check and throw meaningful error
const apiKey = process.env.STRIPE_SECRET_KEY
if (!apiKey) throw new Error("STRIPE_SECRET_KEY not configured")
```

### Category 14: Redirect After Response (LOW)

**Pattern**: Calling redirect() after returning JSX

```typescript
// ❌ SSE CAUSE - Redirect after return impossible
export default async function Page() {
  if (condition) {
    return <div>Loading...</div>
  }
  redirect('/dashboard');  // Never reached or causes error
}

// ✅ FIX - Redirect before any return
export default async function Page() {
  if (!condition) {
    redirect('/dashboard');
  }
  return <div>Content</div>
}
```

### Category 15: Circular Dependencies (LOW)

**Pattern**: Import cycles causing runtime errors

**Detection**: Use dependency graph analysis

## Scan Process

### 1. URL-to-File Resolution

```typescript
// URL: /en/admin/billing
// Resolves to: src/app/[lang]/s/[subdomain]/(platform)/admin/billing/page.tsx

// URL patterns:
// /[locale]/...        → src/app/[lang]/...
// /s/[tenant]/...      → src/app/[lang]/s/[subdomain]/...
// /(platform)/...      → src/app/[lang]/s/[subdomain]/(platform)/...
```

### 2. Component Chain Analysis

For each route:

1. Read `page.tsx` (entry point)
2. Extract all imports
3. Recursively analyze imported files
4. Check for server/client boundary violations

### 3. Pattern Detection

Run all 15 detection patterns against:

- Route files (page.tsx, layout.tsx, loading.tsx)
- Imported components
- Server actions
- Utility functions

### 4. Auto-Fix Application

Apply automatic fixes where safe:

- Add missing "use client"
- Add error.tsx boundaries
- Replace browser APIs with throws
- Wrap external APIs in try-catch
- Add null checks

## Output Format

```
🔍 SSE SCANNER RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Route: /en/admin/billing
Files Analyzed: 8
Issues Found: 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CRITICAL ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BROWSER API IN SERVER COMPONENT
   File: src/components/platform/billing/content.tsx:81
   Code: window.location.reload()
   Fix: Replace with throw new Error() → error.tsx handles retry
   Auto-fix: ✅ Available

2. HOOK IN SERVER CONTEXT
   File: src/components/platform/billing/columns.tsx:15
   Code: useModal() called in getColumns()
   Fix: Move to client component with useMemo
   Auto-fix: ❌ Manual required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ HIGH PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. UNHANDLED STRIPE API
   File: src/components/marketing/pricing/lib/subscription.ts:51
   Code: stripe.subscriptions.retrieve(id)
   Fix: Wrap in try-catch with fallback
   Auto-fix: ✅ Available

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASSED CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ error.tsx exists
✅ loading.tsx exists
✅ All "use client" directives present
✅ Dictionary access safe
✅ No circular dependencies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMMENDED ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Apply auto-fixes (2 available)
2. Manual fix required for hook issue
3. Run pnpm tsc --noEmit to verify

Apply auto-fixes? [Y/n]
```

## Full App Scan

When `--full` flag is used:

1. Find all route groups
2. Scan each route for all 15 patterns
3. Generate summary report
4. Prioritize by severity

```bash
# Full scan output
🔍 FULL APP SSE SCAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Routes Scanned: 47
Files Analyzed: 312
Time: 3.2s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY BY SEVERITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 Critical: 2 issues
⚠️ High: 5 issues
🔶 Medium: 8 issues
🔸 Low: 3 issues

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 ISSUES BY ROUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/admin/billing     🔴 2 issues
/students          ⚠️ 1 issue
/exams/manage      ⚠️ 1 issue
/finance/invoice   🔶 2 issues
...

Detailed report: .claude/reports/sse-scan-2025-12-01.md
```

## Integration

### Pre-commit Hook

```json
{
  "hooks": {
    "pre-commit": ["sse-scanner --staged"]
  }
}
```

### CI/CD

```yaml
- name: SSE Scan
  run: claude "Run sse-scanner --full --fail-on-critical"
```

### With Other Commands

```bash
/diagnose-sse /route   # Uses this skill
/scan-errors           # Includes SSE patterns
/fix-build             # Auto-fixes SSE issues
/pre-commit-full       # Runs SSE check
```
