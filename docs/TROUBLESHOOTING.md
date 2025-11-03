# Troubleshooting Guide

This document provides solutions to common issues encountered in the Hogwarts platform.

## Table of Contents

- [Server-Side Exceptions](#server-side-exceptions)
- [Multi-Tenant Cache Issues](#multi-tenant-cache-issues)
- [Database Query Errors](#database-query-errors)
- [Build and Deployment Issues](#build-and-deployment-issues)

---

## Server-Side Exceptions

### Error: "Application error: a server-side exception has occurred"

This generic error can have multiple causes. Follow this systematic debugging approach:

#### 1. Check Server Logs

**Vercel (Production)**:
```bash
# View real-time logs
vercel logs <deployment-url> --follow

# Search for specific errors
vercel logs <deployment-url> | grep "Error"
```

**Local Development**:
```bash
# Server logs are in terminal output
pnpm dev

# Check for:
# - Unhandled promise rejections
# - Database connection errors
# - Missing environment variables
```

#### 2. Common Causes & Solutions

##### A. Multi-Tenant Cache Key Bug (FIXED: 2025-11-03)

**Problem**: `unstable_cache` not including `schoolId` in cache key, causing:
- Cross-tenant data leakage
- Incorrect cached data being served
- Serialization errors from mismatched data structures

**Example of BROKEN code**:
```typescript
// ❌ BAD: All schools share same cache
const getCachedData = unstable_cache(
  async (schoolId: string, params: any) => {
    return getData(schoolId, params);
  },
  ['data-list'], // schoolId NOT in key!
  {
    revalidate: 60,
    tags: ['data'], // Static tag
  }
);
```

**CORRECT implementation**:
```typescript
// ✅ GOOD: Each school has isolated cache
async function getCachedData(schoolId: string, params: any) {
  const cachedFn = unstable_cache(
    async () => getData(schoolId, params),
    ['data-list', schoolId, JSON.stringify(params)], // Include schoolId and params
    {
      revalidate: 60,
      tags: [`data-${schoolId}`], // Tenant-specific tag
    }
  );

  return cachedFn();
}
```

**Why this matters**:
1. **Security**: Without schoolId in cache key, School A could see School B's data
2. **Data Integrity**: Cached data structure might not match expected structure
3. **Debugging**: Intermittent errors that are hard to reproduce

**How to fix** (for any similar issues):
1. Always include `schoolId` in cache key array
2. Use tenant-specific cache tags: `${resource}-${schoolId}`
3. Test with multiple school accounts to verify isolation

##### B. Invalid Prisma Relations

**Problem**: Trying to include a relation that doesn't exist in the schema.

**Example**:
```typescript
// ❌ BAD: 'creator' relation doesn't exist
const announcement = await db.announcement.findFirst({
  select: {
    id: true,
    creator: { // This might not exist!
      select: { name: true }
    }
  }
});
```

**Solution**:
1. Check Prisma schema: `prisma/models/*.prisma`
2. Verify relation exists with correct name
3. Run `pnpm prisma generate` after schema changes
4. Use only relations defined in schema

##### C. Date Serialization Issues

**Problem**: Trying to serialize Date objects in server components.

**Solution**: Convert dates to ISO strings:
```typescript
// ✅ GOOD: Convert before passing to client
const data = rows.map((item) => ({
  ...item,
  createdAt: item.createdAt.toISOString(), // Convert Date to string
}));
```

##### D. Missing Dictionary Keys

**Problem**: Accessing undefined translation keys causes errors.

**Solution**:
```typescript
// ✅ GOOD: Provide fallbacks
const title = dictionary?.announcements?.title || "Announcements";
```

---

## Multi-Tenant Cache Issues

### Problem: Data Leakage Between Schools

**Symptoms**:
- User sees data from different school
- Intermittent wrong data in UI
- Cache invalidation doesn't work properly

**Root Cause**: Cache key doesn't include `schoolId`

**Solution Checklist**:

1. **Always include schoolId in cache keys**:
```typescript
unstable_cache(
  fn,
  ['resource', schoolId, ...otherParams],
  { tags: [`resource-${schoolId}`] }
)
```

2. **Use tenant-specific cache tags**:
```typescript
revalidateTag(`announcements-${schoolId}`); // ✅ GOOD
revalidateTag('announcements');             // ❌ BAD (global)
```

3. **Test cache isolation**:
```bash
# Test with two different school accounts
# Verify data doesn't leak between them
# Check that cache invalidation only affects correct school
```

4. **Audit all cache usage**:
```bash
# Find all unstable_cache usage
grep -r "unstable_cache" src/components/platform/
```

### Cache Invalidation Best Practices

```typescript
// When creating/updating/deleting data:
export async function createAnnouncement(data) {
  // 1. Get schoolId
  const { schoolId } = await getTenantContext();

  // 2. Perform operation
  await db.announcement.create({ data });

  // 3. Invalidate BOTH path and tag
  revalidatePath('/announcements');               // Revalidate UI
  revalidateTag(`announcements-${schoolId}`);    // Clear cache
}
```

---

## Database Query Errors

### Error: "Invalid Prisma.ModelFindMany() invocation"

**Causes**:
1. Field doesn't exist in schema
2. Relation name incorrect
3. Missing `connect` for relation updates

**Solution**:
```typescript
// ✅ GOOD: Check schema first
// See prisma/models/*.prisma for correct field names

// ✅ GOOD: Use connect for relations
await db.announcement.update({
  where: { id },
  data: {
    class: { connect: { id: classId } } // Not: classId: classId
  }
});
```

### N+1 Query Problems

Use the Prisma extension for query optimization:
```bash
# Check for N+1 queries
pnpm prisma studio

# Use includes wisely
const data = await db.announcement.findMany({
  include: {
    class: true,    // Fetch relation in single query
    creator: true,  // Don't fetch separately in loop
  }
});
```

---

## Build and Deployment Issues

### Vercel Build Failures

**Common causes**:
1. TypeScript errors
2. Missing environment variables
3. Outdated pnpm lockfile

**Solution**:
```bash
# 1. Check TypeScript
pnpm type-check

# 2. Check environment variables
# Ensure all required vars are set in Vercel dashboard

# 3. Update lockfile
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update pnpm lockfile"
git push
```

### Production Runtime Errors Not in Development

**Cause**: Production build optimizations behave differently

**Solution**:
```bash
# Test production build locally
pnpm build
pnpm start

# Check for:
# - Serialization errors
# - Dynamic imports
# - Environment-specific code
```

---

## Prevention Checklist

Before deploying any feature with caching:

- [ ] Cache key includes `schoolId` for multi-tenant isolation
- [ ] Cache tags are tenant-specific: `${resource}-${schoolId}`
- [ ] Test with multiple school accounts
- [ ] Verify cache invalidation works correctly
- [ ] Date objects converted to ISO strings before passing to client
- [ ] Dictionary keys exist with fallbacks
- [ ] Prisma relations exist in schema
- [ ] Run `pnpm prisma generate` after schema changes

---

## Getting Help

If you encounter persistent issues:

1. **Check Logs**:
   - Vercel: `vercel logs <url>`
   - Local: Terminal output

2. **Search Documentation**:
   - CLAUDE.md - Project guidelines
   - Prisma docs - Database queries
   - Next.js docs - Caching and SSR

3. **Create Minimal Reproduction**:
   - Isolate the issue
   - Remove unrelated code
   - Document steps to reproduce

4. **Report Issue**:
   - Include error message
   - Include relevant code snippets
   - Include environment (dev/production)
   - Include steps to reproduce

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project architecture and guidelines
- [Multi-Tenant Architecture](../CLAUDE.md#multi-tenant-architecture) - Tenant isolation patterns
- [Server Actions Pattern](../CLAUDE.md#server-actions-pattern) - Data mutation best practices
- [Caching Strategy](https://nextjs.org/docs/app/building-your-application/caching) - Next.js caching guide
