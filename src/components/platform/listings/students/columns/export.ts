/**
 * Student Export Column Definitions
 * Used with unified File Block ExportButton
 */

import { createColumnHelpers, type ExportColumn } from "@/components/file"

// ============================================================================
// Export Data Type
// ============================================================================

export interface StudentExportData {
  id: string
  studentId: string | null
  grNumber: string | null
  givenName: string
  middleName: string | null
  surname: string
  fullName: string
  dateOfBirth: Date | null
  gender: string
  email: string | null
  mobileNumber: string | null
  status: string
  studentType: string
  enrollmentDate: Date
  admissionNumber: string | null
  nationality: string | null
  className: string | null
  yearLevel: string | null
  guardianName: string | null
  guardianPhone: string | null
  createdAt: Date
}

// ============================================================================
// Column Helpers
// ============================================================================

const { text, date, custom } = createColumnHelpers<StudentExportData>()

// ============================================================================
// Export Columns
// ============================================================================

export const STUDENT_EXPORT_COLUMNS: ExportColumn<StudentExportData>[] = [
  text("studentId", "Student ID", "رقم الطالب"),
  text("grNumber", "GR Number", "رقم السجل العام"),
  custom(
    "fullName",
    "Full Name",
    (row) =>
      [row.givenName, row.middleName, row.surname].filter(Boolean).join(" "),
    "الاسم الكامل"
  ),
  text("givenName", "First Name", "الاسم الأول"),
  text("middleName", "Middle Name", "الاسم الأوسط"),
  text("surname", "Last Name", "اسم العائلة"),
  date("dateOfBirth", "Date of Birth", undefined, "تاريخ الميلاد"),
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
      }
      const gender = genderMap[String(value)] || {
        en: String(value),
        ar: String(value),
      }
      return locale === "ar" ? gender.ar : gender.en
    },
  },
  text("email", "Email", "البريد الإلكتروني"),
  text("mobileNumber", "Mobile", "الجوال"),
  {
    key: "status",
    header: "Status",
    headerAr: "الحالة",
    type: "string",
    format: (value, _row, locale) => {
      const statusMap: Record<string, { en: string; ar: string }> = {
        ACTIVE: { en: "Active", ar: "نشط" },
        INACTIVE: { en: "Inactive", ar: "غير نشط" },
        SUSPENDED: { en: "Suspended", ar: "موقوف" },
        GRADUATED: { en: "Graduated", ar: "متخرج" },
        TRANSFERRED: { en: "Transferred", ar: "منتقل" },
        DROPPED_OUT: { en: "Dropped Out", ar: "منسحب" },
      }
      const status = statusMap[String(value)] || {
        en: String(value),
        ar: String(value),
      }
      return locale === "ar" ? status.ar : status.en
    },
  },
  {
    key: "studentType",
    header: "Type",
    headerAr: "النوع",
    type: "string",
    format: (value, _row, locale) => {
      const typeMap: Record<string, { en: string; ar: string }> = {
        REGULAR: { en: "Regular", ar: "منتظم" },
        TRANSFER: { en: "Transfer", ar: "محول" },
        INTERNATIONAL: { en: "International", ar: "دولي" },
        EXCHANGE: { en: "Exchange", ar: "تبادل" },
      }
      const type = typeMap[String(value)] || {
        en: String(value),
        ar: String(value),
      }
      return locale === "ar" ? type.ar : type.en
    },
  },
  date("enrollmentDate", "Enrollment Date", undefined, "تاريخ التسجيل"),
  text("admissionNumber", "Admission No.", "رقم القبول"),
  text("nationality", "Nationality", "الجنسية"),
  text("className", "Class", "الفصل"),
  text("yearLevel", "Year Level", "المستوى الدراسي"),
  text("guardianName", "Guardian Name", "اسم ولي الأمر"),
  text("guardianPhone", "Guardian Phone", "هاتف ولي الأمر"),
  date("createdAt", "Created Date", undefined, "تاريخ الإنشاء"),
]

// ============================================================================
// Compact Export Columns (fewer columns for quick exports)
// ============================================================================

export const STUDENT_EXPORT_COLUMNS_COMPACT: ExportColumn<StudentExportData>[] =
  [
    text("studentId", "Student ID", "رقم الطالب"),
    custom(
      "fullName",
      "Full Name",
      (row) =>
        [row.givenName, row.middleName, row.surname].filter(Boolean).join(" "),
      "الاسم الكامل"
    ),
    text("email", "Email", "البريد الإلكتروني"),
    text("className", "Class", "الفصل"),
    {
      key: "status",
      header: "Status",
      headerAr: "الحالة",
      type: "string",
      format: (value, _row, locale) => {
        const statusMap: Record<string, { en: string; ar: string }> = {
          ACTIVE: { en: "Active", ar: "نشط" },
          INACTIVE: { en: "Inactive", ar: "غير نشط" },
          SUSPENDED: { en: "Suspended", ar: "موقوف" },
          GRADUATED: { en: "Graduated", ar: "متخرج" },
          TRANSFERRED: { en: "Transferred", ar: "منتقل" },
          DROPPED_OUT: { en: "Dropped Out", ar: "منسحب" },
        }
        const status = statusMap[String(value)] || {
          en: String(value),
          ar: String(value),
        }
        return locale === "ar" ? status.ar : status.en
      },
    },
  ]
