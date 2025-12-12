/**
 * Teacher Export Column Definitions
 * Used with unified File Block ExportButton
 */

import { createColumnHelpers, type ExportColumn } from "@/components/platform/file";

// ============================================================================
// Export Data Type
// ============================================================================

export interface TeacherExportData {
  id: string;
  employeeId: string | null;
  givenName: string;
  surname: string;
  fullName: string;
  gender: string;
  email: string | null;
  userEmail: string | null;
  phone: string | null;
  department: string | null;
  qualification: string | null;
  specialization: string | null;
  hireDate: Date | null;
  status: string;
  createdAt: Date;
}

// ============================================================================
// Column Helpers
// ============================================================================

const { text, date, custom } = createColumnHelpers<TeacherExportData>();

// ============================================================================
// Export Columns
// ============================================================================

export const TEACHER_EXPORT_COLUMNS: ExportColumn<TeacherExportData>[] = [
  text("employeeId", "Employee ID", "رقم الموظف"),
  custom(
    "fullName",
    "Full Name",
    (row) => [row.givenName, row.surname].filter(Boolean).join(" "),
    "الاسم الكامل"
  ),
  text("givenName", "First Name", "الاسم الأول"),
  text("surname", "Last Name", "اسم العائلة"),
  {
    key: "gender",
    header: "Gender",
    headerAr: "الجنس",
    type: "string",
    format: (value, _row, locale) => {
      const genderMap: Record<string, { en: string; ar: string }> = {
        male: { en: "Male", ar: "ذكر" },
        female: { en: "Female", ar: "أنثى" },
        MALE: { en: "Male", ar: "ذكر" },
        FEMALE: { en: "Female", ar: "أنثى" },
      };
      const gender = genderMap[String(value)] || { en: String(value), ar: String(value) };
      return locale === "ar" ? gender.ar : gender.en;
    },
  },
  text("email", "Email", "البريد الإلكتروني"),
  text("phone", "Phone", "الهاتف"),
  text("department", "Department", "القسم"),
  text("qualification", "Qualification", "المؤهل"),
  text("specialization", "Specialization", "التخصص"),
  date("hireDate", "Hire Date", undefined, "تاريخ التعيين"),
  {
    key: "status",
    header: "Status",
    headerAr: "الحالة",
    type: "string",
    format: (value, _row, locale) => {
      const statusMap: Record<string, { en: string; ar: string }> = {
        Active: { en: "Active", ar: "نشط" },
        Inactive: { en: "Inactive", ar: "غير نشط" },
        ACTIVE: { en: "Active", ar: "نشط" },
        INACTIVE: { en: "Inactive", ar: "غير نشط" },
      };
      const status = statusMap[String(value)] || { en: String(value), ar: String(value) };
      return locale === "ar" ? status.ar : status.en;
    },
  },
  date("createdAt", "Created Date", undefined, "تاريخ الإنشاء"),
];

// ============================================================================
// Compact Export Columns
// ============================================================================

export const TEACHER_EXPORT_COLUMNS_COMPACT: ExportColumn<TeacherExportData>[] = [
  text("employeeId", "Employee ID", "رقم الموظف"),
  custom(
    "fullName",
    "Full Name",
    (row) => [row.givenName, row.surname].filter(Boolean).join(" "),
    "الاسم الكامل"
  ),
  text("email", "Email", "البريد الإلكتروني"),
  text("department", "Department", "القسم"),
  {
    key: "status",
    header: "Status",
    headerAr: "الحالة",
    type: "string",
    format: (value, _row, locale) => {
      const statusMap: Record<string, { en: string; ar: string }> = {
        Active: { en: "Active", ar: "نشط" },
        Inactive: { en: "Inactive", ar: "غير نشط" },
      };
      const status = statusMap[String(value)] || { en: String(value), ar: String(value) };
      return locale === "ar" ? status.ar : status.en;
    },
  },
];
