# Server-Side Exception Prevention & Resolution Guide

**Last Updated:** 2025-11-03
**Version:** 1.0

This document provides comprehensive guidance for preventing, diagnosing, and fixing the recurring "Application error: a server-side exception has occurred" errors across the Hogwarts platform.

---

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Root Causes](#root-causes)
3. [Fix Patterns](#fix-patterns)
4. [Prevention Checklist](#prevention-checklist)
5. [Testing Guide](#testing-guide)
6. [Platform-Wide Audit](#platform-wide-audit)

---

## Quick Diagnosis

When you see "Application error: a server-side exception has occurred":

### Step 1: Identify the Error Pattern

```bash
# Check Vercel logs or local console
# Look for one of these patterns:

# Pattern A: Date Serialization Error
"TypeError: Cannot read property 'toISOString' of null"
"TypeError: Cannot read property 'toISOString' of undefined"

# Pattern B: Cache Serialization Error
"Error: Functions cannot be passed directly to Client Components"
"Error: JSON.stringify circular structure"

# Pattern C: Prisma Relation Error
"Unknown field 'creator' on model 'Announcement'"
"Invalid select argument"
```

### Step 2: Locate the File

- **Error Digest provided**: Use Vercel logs to trace stack
- **No digest**: Check recently modified `content.tsx` files
- **Multiple pages failing**: Look for shared utilities

### Step 3: Apply Quick Fix

Jump to the appropriate section:
- [Date Serialization Fix](#pattern-a-date-serialization)
- [Cache Fix](#pattern-b-cache-misuse)
- [Prisma Relation Fix](#pattern-c-prisma-relations)

---

## Root Causes

### Pattern A: Date Serialization

**Frequency**: 🔴 **CRITICAL** (70+ files affected)

**The Problem**:
```typescript
// ❌ UNSAFE: Crashes if createdAt is null/undefined
data = rows.map((item) => ({
  ...item,
  createdAt: item.createdAt.toISOString()
}))
```

**Why It Happens**:
1. **Database returns null** - Missing data, failed migrations, or corrupted records
2. **Optional fields** - Prisma schema allows null but code assumes non-null
3. **Type casting hides issues** - `(date as Date)` forces TypeScript to ignore null possibility

**Example Error**:
```
Application error: a server-side exception has occurred
Digest: 111899502

TypeError: Cannot read property 'toISOString' of null
  at AnnouncementsContent (content.tsx:43)
```

---

### Pattern B: Cache Misuse

**Frequency**: 🟡 **MODERATE** (6 files affected)

**The Problem**:
```typescript
// ❌ BROKEN: Creates new cache function on every request
async function getCachedData(schoolId: string, params: any) {
  const cachedFn = unstable_cache(
    async () => getData(schoolId, params),
    ['data', schoolId, JSON.stringify(params)], // JSON.stringify fails with complex objects
    { revalidate: 60, tags: [`data-${schoolId}`] }
  );
  return cachedFn(); // New instance every time!
}
```

**Why It Happens**:
1. **Cache function inside request handler** - Violates Next.js patterns
2. **JSON.stringify complex params** - Fails with sort arrays, functions, circular refs
3. **Cache pollution** - New function created on every request
4. **Multi-tenant issues** - Cache not properly scoped by schoolId

**Example Error**:
```
Application error: a server-side exception has occurred
Digest: 970203480

Error: Functions cannot be passed directly to Client Components
  at unstable_cache (content.tsx:25)
```

---

### Pattern C: Prisma Relations

**Frequency**: 🟠 **MODERATE** (83 files with includes/selects)

**The Problem**:
```typescript
// ❌ BROKEN: 'creator' relation doesn't exist in schema
const announcement = await db.announcement.findFirst({
  select: {
    id: true,
    creator: { // Field not defined in schema!
      select: { name: true }
    }
  }
})
```

**Why It Happens**:
1. **Schema mismatch** - Relation name changed but queries not updated
2. **TypeScript doesn't catch** - Prisma client generation happens separately
3. **Copied code** - Relation exists in one model but not another

**Example Error**:
```
Application error: a server-side exception has occurred
Digest: 1091438202

PrismaClientValidationError: Unknown field 'creator' on model 'Announcement'
  at getAnnouncementsList (queries.ts:81)
```

---

## Fix Patterns

### Pattern A: Date Serialization

#### ✅ CORRECT Implementation

```typescript
// Option 1: Inline null check (recommended for single fields)
data = rows.map((item) => ({
  ...item,
  createdAt: item.createdAt
    ? new Date(item.createdAt).toISOString()
    : new Date().toISOString(), // Fallback to current time
}))

// Option 2: Helper function (recommended for multiple date fields)
function safeSerializeDate(date: Date | null | undefined, fallback?: string): string {
  if (!date) return fallback || new Date().toISOString();
  try {
    return new Date(date).toISOString();
  } catch (error) {
    console.error('[safeSerializeDate] Invalid date:', date, error);
    return fallback || new Date().toISOString();
  }
}

// Usage:
data = rows.map((item) => ({
  ...item,
  createdAt: safeSerializeDate(item.createdAt),
  updatedAt: safeSerializeDate(item.updatedAt),
  publishedAt: safeSerializeDate(item.publishedAt),
}))

// Option 3: Bulk serialization (for many date fields)
function safeSerializeDates<T extends Record<string, any>>(
  obj: T,
  dateFields: (keyof T)[]
): T {
  const result = { ...obj };
  dateFields.forEach((field) => {
    if (obj[field]) {
      result[field] = new Date(obj[field]).toISOString() as any;
    } else {
      result[field] = new Date().toISOString() as any;
    }
  });
  return result;
}

// Usage:
data = rows.map((item) =>
  safeSerializeDates(item, ['createdAt', 'updatedAt', 'publishedAt'])
)
```

#### 🛡️ Add Error Boundary

```typescript
export default async function Content({ searchParams }: Props) {
  let data = []
  let total = 0

  try {
    const { rows, count } = await getData();

    data = rows.map((item) => ({
      ...item,
      createdAt: safeSerializeDate(item.createdAt),
    }));

    total = count;
  } catch (error) {
    console.error('[Content] Error:', error);
    // Return empty data - shows "No results" instead of crash
    data = [];
    total = 0;
  }

  return <DataTable data={data} total={total} />
}
```

---

### Pattern B: Cache Misuse

#### ❌ WRONG Approaches

```typescript
// DON'T: Cache function inside request handler
async function getCached(schoolId: string) {
  const fn = unstable_cache(/*...*/); // ❌ New function every request
  return fn();
}

// DON'T: JSON.stringify complex params
unstable_cache(
  fn,
  ['key', JSON.stringify(params)] // ❌ Fails with arrays, functions
)

// DON'T: Missing schoolId in cache key
unstable_cache(
  fn,
  ['data'] // ❌ All schools share cache!
)
```

#### ✅ CORRECT Solutions

**Solution 1: Remove Caching (Recommended)**
```typescript
// Database queries are FAST with proper indexes
// Don't add caching complexity unless proven slow

export default async function Content({ searchParams }: Props) {
  const { schoolId } = await getTenantContext();

  // Direct query - clean and simple
  const { rows, count } = await getDataList(schoolId, {
    ...searchParams
  });

  return <DataTable data={rows} total={count} />
}
```

**Solution 2: Module-Level Cache (Advanced)**
```typescript
// ONLY use for static/rarely-changing data
// Define at MODULE level, not inside functions

import { unstable_cache } from 'next/cache';

// ✅ Module-level declaration
export const getCachedSchoolSettings = unstable_cache(
  async (schoolId: string) => {
    return db.school.findUnique({
      where: { id: schoolId },
      select: { name: true, logo: true }
    });
  },
  ['school-settings'], // schoolId passed as function param
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['school-settings'] // Static tag for revalidation
  }
);

// Usage in component
const settings = await getCachedSchoolSettings(schoolId);
```

**Solution 3: Database Optimization**
```typescript
// BEST APPROACH: Optimize at database level

// 1. Add proper indexes (prisma/schema.prisma)
model Announcement {
  // ...
  @@index([schoolId, published, createdAt]) // Composite index
  @@index([schoolId, scope]) // Frequent filter
}

// 2. Limit query size
const announcements = await db.announcement.findMany({
  where: { schoolId },
  orderBy: { createdAt: 'desc' },
  take: 20, // Limit results
  select: { // Only fetch needed fields
    id: true,
    title: true,
    createdAt: true,
  }
});

// 3. Use pagination
const { skip, take } = getPagination(page, perPage);
```

---

### Pattern C: Prisma Relations

#### ✅ FIX Process

**Step 1: Verify Schema**
```bash
# Check if relation exists in schema
cat prisma/models/announcement.prisma | grep -A 5 "model Announcement"

# Example output:
model Announcement {
  createdBy String?
  creator   User? @relation("AnnouncementCreator", ...) // ✅ Exists!
}
```

**Step 2: Fix Query**
```typescript
// ❌ BEFORE: Wrong relation name
const data = await db.announcement.findFirst({
  include: {
    author: true // ❌ Field doesn't exist
  }
})

// ✅ AFTER: Correct relation name
const data = await db.announcement.findFirst({
  include: {
    creator: true // ✅ Matches schema
  }
})

// Or use select for specific fields:
const data = await db.announcement.findFirst({
  select: {
    id: true,
    title: true,
    creator: {
      select: {
        id: true,
        name: true,
        email: true,
      }
    }
  }
})
```

**Step 3: Handle Optional Relations**
```typescript
// If relation might be null
const data = await db.announcement.findFirst({
  include: {
    creator: true // Might be null if createdBy is null
  }
})

// Safe access in mapping
const result = {
  ...data,
  authorName: data.creator?.name || 'Unknown',
  authorEmail: data.creator?.email || 'N/A',
}
```

---

## Prevention Checklist

Use this checklist for ALL new `content.tsx` files:

### Date Serialization
- [ ] All date fields use `safeSerializeDate()` or null checks
- [ ] No bare `.toISOString()` calls without null check
- [ ] No `(date as Date)` type casts
- [ ] Try-catch block around data mapping
- [ ] Test with null date values in database

### Caching
- [ ] No `unstable_cache` inside request handlers
- [ ] If caching used, declared at module level
- [ ] Cache keys include `schoolId` for multi-tenant isolation
- [ ] No `JSON.stringify` on complex params (sort arrays, etc.)
- [ ] Database has proper indexes instead of app-level caching

### Prisma Queries
- [ ] All `include`/`select` relations verified in schema
- [ ] Relation names match schema exactly (case-sensitive)
- [ ] Optional relations handled with `?.` operator
- [ ] Run `pnpm prisma generate` after schema changes

### Error Handling
- [ ] Try-catch blocks around async operations
- [ ] Console.error logs for debugging
- [ ] Graceful fallbacks (empty array instead of crash)
- [ ] Error boundaries for client components

### Testing
- [ ] Test with null/undefined values
- [ ] Test with multiple school accounts (multi-tenant)
- [ ] Test with empty database
- [ ] Check Vercel/Sentry for production errors

---

## Testing Guide

### Test Case 1: Null Date Values

```typescript
// Create test data with null dates
await db.announcement.create({
  data: {
    title: "Test Announcement",
    body: "Test body",
    schoolId: "test-school-id",
    createdAt: null, // ❌ Will trigger error if not handled
  }
})

// Navigate to page
// Expected: Page loads successfully with fallback date
// Actual (before fix): "Application error: a server-side exception has occurred"
```

### Test Case 2: Multi-Tenant Cache Isolation

```typescript
// 1. Login as School A
// 2. Create announcement
// 3. Logout and login as School B
// 4. Visit announcements page

// Expected: School B sees NO announcements from School A
// Actual (with broken cache): School B might see School A's cached data
```

### Test Case 3: Invalid Prisma Relations

```typescript
// Change schema relation name
model Announcement {
  - creator User?
  + author User? // Renamed relation
}

// Run query without updating code
const data = await db.announcement.findFirst({
  include: {
    creator: true // ❌ Field doesn't exist anymore
  }
})

// Expected: Prisma error
// Fix: Update query to use 'author'
```

---

## Platform-Wide Audit

**As of 2025-11-03**, the following files have been identified as at-risk:

### ✅ Fixed
- `src/components/platform/announcements/content.tsx` (Date serialization + error handling)

### 🔴 CRITICAL (Fix Immediately)

**Banking Module** (Financial data at risk):
- `src/components/platform/finance/banking/actions/bank.actions.ts`
  - Uses `unstable_cache` incorrectly (lines 19, 48, 75)
  - Uses `parseStringify` pattern (lines 36, 61, 94, 183)
  - Missing schoolId scoping in cache keys
- `src/components/platform/finance/banking/lib/utils.ts`
  - `parseStringify` function (line 76) - breaks type safety

### 🟡 HIGH PRIORITY (Fix This Week)

**High-Traffic Pages** (10 files):
```
1. src/components/platform/teachers/content.tsx
2. src/components/platform/students/content.tsx
3. src/components/platform/parents/content.tsx
4. src/components/platform/classes/content.tsx
5. src/components/platform/subjects/content.tsx
6. src/components/platform/assignments/content.tsx
7. src/components/platform/grades/content.tsx
8. src/components/platform/events/content.tsx
9. src/components/platform/lessons/content.tsx
10. src/components/platform/attendance/content.tsx
```

All use unsafe date serialization pattern on line 38-50 (varies by file).

### 🟠 MEDIUM PRIORITY (Fix This Month)

**Finance Module** (15 files):
```
- src/components/platform/finance/expenses/content.tsx
- src/components/platform/finance/payroll/content.tsx
- src/components/platform/finance/salary/content.tsx
- src/components/platform/finance/fees/content.tsx
- src/components/platform/finance/invoice/content.tsx
- src/components/platform/finance/receipt/content.tsx
- src/components/platform/finance/banking/my-banks/content.tsx
- (+ 8 more finance submodules)
```

**Exams Module** (12 files):
```
- src/components/platform/exams/manage/content.tsx
- src/components/platform/exams/qbank/content.tsx
- src/components/platform/exams/results/content.tsx
- (+ 9 more exam submodules)
```

### 🟢 LOW PRIORITY (Systematic Rollout)

**Remaining Platform Pages** (40+ files):
- Admin modules
- Attendance submodules
- Profile pages
- Settings pages
- Parent portal
- Reports

All follow the same pattern - fix using the same approach as announcements.

---

## Quick Reference

### Copy-Paste Fix Templates

**Template 1: Date Serialization Fix**
```typescript
// Replace THIS:
createdAt: item.createdAt.toISOString(),

// With THIS:
createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
```

**Template 2: Add Error Boundary**
```typescript
// Wrap query in try-catch:
try {
  const { rows, count } = await getData();
  data = rows.map(/* ... */);
  total = count;
} catch (error) {
  console.error('[ComponentName] Error:', error);
  data = [];
  total = 0;
}
```

**Template 3: Remove Caching**
```typescript
// DELETE:
const getCachedData = unstable_cache(/* ... */);
const result = await getCachedData(schoolId);

// REPLACE WITH:
const result = await getDataList(schoolId, params);
```

---

## Related Documentation

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - General troubleshooting guide
- [CLAUDE.md](../CLAUDE.md#server-actions-pattern) - Server actions best practices
- [CLAUDE.md](../CLAUDE.md#multi-tenant-architecture) - Multi-tenant patterns

---

## Changelog

- **2025-11-03**: Initial documentation
  - Fixed announcements page (commit 48c5115)
  - Identified 70+ files with same pattern
  - Created comprehensive prevention guide

---

## Support

If you encounter persistent issues after following this guide:

1. Check Vercel logs: `vercel logs <url> --follow`
2. Search codebase: `grep -r "toISOString" src/components/platform/`
3. Verify Prisma schema: `cat prisma/models/*.prisma | grep "model <ModelName>"`
4. Test locally: `pnpm dev` and check console errors
5. Report issue with Error Digest and stack trace
