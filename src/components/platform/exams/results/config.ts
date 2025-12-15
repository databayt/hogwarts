// Results Block Configuration

// ========== PDF Templates ==========

export const PDF_TEMPLATES = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "Traditional report card with formal layout",
    preview: "/templates/classic-preview.png",
  },
  modern: {
    id: "modern",
    name: "Modern",
    description: "Visual design with charts and graphs",
    preview: "/templates/modern-preview.png",
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Clean and simple text-based layout",
    preview: "/templates/minimal-preview.png",
  },
} as const

// ========== Grade Colors ==========

export const GRADE_COLORS: Record<string, string> = {
  "A+": "#10B981", // green-500
  A: "#34D399", // green-400
  "B+": "#60A5FA", // blue-400
  B: "#3B82F6", // blue-500
  "C+": "#FBBF24", // yellow-400
  C: "#F59E0B", // amber-500
  D: "#F97316", // orange-500
  F: "#EF4444", // red-500
}

// ========== Performance Ranges ==========

export const PERFORMANCE_RANGES = [
  { min: 90, max: 100, label: "90-100 (Excellent)", color: "#10B981" },
  { min: 80, max: 89, label: "80-89 (Very Good)", color: "#34D399" },
  { min: 70, max: 79, label: "70-79 (Good)", color: "#60A5FA" },
  { min: 60, max: 69, label: "60-69 (Satisfactory)", color: "#FBBF24" },
  { min: 50, max: 59, label: "50-59 (Pass)", color: "#F59E0B" },
  { min: 40, max: 49, label: "40-49 (Marginal)", color: "#F97316" },
  { min: 0, max: 39, label: "0-39 (Fail)", color: "#EF4444" },
]

// ========== PDF Page Sizes (in points, 1 point = 1/72 inch) ==========

export const PAGE_SIZES = {
  A4: {
    width: 595.28, // 210mm
    height: 841.89, // 297mm
  },
  Letter: {
    width: 612, // 8.5 inches
    height: 792, // 11 inches
  },
} as const

// ========== PDF Margins ==========

export const PDF_MARGINS = {
  default: 40,
  header: 60,
  footer: 40,
} as const

// ========== Font Families ==========

export const FONT_FAMILIES = {
  Inter: "Inter",
  Tajawal: "Tajawal",
  Roboto: "Roboto",
  Arial: "Helvetica", // Fallback to Helvetica in PDF
} as const

// ========== Font Sizes ==========

export const FONT_SIZES = {
  title: 24,
  heading1: 18,
  heading2: 14,
  heading3: 12,
  body: 10,
  small: 8,
  caption: 7,
} as const

// ========== Export Formats ==========

export const EXPORT_FORMATS = {
  pdf: {
    id: "pdf",
    name: "PDF",
    icon: "FileText",
    mimeType: "application/pdf",
    extension: ".pdf",
  },
  excel: {
    id: "excel",
    name: "Excel",
    icon: "FileSpreadsheet",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: ".xlsx",
  },
  csv: {
    id: "csv",
    name: "CSV",
    icon: "FileDown",
    mimeType: "text/csv",
    extension: ".csv",
  },
} as const

// ========== Sort Options ==========

export const SORT_OPTIONS = [
  { value: "rank", label: "Rank" },
  { value: "name", label: "Student Name" },
  { value: "marks", label: "Marks Obtained" },
] as const

// ========== Group By Options ==========

export const GROUP_BY_OPTIONS = [
  { value: "none", label: "No Grouping" },
  { value: "grade", label: "Group by Grade" },
  { value: "status", label: "Group by Pass/Fail" },
] as const

// ========== Result Status ==========

export const RESULT_STATUS = {
  PASS: {
    label: "Pass",
    color: "green",
    icon: "CheckCircle",
  },
  FAIL: {
    label: "Fail",
    color: "red",
    icon: "XCircle",
  },
  ABSENT: {
    label: "Absent",
    color: "gray",
    icon: "MinusCircle",
  },
} as const

// ========== Analytics Thresholds ==========

export const ANALYTICS_THRESHOLDS = {
  topPerformers: 5, // Top N students
  needsAttention: 5, // Bottom N students
  highPerformance: 85, // % threshold for high performance
  lowPerformance: 50, // % threshold for needs attention
} as const

// ========== Watermark Settings ==========

export const WATERMARK_SETTINGS = {
  opacity: 0.1,
  rotation: -45,
  fontSize: 48,
  defaultText: "CONFIDENTIAL",
} as const

// ========== Default PDF Options ==========

export const DEFAULT_PDF_OPTIONS = {
  template: "classic" as const,
  includeQuestionBreakdown: true,
  includeGradeDistribution: true,
  includeClassAnalytics: true,
  includeSchoolBranding: true,
  orientation: "portrait" as const,
  pageSize: "A4" as const,
  language: "en" as const,
}

// ========== Chart Colors ==========

export const CHART_COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // green-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // purple-500
  "#EC4899", // pink-500
  "#14B8A6", // teal-500
  "#F97316", // orange-500
]

// ========== Question Type Icons ==========

export const QUESTION_TYPE_ICONS: Record<string, string> = {
  MULTIPLE_CHOICE: "ListChecks",
  TRUE_FALSE: "ToggleLeft",
  SHORT_ANSWER: "MessageSquare",
  ESSAY: "FileText",
  FILL_BLANK: "PenLine",
}
