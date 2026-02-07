# Attendance Bulk Operations

Server actions for bulk attendance management including uploads, reporting, and statistics.

## Overview

The bulk operations module provides atomic, transactional functions for managing attendance at scale:

- **Bulk Upload**: Upload 100s of attendance records in one transaction
- **Reporting**: Filter and export attendance data with pagination
- **Statistics**: Calculate attendance rates per class or student
- **Export**: CSV export for reporting and analysis

## API Reference

### `bulkUploadAttendance(input)`

Upload multiple attendance records with atomic transaction support.

**Features:**

- Pre-validates all records before any DB operations
- Rollback entire operation if any error occurs
- Updates existing records, creates new ones
- Soft-delete support (respects `deletedAt` field)

**Parameters:**

```typescript
{
  classId: string // Which class
  date: string // Date in YYYY-MM-DD format
  method: string // "BULK_UPLOAD" (default)
  records: Array<{
    studentId: string // Student to mark
    status: string // PRESENT | ABSENT | LATE | EXCUSED | SICK | HOLIDAY
    checkInTime?: string // Optional ISO time
    checkOutTime?: string // Optional ISO time
    notes?: string // Optional notes (max 500 chars)
  }>
}
```

**Returns:**

```typescript
{
  successful: number // Records successfully created/updated
  failed: number // Records that failed validation
  errors: Array<{
    studentId: string // Which student
    row: number // Row number in input
    error: string // Error message
  }>
  rolledBack: boolean // Whether entire transaction was rolled back
}
```

**Example:**

```typescript
const result = await bulkUploadAttendance({
  classId: "class-123",
  date: "2024-01-15",
  records: [
    { studentId: "student-1", status: "PRESENT" },
    { studentId: "student-2", status: "ABSENT", notes: "Sick" },
    { studentId: "student-3", status: "LATE" },
  ],
})

if (result.successful === 3) {
  console.log("✓ All records uploaded")
} else {
  console.log(`Uploaded ${result.successful}, failed ${result.failed}`)
  result.errors.forEach((err) => console.log(`Row ${err.row}: ${err.error}`))
}
```

### `getAttendanceReport(input)`

Fetch paginated attendance records with optional filtering.

**Parameters:**

```typescript
{
  classId?: string         // Filter by class
  studentId?: string       // Filter by student
  dateFrom?: string        // Start date (YYYY-MM-DD)
  dateTo?: string          // End date (YYYY-MM-DD)
  status?: string | string[] // PRESENT | ABSENT | LATE | EXCUSED | SICK | HOLIDAY
  method?: string | string[] // MANUAL | QR_CODE | GEOFENCE | BIOMETRIC | etc.
  limit: number            // Records per page (default 100, max 5000)
  offset: number           // Pagination offset (default 0)
}
```

**Returns:**

```typescript
{
  success: true
  records: Array<{
    id: string
    date: string // ISO date (YYYY-MM-DD)
    studentId: string
    studentName: string // "First Last"
    classId: string
    className: string
    status: string
    method: string
    checkInTime?: string // ISO time
    checkOutTime?: string // ISO time
    notes?: string
  }>
  pagination: {
    total: number // Total records matching filter
    page: number // Current page
    pageSize: number // Records per page
    totalPages: number // Total pages available
  }
}
```

**Example:**

```typescript
// Get January attendance for class 10A
const report = await getAttendanceReport({
  classId: "class-10a",
  dateFrom: "2024-01-01",
  dateTo: "2024-01-31",
  limit: 50,
  offset: 0,
})

// Display results
report.records.forEach((record) => {
  console.log(`${record.date} - ${record.studentName}: ${record.status}`)
})

// Handle pagination
if (report.pagination.page < report.pagination.totalPages) {
  const nextPage = await getAttendanceReport({
    classId: "class-10a",
    limit: 50,
    offset: report.pagination.page * 50,
  })
}
```

### `getAttendanceReportCsv(input)`

Export attendance data as CSV string.

**Parameters:**

```typescript
{
  classId?: string         // Filter by class
  studentId?: string       // Filter by student
  status?: string          // Single status filter
  from?: string            // Start date
  to?: string              // End date
  limit?: number           // Max records (default 1000, max 5000)
}
```

**Returns:**
CSV string with header and data rows.

**Example:**

```typescript
const csv = await getAttendanceReportCsv({
  classId: "class-123",
  from: "2024-01-01",
  to: "2024-01-31",
})

// Save to file
const blob = new Blob([csv], { type: "text/csv" })
const url = URL.createObjectURL(blob)
const a = document.createElement("a")
a.href = url
a.download = "attendance-jan-2024.csv"
a.click()
```

### `getRecentBulkUploads(limit?)`

Get summary of recent bulk uploads grouped by class and date.

**Parameters:**

```typescript
limit?: number  // Number of recent uploads to return (default 5)
```

**Returns:**

```typescript
{
  uploads: Array<{
    date: Date
    classId: string
    className: string
    total: number // Total records uploaded
    successful: number // PRESENT or LATE
    failed: number // ABSENT, EXCUSED, SICK, HOLIDAY
  }>
}
```

**Example:**

```typescript
const { uploads } = await getRecentBulkUploads(10)

uploads.forEach((upload) => {
  const rate = ((upload.successful / upload.total) * 100).toFixed(1)
  console.log(`${upload.className} on ${upload.date}: ${rate}% attendance`)
})
```

### `getClassAttendanceStats(input)`

Get attendance statistics for a class.

**Parameters:**

```typescript
{
  classId: string
  dateFrom?: string      // Optional date range
  dateTo?: string
}
```

**Returns:**

```typescript
{
  success: true
  stats: {
    present: number
    absent: number
    late: number
    excused: number
    sick: number
    holiday: number
    total: number
    attendanceRate: number // 0-100 percentage
  }
}
```

### `getStudentAttendanceStats(input)`

Get attendance statistics for a student.

**Parameters:**

```typescript
{
  studentId: string
  classId?: string       // Optional class filter
  dateFrom?: string
  dateTo?: string
}
```

**Returns:**

```typescript
{
  success: true
  stats: {
    present: number
    absent: number
    late: number
    excused: number
    sick: number
    holiday: number
    total: number
    attendanceRate: number // 0-100 percentage
  }
}
```

### `deleteAttendanceRecord(attendanceId)`

Soft-delete an attendance record.

**Parameters:**

```typescript
attendanceId: string // Record to delete
```

**Returns:**

```typescript
{
  success: true
  record: Attendance // Deleted record with deletedAt timestamp
}
```

## Multi-Tenant Safety

All operations automatically scope queries by `schoolId`:

```typescript
// ✓ SAFE - scoped by schoolId from session
const result = await bulkUploadAttendance({
  classId: "class-123",
  date: "2024-01-15",
  records: [...]
})

// ✗ NEVER - manually passing schoolId breaks auth layer
// (getTenantContext already provides schoolId)
const result = await bulkUploadAttendance({
  classId: "class-123",
  date: "2024-01-15",
  records: [...],
  schoolId: "school-123"  // ← Wrong! Don't do this
})
```

## Atomic Transactions

Bulk upload uses Prisma transactions to ensure atomicity:

```typescript
// All records created/updated OR all rolled back
await db.$transaction(async (tx) => {
  for (const record of records) {
    if (existing) {
      await tx.attendance.update(...)
    } else {
      await tx.attendance.create(...)
    }
  }
})

// If ANY operation fails, entire transaction rolls back
// Returns { successful: 0, failed: count, errors: [...], rolledBack: true }
```

## CSV Export Format

```csv
date,studentId,studentName,classId,className,status,method,checkInTime,checkOutTime,notes
2024-01-15,student-1,Ahmed Hassan,class-10a,Grade 10A,PRESENT,BULK_UPLOAD,,,
2024-01-15,student-2,Fatima Ahmed,class-10a,Grade 10A,ABSENT,BULK_UPLOAD,,,Sick
2024-01-15,student-3,Omar Mohamed,class-10a,Grade 10A,LATE,BULK_UPLOAD,09:15:00,,Traffic
```

## Performance Considerations

### Bulk Upload

- Pre-validates all records before ANY database operations
- Single transaction for all creates/updates
- Returns immediately on validation error (no DB hits)
- Suitable for 100s-1000s of records per upload

### Report Queries

- Pagination required for large date ranges (use `limit` and `offset`)
- Indexes on `schoolId`, `date`, `status`, `method`
- Date range filtering is indexed
- Filtering by `classId` or `studentId` is fast

### Statistics

- Runs parallel count queries (present, absent, late, etc.)
- Good for dashboards with multiple stat cards
- Respects date range filters

### CSV Export

- Limited to 5000 records max (protect against memory issues)
- Single sequential query (not parallelized)
- Suitable for reports and archival

## Error Handling

### Pre-Validation Errors

Errors during validation phase return immediately without DB operations:

```typescript
const result = await bulkUploadAttendance({
  classId: "nonexistent",
  date: "2024-01-15",
  records: [...]
})

// Returns immediately:
// {
//   successful: 0,
//   failed: count,
//   errors: [{ error: "Class not found in this school" }],
//   rolledBack: true
// }
```

### Transaction Errors

If any create/update fails during transaction, entire operation rolls back:

```typescript
// Suppose one student update fails during transaction
// Result:
// {
//   successful: 0,
//   failed: count,
//   errors: [{ error: "Transaction failed: ..." }],
//   rolledBack: true
// }
```

## Testing

See `bulk.test.ts` for comprehensive test coverage:

```bash
pnpm test -- bulk.test.ts
```

Tests cover:

- Multi-tenant isolation (schoolId validation)
- Authentication checks
- Student/class existence validation
- Transaction rollback on errors
- Successful upload scenarios
- Filter and pagination logic
- Statistics calculations

## Integration Examples

### Bulk Upload from CSV File

```typescript
// components/attendance/bulk-upload-form.tsx
async function handleBulkUpload(file: File, classId: string) {
  const records = await parseCSV(file)
  const today = new Date().toISOString().split("T")[0]

  const result = await bulkUploadAttendance({
    classId,
    date: today,
    records: records.map((r) => ({
      studentId: r.studentId,
      status: r.status.toUpperCase(),
      notes: r.notes,
    })),
  })

  if (result.successful === records.length) {
    toast.success(`Uploaded ${result.successful} records`)
  } else {
    toast.error(`Failed: ${result.errors.length} errors`)
    result.errors.forEach((err) => {
      console.log(`Row ${err.row}: ${err.error}`)
    })
  }
}
```

### Attendance Report Table

```typescript
// components/attendance/report-table.tsx
async function loadReport(filters: FilterInput) {
  const report = await getAttendanceReport({
    classId: filters.class,
    dateFrom: filters.from,
    dateTo: filters.to,
    limit: 50,
    offset: 0,
  })

  return <DataTable data={report.records} pagination={report.pagination} />
}
```

### Dashboard Statistics

```typescript
// components/attendance/dashboard.tsx
const [classStats, studentStats] = await Promise.all([
  getClassAttendanceStats({ classId: "class-123" }),
  getStudentAttendanceStats({ studentId: "student-456" }),
])

return (
  <div className="grid gap-4">
    <Card>
      <h3>Class Attendance: {classStats.stats.attendanceRate}%</h3>
      <p>Present: {classStats.stats.present}</p>
      <p>Absent: {classStats.stats.absent}</p>
    </Card>
    <Card>
      <h3>Student Attendance: {studentStats.stats.attendanceRate}%</h3>
      <p>Present: {studentStats.stats.present}</p>
      <p>Absent: {studentStats.stats.absent}</p>
    </Card>
  </div>
)
```

## Related Files

- **Validation**: `/src/components/school-dashboard/attendance/shared/validation.ts`
- **Shared Hooks**: `/src/components/school-dashboard/attendance/shared/hooks.ts`
- **Types**: `/src/components/school-dashboard/attendance/shared/types.ts`
- **Prisma Models**: `/prisma/models/attendance.prisma`
