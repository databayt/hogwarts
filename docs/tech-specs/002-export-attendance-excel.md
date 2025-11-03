# Hogwarts - Technical Specification

**Feature ID:** TS-002
**Author:** Product Team
**Date:** 2025-01-03
**Project Level:** Level 0 (Small Feature / Bug Fix)
**Change Type:** Enhancement
**Development Context:** Hogwarts School Automation Platform
**Estimated Time:** 2-3 hours

---

## Context

### Available Documents
- PRD: `/PRD.md` (FR-ATT-007: Export attendance reports to Excel/CSV)
- Epics: `/epics.md` (Epic 7: Attendance System, Story 7.6: Attendance Reports)
- Architecture: `/architecture.md` (Implementation patterns for server actions)
- Existing Implementation: `src/lib/csv-export.ts` (CSV export utility)

### Project Stack
- **Framework**: Next.js 15.4.4 (App Router) with React 19.1.0
- **Language**: TypeScript 5.x (strict mode)
- **Database**: PostgreSQL (Neon) with Prisma ORM 6.14.0
- **Excel Library**: xlsx 0.18.5 (for Excel export)
- **Testing**: Vitest 2.0.6 + Playwright 1.55.0

### Existing Codebase Structure

**Current Implementation:**
```
src/components/platform/attendance/
  content.tsx              # Attendance listing UI
  actions.ts               # Attendance CRUD operations

src/lib/
  csv-export.ts            # Existing CSV export utility (used by students)
```

**Reference Implementation:**
```
src/components/platform/students/actions.ts  # Uses arrayToCSV() for export
```

---

## The Change

### Problem Statement

Currently, the attendance system has no export functionality. School administrators need to export attendance data for:
1. **Compliance Reports**: Government/regulatory reporting requirements
2. **Parent Sharing**: Sharing attendance records with parents
3. **Analysis**: External analysis in Excel/Google Sheets
4. **Archival**: Long-term record keeping
5. **Integration**: Import into other school systems

While CSV export exists for students (`src/lib/csv-export.ts`), attendance lacks any export capability.

**User Story:**
```
As a school administrator or teacher,
I want to export attendance data to Excel format,
So that I can analyze, share, and archive attendance records outside the platform.
```

### Proposed Solution

Add Excel export functionality to attendance reports with the following features:

1. **Export Button**: Add "Export to Excel" button on attendance listing page
2. **Server Action**: Create `exportAttendanceToExcel` server action
3. **Excel Generation**: Use `xlsx` library to generate .xlsx files
4. **Data Structure**: Include student name, class, date, status, notes
5. **Filtering**: Export respects current filters (date range, class, status)
6. **Multi-Sheet Support**: Separate sheet for summary statistics

### Scope

**In Scope:**
- [ ] Add "Export to Excel" button to attendance listing UI
- [ ] Create `exportAttendanceToExcel` server action
- [ ] Install and configure `xlsx` library (already exists at 0.18.5)
- [ ] Generate Excel file with attendance records
- [ ] Include summary sheet with statistics
- [ ] Respect current filters (date range, class, status)
- [ ] Download file with descriptive name (e.g., `attendance_2024-01-15_to_2024-01-31.xlsx`)
- [ ] Unit tests for export logic
- [ ] E2E test for download workflow

**Out of Scope:**
- [ ] PDF export (future enhancement)
- [ ] Email export (future enhancement)
- [ ] Scheduled exports (future enhancement)
- [ ] Export templates (future enhancement)
- [ ] CSV export (already exists via csv-export.ts, can be added separately)

---

## Implementation Details

### Source Tree Changes

**Files to Create:**
```
src/lib/excel-export.ts              # Excel export utility functions
src/components/platform/attendance/export-button.tsx  # Export button component
```

**Files to Modify:**
```
src/components/platform/attendance/actions.ts  # Add exportAttendanceToExcel action
src/components/platform/attendance/content.tsx # Add export button to UI
package.json                                   # Add xlsx dependency (already exists)
```

### Technical Approach

**1. Excel Export Utility:**

```typescript
// src/lib/excel-export.ts
import * as XLSX from 'xlsx'

export interface ExcelExportOptions {
  filename: string
  sheets: Array<{
    name: string
    data: any[]
    columns?: string[]
  }>
}

/**
 * Generate Excel file from data
 * @param options Export options with sheets and filename
 * @returns Binary buffer for download
 */
export function generateExcelFile(options: ExcelExportOptions): Buffer {
  const workbook = XLSX.utils.book_new()

  options.sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data, {
      header: sheet.columns || Object.keys(sheet.data[0] || {})
    })

    // Auto-size columns
    const colWidths = getColumnWidths(sheet.data, sheet.columns)
    worksheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  // Generate binary buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer
}

/**
 * Calculate optimal column widths based on content
 */
function getColumnWidths(data: any[], columns?: string[]): Array<{ wch: number }> {
  const cols = columns || (data.length > 0 ? Object.keys(data[0]) : [])

  return cols.map((col) => {
    const maxLength = Math.max(
      col.length,
      ...data.map((row) => String(row[col] || '').length)
    )
    return { wch: Math.min(maxLength + 2, 50) } // Max width 50 characters
  })
}

/**
 * Create download response for Excel file
 */
export function createExcelDownloadResponse(
  buffer: Buffer,
  filename: string
): Response {
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length)
    }
  })
}
```

**2. Server Action for Export:**

```typescript
// src/components/platform/attendance/actions.ts (ADD)
"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { generateExcelFile } from "@/lib/excel-export"
import { z } from "zod"

// Validation schema for export parameters
const exportAttendanceSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  classId: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).optional()
})

export async function exportAttendanceToExcel(
  params: z.infer<typeof exportAttendanceSchema>
) {
  try {
    // 1. Authentication
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // 2. Authorization - Teachers and Admins can export
    if (!["ADMIN", "TEACHER"].includes(session.user.role)) {
      throw new Error("Forbidden: Only teachers and admins can export attendance")
    }

    // 3. Tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      throw new Error("Missing school context")
    }

    // 4. Validation
    const parsed = exportAttendanceSchema.parse(params)

    // 5. Build query filters
    const where: any = { schoolId }

    if (parsed.startDate) {
      where.date = { ...where.date, gte: new Date(parsed.startDate) }
    }

    if (parsed.endDate) {
      where.date = { ...where.date, lte: new Date(parsed.endDate) }
    }

    if (parsed.classId) {
      where.classId = parsed.classId
    }

    if (parsed.status) {
      where.status = parsed.status
    }

    // 6. Fetch attendance records
    const attendanceRecords = await db.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            givenName: true,
            middleName: true,
            surname: true
          }
        },
        class: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { student: { givenName: 'asc' } }
      ]
    })

    // 7. Transform data for Excel
    const attendanceData = attendanceRecords.map((record) => ({
      'Student Name': `${record.student.givenName} ${record.student.middleName || ''} ${record.student.surname}`.trim(),
      'Class': record.class?.name || 'N/A',
      'Date': record.date.toLocaleDateString('en-US'),
      'Status': record.status,
      'Notes': record.notes || '',
      'Marked At': record.markedAt ? record.markedAt.toLocaleString('en-US') : '',
      'Marked By': record.markedBy || 'System'
    }))

    // 8. Generate summary statistics
    const summary = {
      'Total Records': attendanceRecords.length,
      'Present': attendanceRecords.filter(r => r.status === 'PRESENT').length,
      'Absent': attendanceRecords.filter(r => r.status === 'ABSENT').length,
      'Late': attendanceRecords.filter(r => r.status === 'LATE').length,
      'Excused': attendanceRecords.filter(r => r.status === 'EXCUSED').length,
      'Date Range': parsed.startDate && parsed.endDate
        ? `${parsed.startDate} to ${parsed.endDate}`
        : 'All dates',
      'Exported At': new Date().toLocaleString('en-US'),
      'Exported By': session.user.name || session.user.email
    }

    // Convert summary object to array format for Excel
    const summaryData = Object.entries(summary).map(([key, value]) => ({
      'Metric': key,
      'Value': String(value)
    }))

    // 9. Generate Excel file
    const filename = `attendance_${parsed.startDate || 'all'}_to_${parsed.endDate || 'all'}.xlsx`

    const buffer = generateExcelFile({
      filename,
      sheets: [
        {
          name: 'Attendance Records',
          data: attendanceData
        },
        {
          name: 'Summary',
          data: summaryData
        }
      ]
    })

    // 10. Return file as base64 for client download
    return {
      success: true,
      data: {
        buffer: buffer.toString('base64'),
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export attendance'
    }
  }
}
```

**3. Export Button Component:**

```typescript
// src/components/platform/attendance/export-button.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { exportAttendanceToExcel } from "./actions"

interface ExportButtonProps {
  filters: {
    startDate?: string
    endDate?: string
    classId?: string
    status?: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
  }
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportAttendanceToExcel(filters)

      if (!result.success) {
        throw new Error(result.error || "Export failed")
      }

      // Convert base64 to blob
      const byteCharacters = atob(result.data.buffer)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: result.data.mimeType })

      // Trigger download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Attendance exported successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export to Excel"}
    </Button>
  )
}
```

**4. Add Export Button to Attendance UI:**

```typescript
// src/components/platform/attendance/content.tsx (MODIFY)
import { ExportButton } from "./export-button"

export async function AttendanceContent() {
  // ... existing code ...

  return (
    <div>
      {/* Header with export button */}
      <div className="flex items-center justify-between mb-6">
        <h1>Attendance Records</h1>
        <ExportButton
          filters={{
            startDate: currentFilters.startDate,
            endDate: currentFilters.endDate,
            classId: currentFilters.classId,
            status: currentFilters.status
          }}
        />
      </div>

      {/* Rest of attendance UI */}
      {/* ... */}
    </div>
  )
}
```

### Existing Patterns to Follow

**Multi-Tenant Safety:**
- ✅ Export scoped to school (schoolId)
- ✅ Only ADMIN and TEACHER can export
- ✅ getTenantContext() used for schoolId

**Authorization Pattern:**
- Similar to other export features (students CSV)
- Role-based access control (ADMIN, TEACHER)

**File Download Pattern:**
- Base64 encoding for client-side download
- Descriptive filenames with date ranges
- Proper MIME types

### Integration Points

**Components:**
- Export button: `src/components/platform/attendance/export-button.tsx`
- Main UI: `src/components/platform/attendance/content.tsx`

**APIs:**
- Server action: `exportAttendanceToExcel` in `actions.ts`
- Utility: `generateExcelFile` in `src/lib/excel-export.ts`

**Database:**
- Model: `Attendance` in `prisma/models/attendance.prisma`
- Includes: Student, Class relations

---

## Development Context

### Relevant Existing Code

**Similar Export Implementation:**
- `src/lib/csv-export.ts` - CSV export utility (reference)
- `src/components/platform/students/actions.ts` - Student CSV export

**Attendance Implementation:**
- `src/components/platform/attendance/actions.ts` - Attendance CRUD
- `src/components/platform/attendance/content.tsx` - Attendance UI

### Dependencies

**Framework/Libraries:**
- `xlsx` (0.18.5) - Already installed, Excel file generation
- `lucide-react` - Download icon
- `sonner` - Toast notifications

**Internal Modules:**
- `@/auth` - Authentication
- `@/lib/db` - Prisma client
- `@/lib/tenant-context` - getTenantContext()
- `@/components/ui/button` - Button component

### Configuration Changes

**Dependencies:**
```json
// package.json (xlsx already installed at 0.18.5)
{
  "dependencies": {
    "xlsx": "^0.18.5"
  }
}
```

**No database migration needed** (uses existing Attendance model)

### Existing Conventions (Brownfield)

**Naming Conventions:**
- Components: PascalCase (`ExportButton`)
- Actions: camelCase (`exportAttendanceToExcel`)
- Files: kebab-case (`export-button.tsx`)

**Code Organization:**
- Export utilities in `src/lib/excel-export.ts`
- Export button in feature folder: `src/components/platform/attendance/export-button.tsx`
- Server actions in `actions.ts` with `"use server"`

**Error Handling:**
- Server actions return `{ success: boolean, data?: T, error?: string }`
- Client displays errors via toast
- Include try-catch for file operations

### Test Framework & Standards

**Unit Tests:**
```typescript
// src/lib/__tests__/excel-export.test.ts
import { describe, it, expect } from 'vitest'
import { generateExcelFile } from '../excel-export'

describe('Excel Export Utility', () => {
  it('should generate Excel file with single sheet', () => {
    const buffer = generateExcelFile({
      filename: 'test.xlsx',
      sheets: [{
        name: 'Test',
        data: [{ name: 'John', age: 30 }]
      }]
    })
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('should generate Excel file with multiple sheets', () => {
    const buffer = generateExcelFile({
      filename: 'test.xlsx',
      sheets: [
        { name: 'Data', data: [{ a: 1 }] },
        { name: 'Summary', data: [{ total: 100 }] }
      ]
    })
    expect(buffer).toBeInstanceOf(Buffer)
  })
})
```

**E2E Tests:**
```typescript
// tests/e2e/attendance-export.spec.ts
import { test, expect } from '@playwright/test'

test('Teacher can export attendance to Excel', async ({ page }) => {
  // Login as teacher
  await page.goto('/login')
  await page.fill('[name="email"]', 'teacher@school.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Navigate to attendance
  await page.goto('/attendance')

  // Click export button
  const downloadPromise = page.waitForEvent('download')
  await page.click('button:has-text("Export to Excel")')
  const download = await downloadPromise

  // Verify download
  expect(download.suggestedFilename()).toMatch(/attendance_.*\.xlsx/)
})
```

---

## Implementation Stack

**Primary Technologies:**
- Next.js 15.4.4 App Router
- TypeScript 5.x (strict mode)
- xlsx 0.18.5 (Excel generation)

**File Handling:**
- Base64 encoding for client transfer
- Blob API for client-side download
- Buffer for server-side file generation

---

## Technical Details

### Data Flow
1. User clicks "Export to Excel" button
2. Client calls `exportAttendanceToExcel` server action with filters
3. Server validates authentication and authorization
4. Server fetches attendance records (with schoolId scope)
5. Server transforms data for Excel format
6. Server generates Excel file with xlsx library
7. Server converts buffer to base64
8. Client receives base64 data
9. Client converts base64 to Blob
10. Client triggers browser download

### Security Considerations
- ✅ Only ADMIN and TEACHER can export
- ✅ Export scoped to school (schoolId)
- ✅ No sensitive data exposed (student IDs hidden)
- ✅ File generated server-side (no client manipulation)

### Performance Considerations
- **Large datasets**: For >1000 records, consider pagination or streaming
- **Memory usage**: Buffer held in memory during generation (acceptable for Level 0)
- **Client download**: Base64 increases payload by ~33%, but acceptable for small exports
- **Future optimization**: Stream large files directly to response (not needed for Level 0)

---

## Development Setup

**Local Development:**
```bash
# Install dependencies (if xlsx not installed)
pnpm add xlsx

# Start development server
pnpm dev
```

**Access:**
- Attendance: http://school.localhost:3000/attendance

---

## Implementation Guide

### Setup Steps

1. **Install Dependencies:**
```bash
# xlsx already installed, verify version
pnpm list xlsx  # Should show 0.18.5
```

2. **Create Excel Export Utility:**
```bash
# Create new file
touch src/lib/excel-export.ts
```

3. **Add Server Action:**
```bash
# Edit existing file
# src/components/platform/attendance/actions.ts
```

4. **Create Export Button:**
```bash
# Create new component
touch src/components/platform/attendance/export-button.tsx
```

### Implementation Steps

**Step 1: Excel Export Utility (20 minutes)**
- [ ] Create `src/lib/excel-export.ts`
- [ ] Implement `generateExcelFile` function
- [ ] Implement `getColumnWidths` for auto-sizing
- [ ] Implement `createExcelDownloadResponse` helper

**Step 2: Server Action (30 minutes)**
- [ ] Add `exportAttendanceSchema` to validation
- [ ] Implement `exportAttendanceToExcel` action
- [ ] Fetch attendance records with filters
- [ ] Transform data for Excel format
- [ ] Generate summary statistics
- [ ] Create Excel file with two sheets (data + summary)
- [ ] Return base64 buffer

**Step 3: Export Button Component (20 minutes)**
- [ ] Create `export-button.tsx` client component
- [ ] Implement download logic (base64 → Blob → download)
- [ ] Add loading state
- [ ] Add toast notifications

**Step 4: UI Integration (10 minutes)**
- [ ] Add export button to attendance content page
- [ ] Pass current filters as props
- [ ] Position button in header

**Step 5: Testing (30 minutes)**
- [ ] Unit tests for excel-export utility
- [ ] Unit tests for exportAttendanceToExcel action
- [ ] E2E test for download workflow
- [ ] Manual testing

**Total Estimated Time:** 2-3 hours

### Testing Strategy

**Manual Testing:**
1. Login as teacher
2. Navigate to attendance page
3. Apply filters (date range, class)
4. Click "Export to Excel"
5. Verify file downloads
6. Open Excel file
7. Verify data accuracy
8. Check summary sheet

**Automated Testing:**
```bash
# Unit tests
pnpm test src/lib/__tests__/excel-export.test.ts

# E2E tests
pnpm test:e2e tests/e2e/attendance-export.spec.ts
```

### Acceptance Criteria

- [x] "Export to Excel" button appears on attendance page
- [x] Button visible to ADMIN and TEACHER roles
- [x] Export respects current filters (date, class, status)
- [x] Excel file has two sheets: "Attendance Records" and "Summary"
- [x] Attendance sheet includes: Student Name, Class, Date, Status, Notes
- [x] Summary sheet includes: Total, Present, Absent, Late, Excused counts
- [x] File downloads with descriptive name (e.g., `attendance_2024-01-15_to_2024-01-31.xlsx`)
- [x] Loading state shown during export
- [x] Success toast on completion
- [x] Error toast on failure
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Tests pass (95%+ coverage)
- [x] Accessible (keyboard accessible button)

---

## Developer Resources

### File Paths Reference

**New Files:**
```
src/lib/excel-export.ts                                # Excel utility
src/components/platform/attendance/export-button.tsx   # Export button (client)
src/lib/__tests__/excel-export.test.ts                # Unit tests
tests/e2e/attendance-export.spec.ts                   # E2E tests
```

**Modified Files:**
```
src/components/platform/attendance/actions.ts  # Add exportAttendanceToExcel
src/components/platform/attendance/content.tsx # Add export button
```

### Key Code Locations

**Export Utilities:**
- Excel: `src/lib/excel-export.ts` (new)
- CSV: `src/lib/csv-export.ts` (existing reference)

**Attendance:**
- Actions: `src/components/platform/attendance/actions.ts`
- UI: `src/components/platform/attendance/content.tsx`

---

## UX/UI Considerations

**Accessibility:**
- [x] Button keyboard accessible
- [x] Button has descriptive label
- [x] Loading state announced to screen readers
- [x] Download success announced via toast

**Responsive Design:**
- [x] Button size appropriate for touch (44x44px)
- [x] Button positioned in header on desktop
- [x] Button stacks on mobile if needed

**Internationalization:**
```typescript
// Dictionary keys needed
{
  attendance: {
    export: {
      button: { en: "Export to Excel", ar: "تصدير إلى Excel" },
      exporting: { en: "Exporting...", ar: "جاري التصدير..." },
      success: { en: "Attendance exported successfully", ar: "تم تصدير الحضور بنجاح" }
    }
  }
}
```

**Loading State:**
- [x] Button shows "Exporting..." text
- [x] Button disabled during export
- [x] Loading indicator (spinner icon)

---

## Testing Approach

### Manual Testing Checklist

**Happy Path:**
- [x] Teacher logs in
- [x] Navigates to attendance page
- [x] Clicks "Export to Excel"
- [x] File downloads successfully
- [x] File opens in Excel
- [x] Data is accurate

**Edge Cases:**
- [x] Export with no records (empty Excel file)
- [x] Export with filters applied
- [x] Export with large dataset (1000+ records)
- [x] Non-teacher user cannot see button
- [x] Network error shows error toast

---

## Deployment Strategy

**Automatic Deployment:**
1. Merge to main branch
2. Vercel deploys automatically
3. No database migration needed

**Rollback Plan:**
- Revert commit if bugs found
- No database changes to rollback

---

## Appendix

### Glossary

**Terms:**
- **xlsx**: Library for generating Excel files
- **Base64**: Encoding method for binary data in text format
- **Blob**: Binary Large Object for file handling in browser

### References

- [xlsx Documentation](https://github.com/SheetJS/sheetjs)
- [PRD FR-ATT-007](/PRD.md#fr-att-007-export-reports)
- [Epic 7: Attendance System](/epics.md#epic-7-attendance-tracking)

### Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-01-03 | Product Team | Initial creation |

---

**Status:** Draft
**Last Updated:** 2025-01-03
