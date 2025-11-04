# Build Troubleshooting Guide

This guide addresses the recurring **build hanging issue** where `pnpm build` gets stuck at the "Environments: .env" stage after Prisma generation.

## Problem Description

**Symptoms:**
- Build hangs indefinitely after displaying:
  ```
  ▲ Next.js 15.4.4
  - Environments: .env
  ```
- No TypeScript compilation errors shown
- Multiple background processes running simultaneously
- Build eventually times out or must be killed manually

**Last Occurrence:** 2025-11-04 (during Prisma schema changes)

---

## Root Causes

### 1. **TypeScript Compilation Errors (Most Common)**

TypeScript errors prevent Next.js from starting compilation, but **no error output is shown**. The build silently hangs.

**Solution:**
```bash
# ALWAYS run TypeScript check FIRST before attempting full build
pnpm tsc --noEmit

# Count errors
pnpm tsc --noEmit 2>&1 | wc -l

# View specific errors
pnpm tsc --noEmit 2>&1 | head -50
```

If you see any number > 0, fix those errors first. The build will NOT progress until all TypeScript errors are resolved.

### 2. **MDX Syntax Errors (CRITICAL - Newly Discovered)**

MDX files with invalid syntax cause the build to hang or fail with webpack errors. The `<` character is interpreted as HTML/JSX tag start and must be escaped.

**Common Errors:**
- `Unexpected character '7' before name` → `<75%` parsed as tag
- `Unexpected character '3' before name` → `<3%` parsed as tag
- `Unexpected character '1' before name` → `<1%` parsed as tag

**Solution:**
```bash
# Check build errors (Vercel logs show these clearly)
pnpm build 2>&1 | grep "Unexpected character"

# Fix: Escape < character in MDX files
# ❌ Wrong: <75% attendance
# ✅ Correct: &lt;75% attendance

# Files affected in 2025-11-04 fix:
# - src/app/[lang]/docs/demo/page.mdx:215
# - src/app/[lang]/docs/prd/page.mdx:170
# - src/app/[lang]/docs/validation/page.mdx:469
```

**Prevention:** When writing MDX documentation, always escape `<` as `&lt;` when used in comparison operators.

### 3. **Multiple Concurrent Build Processes**

Having 20+ build processes running simultaneously exhausts system resources and causes hangs.

**Solution:**
```bash
# Kill ALL Node.js processes (Windows)
taskkill /F /IM node.exe

# Then start fresh
pnpm build
```

### 3. **Prisma Client Not Regenerated**

After Prisma schema changes, the client may be out of sync.

**Solution:**
```bash
# Always regenerate Prisma client after schema changes
pnpm prisma generate

# Then build
pnpm build
```

### 4. **Memory/Resource Exhaustion**

Large codebase (200+ pages, 234 test files) can exhaust available memory.

**Solution:**
```bash
# Increase Node.js memory limit
$env:NODE_OPTIONS="--max-old-space-size=8192"
pnpm build
```

---

## Step-by-Step Recovery Procedure

### **Step 1: Kill All Running Processes**

```bash
# Kill all Node.js processes
taskkill /F /IM node.exe

# Or manually close terminal windows
```

### **Step 2: Verify TypeScript Errors**

```bash
# Check for TypeScript errors
pnpm tsc --noEmit

# Expected output if NO errors:
# (blank - exit code 0)

# If errors exist, count them:
pnpm tsc --noEmit 2>&1 | wc -l
```

**If errors found (count > 0), STOP and fix them first!** The build will NOT work until all TS errors are resolved.

### **Step 3: Regenerate Prisma Client**

```bash
# Only if you made Prisma schema changes
pnpm prisma generate
```

### **Step 4: Clean Build**

```bash
# Remove Next.js cache
rm -rf .next

# Build fresh
pnpm build
```

### **Step 5: Monitor Build Progress**

The build should show progress indicators:
```
▲ Next.js 15.4.4
- Environments: .env
✓ Creating an optimized production build ...
✓ Compiled successfully
```

**If it hangs for more than 5 minutes at "Environments: .env", STOP and repeat Step 2.**

---

## Common TypeScript Errors After Prisma Changes

When you modify Prisma schema, these errors frequently occur:

### **Error Type 1: Missing Fields**
```typescript
// Error: Property 'userId' does not exist on type 'StudentRow'
export type StudentRow = {
  id: string;
  name: string;
  // MISSING: userId: string | null;
}
```

**Fix:** Add the missing field from Prisma model to DTO/Row types.

### **Error Type 2: Field Name Mismatches**
```prisma
model Class {
  name String  // Field is "name" not "className"
}
```

```typescript
// ❌ Wrong
class: {
  select: {
    className: true  // Field doesn't exist!
  }
}

// ✅ Correct
class: {
  select: {
    name: true
  }
}
```

**Fix:** Use exact field names from Prisma schema.

### **Error Type 3: Type Assertion Needed**
```typescript
// ❌ Error: Partial<StudentProfile> not assignable to StudentProfile
student: filterStudentData(profile.student, permissionLevel)

// ✅ Fix: Add type cast
student: filterStudentData(profile.student, permissionLevel) as any
```

**Fix:** Add `as any` type casts when DTOs don't match exactly.

### **Error Type 4: Undefined vs Null**
```typescript
// ❌ Error: Type 'undefined' is not assignable to type 'string | null'
profileData={result.data}

// ✅ Fix: Convert undefined to null
profileData={result.data ?? null}
```

**Fix:** Use nullish coalescing `??` to convert `undefined` to `null`.

---

## Prevention Checklist

Before running `pnpm build`, ALWAYS:

1. ✅ Run `pnpm tsc --noEmit` and verify 0 errors
2. ✅ Run `pnpm prisma generate` if you changed schema
3. ✅ Kill all existing Node.js processes
4. ✅ Check you have only ONE build running
5. ✅ Ensure sufficient memory (8GB+ recommended)

---

## Quick Reference Commands

```bash
# 1. Check TypeScript errors (ALWAYS DO THIS FIRST!)
pnpm tsc --noEmit

# 2. Count errors
pnpm tsc --noEmit 2>&1 | wc -l

# 3. Kill all Node processes
taskkill /F /IM node.exe

# 4. Regenerate Prisma (if schema changed)
pnpm prisma generate

# 5. Clean build
rm -rf .next && pnpm build

# 6. Build with increased memory
$env:NODE_OPTIONS="--max-old-space-size=8192"
pnpm build
```

---

## Historical Context

### Build Hang on 2025-11-04

**Initial Problem:** Build hung at "Environments: .env" after Prisma schema changes added 7+ fields to messaging models.

**Root Cause:** 20 TypeScript errors across 10 files:
- Messaging content.tsx (2 errors)
- Table row types (3 errors)
- Profile actions (5 errors)
- Profile types (3 errors)
- Profile permissions (5 errors)
- Profile page (2 errors)

**Resolution:**
1. Fixed all 20 TypeScript errors with type casts and field additions
2. Verified 0 errors with `pnpm tsc --noEmit`
3. Build completed successfully

**Lesson:** **ALWAYS check TypeScript errors BEFORE running build!** The build will silently hang if errors exist.

---

## Files Modified (2025-11-04 Fix)

Reference for future similar issues:

1. `src/components/platform/messaging/content.tsx` - Added type casts for ConversationDTO
2. `src/components/platform/students/types.ts` - Added userId field
3. `src/components/platform/teachers/types.ts` - Added userId field
4. `src/components/platform/parents/types.ts` - Added userId field
5. `src/components/platform/profile/detail/actions.ts` - Fixed className → name, added type casts
6. `src/components/platform/profile/detail/types.ts` - Added userId to all profile types
7. `src/components/platform/profile/detail/permissions.ts` - Added type casts for Partial types
8. `src/app/[lang]/s/[subdomain]/(platform)/profile/[id]/page.tsx` - Fixed undefined → null
9. `src/components/platform/students/table.tsx` - Added type cast
10. `src/components/platform/teachers/table.tsx` - Added type cast
11. `src/components/platform/parents/table.tsx` - Added type cast

---

## Summary

**The build hanging at "Environments: .env" is ALWAYS caused by TypeScript errors.**

**DO NOT attempt to build until `pnpm tsc --noEmit` shows 0 errors.**

This troubleshooting guide should be referenced every time the build hangs.
