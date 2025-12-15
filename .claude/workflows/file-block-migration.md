# File Block Migration Workflow

**Status**: Active
**Created**: 2025-12-10
**Unified Module**: `src/components/platform/file/`

## Overview

This document tracks the migration of **71 scattered file implementations** to the unified File Block at `src/components/platform/file/`.

The unified File Block is **complete** with:

- Upload module with multi-tenant support
- Export module (CSV, Excel, PDF)
- Import module with validation
- Print module
- Generate module (6 document templates)
- Browser module with grid/list views

## Migration Strategy

Migration should be done **incrementally** by feature area. The unified module provides:

1. **Drop-in replacements** for simple export buttons
2. **Composable hooks** for custom implementations
3. **Server action patterns** that preserve existing data fetching logic

## Migration Status

### Legend

- [ ] Not started
- [~] In progress
- [x] Completed
- [-] Deprecated (can be deleted)

---

## Phase 1: Core Utilities (High Priority)

### CSV/Excel Export Utilities

- [ ] `/src/lib/csv-export.ts` → Use `@/components/file` export module
- [ ] `/src/components/export/export-utils.ts` → Merge into unified export module
- [ ] `/src/components/table/lib/export.ts` → Use unified export utilities

### CSV/Excel Import Utilities

- [ ] `/src/lib/csv-import.ts` → Use `@/components/file` import module
- [ ] `/src/lib/import-parser.ts` → Merge parsing logic into unified module

### Upload Utilities

- [ ] `/src/lib/file-upload.ts` → Use `@/components/file` upload module

---

## Phase 2: Feature-Specific Exports

### Student Module

- [ ] `/src/components/platform/students/export-button.tsx` → Use `ExportButton`

### Teacher Module

- [ ] `/src/components/platform/teachers/export-button.tsx` → Use `ExportButton`

### Class Module

- [ ] `/src/components/platform/classes/export-button.tsx` → Use `ExportButton`

### Assignment Module

- [ ] `/src/components/platform/assignments/export-button.tsx` → Use `ExportButton`

### Exam Module

- [ ] `/src/components/platform/exams/manage/export-button.tsx` → Use `ExportButton`
- [ ] `/src/components/platform/exams/manage/actions/export.ts` → Server action refactor
- [ ] `/src/components/platform/exams/qbank/actions/import-export.ts` → Use unified import/export
- [ ] `/src/components/platform/exams/results/actions/csv-import-export.ts` → Use unified import/export

### Attendance Module

- [ ] `/src/components/platform/attendance/reports/export-button.tsx` → Use `ExportButton`
- [ ] `/src/components/platform/attendance/reports/pdf-generator.tsx` → Use `generateReport`
- [ ] `/src/components/platform/attendance/reports/excel-generator.ts` → Use unified export

### Announcement Module

- [ ] `/src/components/platform/announcements/export.ts` → Use unified export

---

## Phase 3: Legacy Upload System (Deprecate)

### Old file-upload Directory

The entire `/src/components/file-upload/` directory should be deprecated after migration:

**To deprecate:**

- [-] `/src/components/file-upload/hooks/use-file-upload.ts`
- [-] `/src/components/file-upload/hooks/use-imagekit-upload.ts`
- [-] `/src/components/file-upload/config/file-types.ts`
- [-] `/src/components/file-upload/file-uploader/file-upload-button.tsx`
- [-] `/src/components/file-upload/file-uploader/file-uploader.tsx`
- [-] `/src/components/file-upload/file-uploader/file-browser.tsx`
- [-] `/src/components/file-upload/file-uploader/enhanced-file-browser.tsx`
- [-] `/src/components/file-upload/file-uploader/file-list.tsx`
- [-] `/src/components/file-upload/file-uploader/file-card.tsx`
- [-] `/src/components/file-upload/file-uploader/file-actions-toolbar.tsx`
- [-] `/src/components/file-upload/file-uploader/file-preview.tsx`
- [-] `/src/components/file-upload/file-uploader/upload-queue.tsx`
- [-] `/src/components/file-upload/file-uploader/mobile-upload-sheet.tsx`
- [-] `/src/components/file-upload/enhanced/actions.ts`
- [-] `/src/components/file-upload/enhanced/enhanced-file-uploader.tsx`
- [-] `/src/components/file-upload/enhanced/file-browser.tsx`
- [-] `/src/components/file-upload/enhanced/file-preview.tsx`
- [-] `/src/components/file-upload/enhanced/use-chunked-upload.ts`
- [-] `/src/components/file-upload/enhanced/use-image-optimization.ts`
- [-] `/src/components/file-upload/enhanced/image-actions.ts`
- [-] `/src/components/file-upload/lib/storage.ts`
- [-] `/src/components/file-upload/lib/rate-limit.ts`
- [-] `/src/components/file-upload/lib/quota.ts`
- [-] `/src/components/file-upload/lib/tier-manager.ts`
- [-] `/src/components/file-upload/lib/cdn.ts`
- [-] `/src/components/file-upload/lib/validation.ts`
- [-] `/src/components/file-upload/lib/providers.ts`
- [-] `/src/components/file-upload/hooks/use-file-progress.ts`
- [-] `/src/components/file-upload/types/file-upload.ts`
- [-] `/src/components/file-upload/file-upload-showcase.tsx`

---

## Phase 4: Operator-Specific Components

- [ ] `/src/components/operator/file-uploader.tsx` → Use `FileUploader`
- [ ] `/src/components/operator/billing/receipts/upload.tsx` → Use `FileUploader`
- [ ] `/src/components/operator/billing/export-button.tsx` → Use `ExportButton`

---

## Phase 5: PDF/Print Generation

- [ ] `/src/components/platform/exams/results/lib/pdf-generator.ts` → Use `useGenerate`
- [ ] `/src/components/platform/students/id-card/id-card-generator.tsx` → Use `generateIdCard`

---

## Phase 6: Miscellaneous

- [ ] `/src/components/export/ExportButton.tsx` → Use unified `ExportButton`
- [ ] `/src/components/export/index.ts` → Update re-exports
- [ ] `/src/components/platform/import/csv-import.tsx` → Use `FileImporter`
- [ ] `/src/components/theme/import-export.tsx` → Specialized (keep or adapt)
- [ ] `/src/components/sales/paste-import.tsx` → Specialized (keep or adapt)
- [ ] `/src/components/platform/shared/export-button.tsx` → Use unified `ExportButton`

---

## Migration Instructions

### Replacing Export Buttons

**Before:**

```tsx
import { ExportButton } from "@/components/export"
import { convertToCSV, downloadFile } from "@/components/export/export-utils"

;<ExportButton data={students} filename="students" columns={COLUMNS} />
```

**After:**

```tsx
import { ExportButton } from "@/components/file"

;<ExportButton
  data={students}
  columns={STUDENT_EXPORT_COLUMNS}
  filename="students"
  formats={["csv", "excel", "pdf"]}
/>
```

### Replacing File Uploaders

**Before:**

```tsx
import { FileUploader } from "@/components/file-upload/file-uploader"
import { useFileUpload } from "@/components/file-upload/hooks/use-file-upload"
```

**After:**

```tsx
import { FileUploader, useUpload } from "@/components/file"
```

### Replacing Import Components

**Before:**

```tsx
import { importStudents } from "@/lib/csv-import"
import { parseCsvData, parseExcelData } from "@/lib/import-parser"
```

**After:**

```tsx
import { FileImporter, useImport } from "@/components/file"
```

---

## File Counts by Directory

| Directory                            | Files  | Action                |
| ------------------------------------ | ------ | --------------------- |
| `/src/components/file-upload/`       | 30     | Deprecate entirely    |
| `/src/lib/`                          | 4      | Migrate utilities     |
| `/src/components/export/`            | 3      | Merge into file block |
| `/src/components/platform/*/export*` | 12     | Update imports        |
| `/src/components/platform/*/import*` | 5      | Update imports        |
| `/src/components/operator/`          | 3      | Update imports        |
| **Total**                            | **57** |                       |

---

## Validation Checklist

After migration, verify:

- [ ] All exports produce identical output (CSV, Excel, PDF)
- [ ] Upload progress tracking works correctly
- [ ] Multi-tenant isolation preserved (schoolId in all operations)
- [ ] Internationalization works (Arabic/English headers)
- [ ] Error handling matches or improves previous behavior
- [ ] No broken imports in the codebase
- [ ] Build passes with no TypeScript errors
- [ ] E2E tests pass for file operations

---

## Timeline

| Phase                        | Priority | Estimated Effort |
| ---------------------------- | -------- | ---------------- |
| Phase 1: Core Utilities      | High     | 2-3 hours        |
| Phase 2: Feature Exports     | Medium   | 3-4 hours        |
| Phase 3: Legacy Cleanup      | Low      | 1 hour           |
| Phase 4: Operator Components | Medium   | 1 hour           |
| Phase 5: PDF/Print           | Medium   | 2 hours          |
| Phase 6: Miscellaneous       | Low      | 1 hour           |
| **Total**                    |          | **10-12 hours**  |

---

## Notes

1. **Keep specialized implementations** for theme/sales imports as they have unique requirements
2. **Test thoroughly** after each phase before proceeding
3. **Update imports incrementally** - don't batch too many changes
4. **Preserve backwards compatibility** during transition where possible
