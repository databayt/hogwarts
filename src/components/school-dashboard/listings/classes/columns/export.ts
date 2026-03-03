// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
  subjectName: string | null
  teacherName: string | null
  termName: string | null
  capacity: number | null
  studentCount: number
  room: string | null
  createdAt: Date
}

// ============================================================================
// Column Helpers
// ============================================================================

const { text, number, date } = createColumnHelpers<ClassExportData>()

// ============================================================================
// Export Columns
// ============================================================================

export const CLASS_EXPORT_COLUMNS: ExportColumn<ClassExportData>[] = [
  text("name", "Class Name", "اسم الفصل"),
  text("code", "Class Code", "رمز الفصل"),
  text("subjectName", "Subject", "المادة"),
  text("teacherName", "Teacher", "المعلم"),
  text("termName", "Term", "الفصل الدراسي"),
  number("capacity", "Capacity", "السعة"),
  number("studentCount", "Students", "عدد الطلاب"),
  text("room", "Room", "القاعة"),
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
