/**
 * Assignment Export Column Definitions
 * Used with unified File Block ExportButton
 */

import { createColumnHelpers, type ExportColumn } from "@/components/file"

// ============================================================================
// Export Data Type
// ============================================================================

export interface AssignmentExportData {
  id: string
  title: string
  description: string | null
  className: string | null
  subjectName: string | null
  teacherName: string | null
  dueDate: Date | null
  totalPoints: number | null
  status: string
  submissionCount: number
  gradedCount: number
  createdAt: Date
}

// ============================================================================
// Column Helpers
// ============================================================================

const { text, number, date } = createColumnHelpers<AssignmentExportData>()

// ============================================================================
// Export Columns
// ============================================================================

export const ASSIGNMENT_EXPORT_COLUMNS: ExportColumn<AssignmentExportData>[] = [
  text("title", "Title", "العنوان"),
  text("description", "Description", "الوصف"),
  text("className", "Class", "الفصل"),
  text("subjectName", "Subject", "المادة"),
  text("teacherName", "Teacher", "المعلم"),
  date("dueDate", "Due Date", undefined, "تاريخ التسليم"),
  number("totalPoints", "Total Points", "مجموع النقاط"),
  {
    key: "status",
    header: "Status",
    headerAr: "الحالة",
    type: "string",
    format: (value, _row, locale) => {
      const statusMap: Record<string, { en: string; ar: string }> = {
        DRAFT: { en: "Draft", ar: "مسودة" },
        PUBLISHED: { en: "Published", ar: "منشور" },
        ACTIVE: { en: "Active", ar: "نشط" },
        CLOSED: { en: "Closed", ar: "مغلق" },
        ARCHIVED: { en: "Archived", ar: "مؤرشف" },
      }
      const status = statusMap[String(value)] || {
        en: String(value),
        ar: String(value),
      }
      return locale === "ar" ? status.ar : status.en
    },
  },
  number("submissionCount", "Submissions", "عدد التسليمات"),
  number("gradedCount", "Graded", "المصححة"),
  date("createdAt", "Created Date", undefined, "تاريخ الإنشاء"),
]

// ============================================================================
// Compact Export Columns
// ============================================================================

export const ASSIGNMENT_EXPORT_COLUMNS_COMPACT: ExportColumn<AssignmentExportData>[] =
  [
    text("title", "Title", "العنوان"),
    text("className", "Class", "الفصل"),
    date("dueDate", "Due Date", undefined, "تاريخ التسليم"),
    number("submissionCount", "Submissions", "عدد التسليمات"),
  ]
