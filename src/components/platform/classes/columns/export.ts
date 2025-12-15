/**
 * Class Export Column Definitions
 * Used with unified File Block ExportButton
 */

import { createColumnHelpers, type ExportColumn } from "@/components/file"

// ============================================================================
// Export Data Type
// ============================================================================

export interface ClassExportData {
  id: string
  name: string
  code: string | null
  description: string | null
  subjectName: string | null
  teacherName: string | null
  termName: string | null
  yearLevelName: string | null
  capacity: number | null
  studentCount: number
  schedule: string | null
  room: string | null
  isActive: boolean
  createdAt: Date
}

// ============================================================================
// Column Helpers
// ============================================================================

const { text, number, date, boolean } = createColumnHelpers<ClassExportData>()

// ============================================================================
// Export Columns
// ============================================================================

export const CLASS_EXPORT_COLUMNS: ExportColumn<ClassExportData>[] = [
  text("name", "Class Name", "اسم الفصل"),
  text("code", "Class Code", "رمز الفصل"),
  text("description", "Description", "الوصف"),
  text("subjectName", "Subject", "المادة"),
  text("teacherName", "Teacher", "المعلم"),
  text("termName", "Term", "الفصل الدراسي"),
  text("yearLevelName", "Year Level", "المستوى الدراسي"),
  number("capacity", "Capacity", "السعة"),
  number("studentCount", "Students", "عدد الطلاب"),
  text("schedule", "Schedule", "الجدول"),
  text("room", "Room", "القاعة"),
  {
    key: "isActive",
    header: "Active",
    headerAr: "نشط",
    type: "boolean",
    align: "center",
    format: (value, _row, locale) => {
      const bool = Boolean(value)
      if (locale === "ar") {
        return bool ? "نعم" : "لا"
      }
      return bool ? "Yes" : "No"
    },
  },
  date("createdAt", "Created Date", undefined, "تاريخ الإنشاء"),
]

// ============================================================================
// Compact Export Columns
// ============================================================================

export const CLASS_EXPORT_COLUMNS_COMPACT: ExportColumn<ClassExportData>[] = [
  text("name", "Class Name", "اسم الفصل"),
  text("subjectName", "Subject", "المادة"),
  text("teacherName", "Teacher", "المعلم"),
  number("studentCount", "Students", "عدد الطلاب"),
]
