# Legacy Code Analysis - Hogwarts

> **Generated**: 2025-11-21
> **Purpose**: Comprehensive list of legacy code candidates for deletion
> **Status**: Awaiting verification and cleanup

---

## 🟢 LOW RISK - Safe to Delete (7 files, ~723 lines)

### 1. Middleware Backups

#### `src/middleware.backup.ts` (310 lines)

- **Status**: Duplicate of current `src/middleware.ts`
- **Last Modified**: Commit `8b47bac` - "perf(middleware): optimize Edge Function..."
- **Imports**: None found
- **Risk**: LOW - Confirmed duplicate
- **Action**: DELETE

#### `src/middleware.minimal.ts` (116 lines)

- **Status**: Untracked file (never committed to git)
- **Description**: Experimental minimal middleware without auth/logging
- **Imports**: None found
- **Risk**: LOW - Never integrated into codebase
- **Action**: DELETE

### 2. Empty Placeholder Files (Invoice Module)

#### `src/components/platform/finance/invoice/zod-schema.ts` (2 lines)

```typescript
// Deprecated after moving schemas into validation.ts
export {}
```

- **Status**: Empty placeholder
- **Imports**: None found
- **Risk**: LOW
- **Action**: DELETE

#### `src/components/platform/finance/invoice/email.ts` (3 lines)

```typescript
// Deprecated after consolidation into actions.ts
export {}
```

- **Status**: Empty placeholder
- **Imports**: Found in 2 files but NOT actively used
- **Risk**: LOW
- **Action**: DELETE

#### `src/components/platform/finance/invoice/dashboard/actions.ts` (3 lines)

```typescript
// Deprecated after consolidation into actions.ts
export {}
```

- **Status**: Empty placeholder
- **Imports**: None found
- **Risk**: LOW
- **Action**: DELETE

### 3. Empty Debug File

#### `src/components/auth/debug-auth.tsx` (1 line)

- **Status**: Empty file
- **Imports**: None found
- **Risk**: LOW
- **Action**: DELETE

### 4. Example/Reference Files

#### `src/lib/websocket/server.example.txt` (288 lines)

- **Description**: Complete Socket.io server example for real-time attendance
- **Format**: .txt file with TypeScript code
- **Purpose**: Documentation/reference
- **Imports**: None (not a module)
- **Risk**: LOW
- **Alternative**: Consider moving to `/docs` folder if valuable
- **Action**: DELETE or MOVE to docs

---

## 🟡 MEDIUM RISK - Requires Verification (3 items)

### 1. Theme Component

#### `src/components/theme/content.tsx` (~500+ lines estimated)

- **Status**: Marked as "DEPRECATED - use settings integration" in README.md
- **Description**: Standalone theme customization UI with preset gallery
- **Static Imports**: None found
- **Risk**: MEDIUM - May be loaded via dynamic imports or route handlers
- **Verification Steps**:
  1. Search for dynamic imports: `grep -r "import.*theme/content" src/`
  2. Check route handlers: `grep -r "theme" src/app/**/route.ts`
  3. Verify settings integration is complete
- **Action**: DELETE after verification

### 2. Dashboard Showcase

#### `src/components/platform/dashboard/dashboard-showcase.tsx` (856 lines)

- **Status**: Has `@ts-nocheck` directive
- **Issues**: 36+ TypeScript errors documented in TODO comments
- **Description**: Comprehensive showcase of 46+ dashboard card components
- **Imports**: Referenced but COMMENTED OUT in:
  - `src/components/platform/dashboard/dashboards/admin-dashboard.tsx`
- **Risk**: MEDIUM - May be used in development/testing environments
- **Verification Steps**:
  1. Check if used in Storybook configuration
  2. Check for dynamic imports in dev-only routes
  3. Verify if used in documentation pages
  4. Check if imported in test files
- **Action**: DELETE after verification OR fix 36+ TypeScript errors

### 3. Commented API Route

#### `src/app/api/email/[invoiceId]/route.ts` (64 lines commented out)

- **Active Code**: Only 2 lines - returns `{ ok: true }`
- **Commented Code**: 64 lines of MongoDB-based invoice email implementation
- **Risk**: MEDIUM - Email functionality may be needed
- **Verification Steps**:
  1. Test invoice email sending functionality
  2. Verify `src/components/platform/finance/invoice/actions.ts` handles emails
  3. Confirm this API route is not called by external services
- **Action**: DELETE commented code if email works via server actions

---

## 🔴 HIGH RISK - Do NOT Delete (Requires Migration First)

### 1. Deprecated File Upload Component

#### `src/components/file-upload/Uploader.tsx`

- **Status**: Marked `@deprecated` in JSDoc
- **Replacement**: `FileUploadButton` component
- **Current Usage**: Still imported in **19 files**:
  - `src/components/onboarding/branding/content.tsx`
  - `src/components/platform/communication/hub.tsx`
  - `src/components/platform/messaging/message-input.tsx`
  - `src/components/platform/attendance/bulk-upload/content.tsx`
  - `src/components/platform/finance/invoice/settings/content.tsx`
  - `src/components/platform/students/registration/document-upload-step.tsx`
  - `src/components/operator/billing/receipts/upload.tsx`
  - (+ 12 more files)
- **Risk**: HIGH - Will break 19 components
- **Migration Required**: Yes
- **Action**: CREATE ISSUE - "Migrate 19 files from Uploader to FileUploadButton"
- **Estimated Effort**: 2-3 hours

### 2. Cookie Debug Component

#### `src/components/auth/cookie-debug.tsx` (148 lines)

- **Status**: Active in production
- **Usage**: Used in `src/components/platform/dashboard/content.tsx`
- **Purpose**: Fallback UI for users without role-specific dashboards
- **Function**: Displays cookie debugging panel for tenant/auth troubleshooting
- **Risk**: HIGH - Used in production DefaultDashboard
- **Action**: KEEP - Useful for debugging subdomain/tenant auth issues
- **Future**: Can be removed once all role-specific dashboards are implemented

### 3. Table Component Backward Compatibility

#### `src/components/table/` (old structure)

- **Status**: Kept intentionally for backward compatibility
- **Documentation**: See `src/components/table/MIGRATION_GUIDE.md`
- **Deprecated Folders**:
  - `src/components/table/types/` → consolidated to `types.ts`
  - `src/components/table/config/` → consolidated to `config.ts`
  - `src/components/table/lib/` → consolidated to `utils.ts`
  - `src/components/table/hooks/` → moved to root level
  - `src/components/table/_components/` (9 files)
  - `src/components/table/_lib/` (9 files)
- **Files**: 35+ files in old structure
- **Current Import**: 1 file (`db/seed.ts`) imports from `_lib`
- **Risk**: HIGH - May break external integrations
- **Action**: KEEP until deprecation period ends
- **Future**: CREATE ISSUE - "Remove table backward compatibility after deprecation period"

---

## ✅ NOT LEGACY - Keep These

### Atom Lab Components

#### `src/components/atom/lab/` (67 components)

- **Examples**: stat-card.tsx, progress-card.tsx, hero-stat-card.tsx
- **Status**: Active reusable UI components (atoms)
- **Usage**: Referenced extensively in dashboard components
- **Purpose**: shadcn-style reusable UI building blocks
- **Action**: KEEP - These are production components

---

## 📊 Summary

| Risk Level | Files  | Lines of Code | Action Required    |
| ---------- | ------ | ------------- | ------------------ |
| 🟢 LOW     | 7      | ~723          | Delete immediately |
| 🟡 MEDIUM  | 3      | ~1,420        | Verify then delete |
| 🔴 HIGH    | 3      | ~200+         | Migration required |
| **Total**  | **13** | **~2,343**    | **Mixed**          |

---

## 🔄 Recommended Action Plan

### Phase 1: Immediate Cleanup (Safe - 15 minutes)

```bash
# Delete LOW RISK files
rm src/middleware.backup.ts
rm src/middleware.minimal.ts
rm src/components/platform/finance/invoice/zod-schema.ts
rm src/components/platform/finance/invoice/email.ts
rm src/components/platform/finance/invoice/dashboard/actions.ts
rm src/components/auth/debug-auth.tsx
rm src/lib/websocket/server.example.txt  # Or move to docs/

# Commit
git add .
git commit -m "chore: remove legacy files and empty placeholders"
```

**Expected Result**: ~723 lines removed, no breaking changes

### Phase 2: Verification Tasks (1-2 hours)

#### 2.1 Verify Theme Component

```bash
# Check for dynamic imports
grep -r "theme/content" src/app/
grep -r "dynamic.*theme" src/

# Check route handlers
find src/app -name "route.ts" -exec grep -l "theme" {} \;

# Test settings integration
pnpm dev
# Navigate to settings and verify theme customization works
```

**Decision**: If no usage found → DELETE `src/components/theme/content.tsx`

#### 2.2 Verify Dashboard Showcase

```bash
# Check Storybook usage
grep -r "dashboard-showcase" .storybook/ 2>/dev/null

# Check test files
grep -r "dashboard-showcase" src/**/*.test.tsx

# Check documentation
grep -r "dashboard-showcase" src/app/**/docs/
```

**Decision**:

- If used in docs/testing → FIX 36+ TypeScript errors
- If not used → DELETE `src/components/platform/dashboard/dashboard-showcase.tsx`

#### 2.3 Verify Email Functionality

```bash
# Test invoice email sending
pnpm dev
# 1. Create test invoice
# 2. Send email
# 3. Verify email received
```

**Decision**: If emails work → DELETE commented code in `src/app/api/email/[invoiceId]/route.ts`

### Phase 3: Create Migration Issues (Future Work)

#### Issue 1: File Upload Component Migration

```markdown
Title: Migrate from Uploader to FileUploadButton (19 files)

Description:
The `Uploader` component is deprecated. Migrate all 19 references to use `FileUploadButton`.

Files to Update:

- [ ] src/components/onboarding/branding/content.tsx
- [ ] src/components/platform/communication/hub.tsx
- [ ] src/components/platform/messaging/message-input.tsx
- [ ] src/components/platform/attendance/bulk-upload/content.tsx
- [ ] src/components/platform/finance/invoice/settings/content.tsx
- [ ] src/components/platform/students/registration/document-upload-step.tsx
- [ ] src/components/operator/billing/receipts/upload.tsx
- [ ] (+ 12 more files - see legacy.md)

Estimated Effort: 2-3 hours
Priority: Medium
```

#### Issue 2: Dashboard Showcase TypeScript Errors

```markdown
Title: Fix or Remove dashboard-showcase.tsx (36+ TypeScript errors)

Description:
The `dashboard-showcase.tsx` file has @ts-nocheck with 36+ TypeScript errors.

Options:

1. Fix all TypeScript errors if component is valuable
2. Delete if not used in docs/testing/development

First Step: Verify usage (see legacy.md Phase 2.2)

Estimated Effort: 3-4 hours (if fixing) OR 15 minutes (if deleting)
Priority: Low
```

#### Issue 3: Table Backward Compatibility Removal

```markdown
Title: Remove table component backward compatibility

Description:
Old table structure is kept for backward compatibility per MIGRATION_GUIDE.md.
After deprecation period, remove old folders and consolidate.

Folders to Remove:

- src/components/table/types/
- src/components/table/config/
- src/components/table/lib/
- src/components/table/hooks/
- src/components/table/\_components/
- src/components/table/\_lib/

Prerequisites:

- [ ] Deprecation period ended (check MIGRATION_GUIDE.md)
- [ ] No external integrations using old paths
- [ ] All internal imports updated

Estimated Effort: 1 hour
Priority: Low
```

---

## 🔍 Additional Technical Debt (Not Deletion Candidates)

These files have TypeScript checks disabled and should be fixed (but NOT deleted):

1. `src/components/platform/dashboard/dashboard-showcase.tsx` - `@ts-nocheck` (36+ errors)
2. `src/components/platform/notifications/use-notifications.ts` - `@ts-ignore`
3. `src/lib/i18n-format.ts` - `@ts-ignore`
4. `src/components/marketing/pricing/lib/toc.ts` - `@ts-ignore`
5. `src/components/marketing/pricing/lib/subscription.ts` - `@ts-ignore`

**Recommendation**: Create separate issue for TypeScript strict mode compliance

---

## 📝 Notes

- **Git Status at Analysis**: Modified `src/auth.config.ts`, `src/auth.ts`, untracked `src/middleware.minimal.ts`
- **Branch**: main
- **Analysis Method**: Automated exploration + manual verification
- **Conservative Approach**: When in doubt, marked as MEDIUM/HIGH risk rather than recommending deletion

---

## ✅ Next Steps

1. **Review this document** and verify risk assessments
2. **Execute Phase 1** for quick wins (~723 lines removed)
3. **Schedule Phase 2** verification tasks (1-2 hours)
4. **Create issues** for Phase 3 migration work
5. **Update this document** after each phase completion

---

**Last Updated**: 2025-11-21
**Maintainer**: Development Team
**Status**: Ready for Review
