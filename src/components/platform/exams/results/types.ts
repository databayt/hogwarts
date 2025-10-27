// Results Block Types

import type {
  Exam,
  ExamResult,
  MarkingResult,
  Student,
  Subject,
  Class,
  SchoolBranding,
  GradeBoundary,
} from "@prisma/client";

// ========== Result Data Types ==========

export interface ResultSummary {
  examId: string;
  examTitle: string;
  examDate: Date;
  className: string;
  subjectName: string;
  totalMarks: number;
  passingMarks: number;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  passedStudents: number;
  failedStudents: number;
  averageMarks: number;
  averagePercentage: number;
  highestMarks: number;
  lowestMarks: number;
  gradeDistribution: Record<string, number>;
}

export interface StudentResultDTO {
  id: string;
  studentId: string;
  studentName: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string | null;
  gpa: number | null;
  rank: number;
  isAbsent: boolean;
  remarks: string | null;
  questionBreakdown?: QuestionBreakdown[];
}

export interface QuestionBreakdown {
  questionNumber: number;
  questionText: string;
  questionType: string;
  maxPoints: number;
  pointsAwarded: number;
  isCorrect: boolean;
  feedback: string | null;
}

export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
  gpaValue: number;
  color: string;
}

// ========== PDF Types ==========

export type PDFTemplate = "classic" | "modern" | "minimal";

export interface PDFGenerationOptions {
  template: PDFTemplate;
  includeQuestionBreakdown: boolean;
  includeGradeDistribution: boolean;
  includeClassAnalytics: boolean;
  includeSchoolBranding: boolean;
  orientation: "portrait" | "landscape";
  pageSize: "A4" | "Letter";
  language: "en" | "ar";
}

export interface PDFMetadata {
  generatedAt: Date;
  generatedBy: string;
  schoolName: string;
  academicYear: string;
}

export interface PDFResultData {
  student: StudentResultDTO;
  exam: {
    title: string;
    date: Date;
    className: string;
    subjectName: string;
    totalMarks: number;
    passingMarks: number;
  };
  school: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  analytics?: {
    classAverage: number;
    classRank: number;
    totalStudents: number;
    gradeDistribution: GradeDistribution[];
  };
  metadata: PDFMetadata;
}

export interface BatchPDFRequest {
  examId: string;
  studentIds?: string[]; // If not provided, generate for all students
  options: PDFGenerationOptions;
}

export interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

// ========== Analytics Types ==========

export interface ResultAnalytics {
  examId: string;
  summary: ResultSummary;
  gradeDistribution: GradeDistribution[];
  performanceTrends: PerformanceTrend[];
  topPerformers: StudentResultDTO[];
  needsAttention: StudentResultDTO[];
  questionAnalytics: QuestionAnalytics[];
}

export interface PerformanceTrend {
  range: string; // "90-100", "80-89", etc.
  count: number;
  percentage: number;
}

export interface QuestionAnalytics {
  questionNumber: number;
  questionText: string;
  questionType: string;
  maxPoints: number;
  averagePoints: number;
  successRate: number; // Percentage of students who got it correct
  difficultyPerceived: "Easy" | "Medium" | "Hard";
}

// ========== Form Types ==========

export interface PDFTemplateCustomization {
  headerColor: string;
  fontFamily: string;
  fontSize: number;
  includeWatermark: boolean;
  watermarkText?: string;
  customFooter?: string;
}

export interface ResultExportOptions {
  format: "pdf" | "excel" | "csv";
  includeAbsent: boolean;
  sortBy: "rank" | "name" | "marks";
  groupBy?: "grade" | "status";
}

// ========== Extended Types with Relations ==========

export interface ExamWithResults extends Exam {
  class: Class;
  subject: Subject;
  examResults: (ExamResult & {
    student: Student;
  })[];
  markingResults?: MarkingResult[];
}

export interface SchoolBrandingData extends SchoolBranding {
  school: {
    name: string;
  };
}

// ========== UI Component Props ==========

export interface ResultsTableProps {
  results: StudentResultDTO[];
  examId: string;
  onDownloadPDF: (studentId: string) => void;
  onBatchDownload: () => void;
}

export interface ResultAnalyticsDashboardProps {
  analytics: ResultAnalytics;
  examId: string;
}

export interface PDFPreviewProps {
  data: PDFResultData;
  template: PDFTemplate;
  onDownload: () => void;
  onCancel: () => void;
}

export interface TemplateSelectionProps {
  selectedTemplate: PDFTemplate;
  onSelect: (template: PDFTemplate) => void;
  customization?: PDFTemplateCustomization;
}

// ========== Calculator Types ==========

export interface GradeCalculationInput {
  percentage: number;
  boundaries: GradeBoundary[];
}

export interface GradeCalculationResult {
  grade: string;
  gpaValue: number;
  color: string;
  description: string;
}

export interface MarkSummation {
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  grade: string;
  gpa: number;
  passFail: "Pass" | "Fail";
}

// ========== Action Return Types ==========

export interface GetResultsResponse {
  success: boolean;
  data?: StudentResultDTO[];
  error?: string;
}

export interface GetAnalyticsResponse {
  success: boolean;
  data?: ResultAnalytics;
  error?: string;
}

export interface GeneratePDFResponse {
  success: boolean;
  data?: PDFGenerationResult;
  error?: string;
}

export interface BatchPDFResponse {
  success: boolean;
  data?: {
    zipUrl: string;
    fileCount: number;
    totalSize: number;
  };
  error?: string;
}
