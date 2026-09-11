---
name: "source-command-diagnose-sse"
description: "Migrated source command `diagnose-sse`"
---

# source-command-diagnose-sse

Use this skill when the user asks to run the migrated source command `diagnose-sse`.

## Command Template

# SSE Diagnosis Command

**Command**: `/diagnose-sse`
**Agent**: `sse`
**Skill**: `sse-scanner`

Diagnose and fix Next.js server-side exceptions ("Application error: a server-side exception has occurred").

---

## Quick Usage

```bash
# Diagnose by URL
/diagnose-sse /admin/billing
/diagnose-sse /en/students/123

# Diagnose by file path
/diagnose-sse src/components/school-dashboard/billing/content.tsx

# Diagnose by error digest
/diagnose-sse digest:2286872223

# Full app scan
/diagnose-sse --full

# Scan specific route group
/diagnose-sse (school-dashboard)
```

---

## What It Does

1. **Resolves URL to files** - Maps route to page.tsx and components
2. **Traces component chain** - Follows imports to find all related files
3. **Detects 15 SSE patterns** - Browser APIs, hooks, external APIs, null access
4. **Reports by severity** - Critical > High > Medium > Low
5. **Offers auto-fixes** - One-click fixes for safe patterns
6. **Verifies with TypeScript** - Ensures fixes compile

---

## SSE Error Patterns Detected

### Critical (Definite SSE)

| Pattern                  | Example                    | Auto-Fix |
| ------------------------ | -------------------------- | -------- |
| Browser API in server    | `window.location.reload()` | Yes      |
| Hook in server component | `useState()` in async func | Yes      |
| Column hooks from server | `getColumns()` with hooks  | Manual   |

### High (Likely SSE)

| Pattern                | Example                           | Auto-Fix |
| ---------------------- | --------------------------------- | -------- |
| Missing error.tsx      | Route without boundary            | Yes      |
| Unhandled external API | `stripe.subscriptions.retrieve()` | Yes      |
| Null property access   | `user.email.toLowerCase()`        | Yes      |

### Medium (Edge Case SSE)

| Pattern                 | Example                 | Auto-Fix |
| ----------------------- | ----------------------- | -------- |
| Deep dictionary access  | `dict.a.b.c.d`          | Yes      |
| Arithmetic on undefined | `x?.value + 100`        | Yes      |
| Missing "use client"    | Hooks without directive | Yes      |

---

## Output Format

```
🔍 SSE DIAGNOSIS: /admin/billing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Files: page.tsx → content.tsx → billing-page.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CRITICAL (1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BROWSER API IN SERVER COMPONENT
   📍 content.tsx:81
   💻 window.location.reload()
   ✅ Fix: throw new Error() → error.tsx
   🔧 Auto-fix: Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ error.tsx exists
✅ loading.tsx exists
✅ "use client" correct

Apply auto-fixes? [Y/n]
```

---

## Full Scan Mode

```bash
/diagnose-sse --full
```

Scans all 47+ routes:

```
🔍 FULL SSE SCAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Routes: 47 | Files: 312 | Time: 3.2s

🔴 Critical: 2 | ⚠️ High: 5 | 🔶 Medium: 8

ROUTES WITH ISSUES:
  /admin/billing     🔴 1 critical
  /students          ⚠️ 1 high
  /exams/manage      ⚠️ 1 high

Run: /diagnose-sse /admin/billing
```

---

## Integration

```bash
# Full diagnostic workflow
/diagnose-sse /route     # Find SSE issues
/fix-build               # Fix TypeScript errors
/scan-errors             # Verify all patterns
pnpm tsc --noEmit        # Final check
```

---

## URL Resolution

| URL              | Resolves To                                                      |
| ---------------- | ---------------------------------------------------------------- |
| `/admin/billing` | `src/app/[lang]/s/[subdomain]/(platform)/admin/billing/page.tsx` |
| `/en/students`   | `src/app/[lang]/s/[subdomain]/(platform)/students/page.tsx`      |
| `/pricing`       | `src/app/[lang]/(marketing)/pricing/page.tsx`                    |

---

## Prevention

Add to pre-commit:

```json
{
  "hooks": {
    "pre-commit": ["sse-scanner --staged"]
  }
}
```

---

**Agent**: Uses `@sse` subagent for analysis
**Skill**: Uses `sse-scanner` for pattern detection
**Status**: Production Ready
