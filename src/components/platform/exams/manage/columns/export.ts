/**
 * Exam Export Column Definitions
 * Used with unified File Block ExportButton
 */

import { createColumnHelpers, type ExportColumn } from "@/components/platform/file";

// ============================================================================
// Export Data Type
// ============================================================================

export interface ExamExportData {
  id: string;
  title: string;
  description: string | null;
  subjectName: string | null;
  className: string | null;
  examDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  examType: string;
  status: string;
  studentCount: number;
  averageScore: number | null;
  createdAt: Date;
}

// ============================================================================
// Column Helpers
// ============================================================================

const { text, number, date } = createColumnHelpers<ExamExportData>();

// ============================================================================
// Export Columns
// ============================================================================

export const EXAM_EXPORT_COLUMNS: ExportColumn<ExamExportData>[] = [
  text("title", "Exam Title", "عنوان الاختبار"),
  text("description", "Description", "الوصف"),
  text("subjectName", "Subject", "المادة"),
  text("className", "Class", "الفصل"),
  date("examDate", "Exam Date", undefined, "تاريخ الاختبار"),
  text("startTime", "Start Time", "وقت البدء"),
  text("endTime", "End Time", "وقت الانتهاء"),
  number("duration", "Duration (min)", "المدة (دقيقة)"),
  number("totalMarks", "Total Marks", "الدرجة الكلية"),
  number("passingMarks", "Passing Marks", "درجة النجاح"),
  {
    key: "examType",
    header: "Type",
    headerAr: "النوع",
    type: "string",
    format: (value, _row, locale) => {
      const typeMap: Record<string, { en: string; ar: string }> = {
        MIDTERM: { en: "Midterm", ar: "نصفي" },
        FINAL: { en: "Final", ar: "نهائي" },
        QUIZ: { en: "Quiz", ar: "اختبار قصير" },
        MONTHLY: { en: "Monthly", ar: "شهري" },
        PRACTICE: { en: "Practice", ar: "تدريبي" },
      };
      const type = typeMap[String(value)] || { en: String(value), ar: String(value) };
      return locale === "ar" ? type.ar : type.en;
    },
  },
  {
    key: "status",
    header: "Status",
    headerAr: "الحالة",
    type: "string",
    format: (value, _row, locale) => {
      const statusMap: Record<string, { en: string; ar: string }> = {
        DRAFT: { en: "Draft", ar: "مسودة" },
        SCHEDULED: { en: "Scheduled", ar: "مجدول" },
        IN_PROGRESS: { en: "In Progress", ar: "جاري" },
        COMPLETED: { en: "Completed", ar: "مكتمل" },
        GRADED: { en: "Graded", ar: "مصحح" },
        CANCELLED: { en: "Cancelled", ar: "ملغي" },
      };
      const status = statusMap[String(value)] || { en: String(value), ar: String(value) };
      return locale === "ar" ? status.ar : status.en;
    },
  },
  number("studentCount", "Students", "عدد الطلاب"),
  {
    key: "averageScore",
    header: "Average",
    headerAr: "المعدل",
    type: "percentage",
    align: "right",
    format: (value, _row, _locale) => {
      if (value === null || value === undefined) return "-";
      return `${Number(value).toFixed(1)}%`;
    },
  },
  date("createdAt", "Created Date", undefined, "تاريخ الإنشاء"),
];

// ============================================================================
// Compact Export Columns
// ============================================================================

export const EXAM_EXPORT_COLUMNS_COMPACT: ExportColumn<ExamExportData>[] = [
  text("title", "Exam Title", "عنوان الاختبار"),
  text("subjectName", "Subject", "المادة"),
  date("examDate", "Exam Date", undefined, "تاريخ الاختبار"),
  number("totalMarks", "Total Marks", "الدرجة الكلية"),
  {
    key: "status",
    header: "Status",
    headerAr: "الحالة",
    type: "string",
    format: (value, _row, locale) => {
      const statusMap: Record<string, { en: string; ar: string }> = {
        DRAFT: { en: "Draft", ar: "مسودة" },
        SCHEDULED: { en: "Scheduled", ar: "مجدول" },
        IN_PROGRESS: { en: "In Progress", ar: "جاري" },
        COMPLETED: { en: "Completed", ar: "مكتمل" },
        GRADED: { en: "Graded", ar: "مصحح" },
        CANCELLED: { en: "Cancelled", ar: "ملغي" },
      };
      const status = statusMap[String(value)] || { en: String(value), ar: String(value) };
      return locale === "ar" ? status.ar : status.en;
    },
  },
];
